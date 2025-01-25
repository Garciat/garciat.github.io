---
title:        "Understanding Go interfaces"
date:         2024-05-08
description:  "I explore the implementation details of Go interfaces."
tags:
  - Go
  - Tutorial
---

## Introduction

We usually write very simple code (as we should) where a single type implements
a single interface, and we export the interface but hide the implementation.
Classic. We learned that in OOP 101.

```go
type Controller interface {
  // public methods
}

func New(...) Controller { return &controller{ ... } }

type controller struct { ... } // concrete type

// public methods implementations
func (c *controller) Method1() { ... }
// maybe some private methods
func (c *controller) private1() { ... }

// git commit. arc diff. arc land. go home!
```

But Golang is not an OO language. In fact, its interfaces are outright bizarre
to someone coming from e.g. Java. Why? Because we never declare that we want to
implement an interface. It ‘just works’. We can fabricate anonymous interfaces
from thin air and, as long as the methods match, cast any type into it; even
types that are owned by different packages and are separately compiled.

```go
// defined somewhere inside the standard library; already compiled in a shared object
package io
type File struct { ... }
func Open() *File { ... }
func (f *File) Write() { ... }
func (f *File) Flush() { ... }
func (f *File) Close() { ... }

// our own code
package main
import "io"
func main() {
  // we can come up with an anonymous interface with some methods
  var what interface { Flush(); Close() }
  what = Open() // casting an `*io.File` to it just works 🤷‍♂️
  what.Flush()
  what.Close()
}
```

Of course, we may have read some tutorials (or even
[the language spec](https://go.dev/ref/spec)) so we are aware of Go’s semantics.
It may be bizarre, but it is explained by the rules of the language.

But… have you ever wondered HOW that works? After all, this isn’t JavaScript; Go
is compiled to machine code ahead of time. What kind of magic is the compiler
pulling off to get this to run?

Well, let’s find out.

First, we will review a few bits and pieces of Golang that are relevant to our
exploration. I will also introduce what I call Go-- (Go minus minus), which will
aid us in understanding compilation without reading assembly code.

Then, we will dive deep into Go’s runtime and compiler transformations relevant
to types and interfaces. At each step, we will decompile Go into Go-- and try to
understand what’s going on.

## Review

### Types

This is a quick overview of the kinds of types available in Go.

```go
// === Basic types (primitives, slices, maps, structs, channels, pointers)
var a int
var b float32
var c []int
var d map[string]string
var e struct { x, y int }
var f chan int
var g *int
// i.e. any type that can be instantiated

// === Basic Interfaces
var a interface { M() }
var b interface { M(); N(int) }
var c1 interface {}
var c2 any // same as above
// (let's ignore general interfaces for now)

// === Defined types
type A int
type B []int
type C struct { x, y int }
type D interface { M() }
type E *int
// different from _type alias_
type F = int
// because only defined types can be method receivers (with exceptions)
func (a A) Hello() {} // OK
func (b B) Hello() {} // OK
func (c C) Hello() {} // OK
func (d D) Hello() {} // NO: D is an interface type
func (e E) Hello() {} // NO: E is a pointer type (weird, to me)
func (f F) Hello() {} // NO: F is an alias
```

### Implementing interfaces

Interfaces are
[structurally-typed](https://en.wikipedia.org/wiki/Structural_type_system) (vs.
nominal in e.g. Java)

Given a non-interface type X and an interface A; if X has methods of A, then X
implements A. Without any explicitly-declared intent to implement A!

```go
package main

type A interface {
  M()
  N()
}

type X struct{}
func (x X) M() {}
func (x X) N() {}

var a A = X{} // OK!

var b interface{ M(); N() } = X{} // Also OK!
```

### Method receivers

```go
package main

type X struct{}
func (x X) M() {}  // value receiver
func (x *X) N() {} // pointer receiver

func exampleX(x X) {
  x.M()
  x.N() // OK: compiler takes address of `x` for me (allocates if `x` escapes in `N`)
}
func examplePtrX(x *X) {
  x.M() // OK: compiler makes a copy of `x` in the stack for me
  x.N()
}
```

The above roughly compiles to:

```go
func `main.X.M`(x X) {} // receiver becomes the first parameter
func `main.(*X).N`(x *X) {}

func `main.exampleX`(x X) {
  `main.X.M`(x)
  `main.(*X).N`(&x) // if escape analysis knows that this pointer can escape
                    // then the parameter `x` is copied to a new heap-allocated X
                    // and from then on, `x` refers to the value in the heap
                    // and forgets about the value received in the stack argument.
                    // example here (but that's a different talk!)
}

func `main.examplePtrX`(x *X) {
  var stackX X = *x
  `main.X.M`(stackX)
  `main.(*X).N`(x)
}
```

The above code is our first Go-- snippet. Note how the function names were
replaced by their linker symbol names. (This will be relevant later on.)

☝️ A linker symbol represents a named address into a compiled binary (executable
or shared object). A symbol may either point to a segment of compiled machine
code (referred to as ‘text’); or a global variable; or a static read-only
resource.

The Go compiler will prefix symbols with package paths/names, as well as unique
prefixes like “type:”. The goal is for symbols not to clash with each other.

PS: Go-- is an example of “lowering”, a compilation technique that consists of
rewriting more complex semantic constructs in terms of simpler ones. Throughout
this document, we perform lowering on the specific constructs that we care about
understanding.

## Let’s Go

### Runtime type information (RTTI)

The compiler stores a runtime representation of types in the compiled binary.

This information is used for reflection and other runtime capabilities (like
dynamic casting).

The structure of this information is defined in
[internal/abi/type.go](https://github.com/golang/go/blob/5122a6796ef98e3453c994c95abd640596540bea/src/internal/abi/type.go).

ABI stands for “application binary interface”. It is similar to an API, but
specially concerned with memory access compatibility across Go binaries (through
memory layout, register use, etc.).

```go
package abi

// Type is the runtime representation of a Go type.
type Type struct {
  Size_       uintptr
  // ... etc ... a lot of information about the type
}

type StructType struct {
  Type
  PkgPath Name
  Fields  []StructField
}

type InterfaceType struct {
  Type
  PkgPath Name
  Methods []Imethod
}

// and so on ... for ArrayType, ChanType, MapType, FuncType, etc.
```

### Compiling a type

All types (primitive types, user-defined types, and even anonymous types) must
be compiled in terms of their runtime type information as described in the
previous section. This is necessary because all values may be reflected on.

Given this source code:

```go
package main

type X struct { x, y int }
func (x X) M(int) string { return "hi" }
```

It (roughly) compiles to the following code. Here, I use “const” variables to
represent the RTTI metadata that is embedded into the Go compiled binary. (In
reality, it happens in a very different way.)

```go
import "internal/abi"
import "runtime/symtab"

// * this is not the exact type/data; for illustration purposes only
const `type:main.X` abi.StructType = {
    Size_: 8,
    // ...
    Fields: // info about fields x and y
    Methods: [1]abi.Method{ ... }, // actually lives in 'StructUncommon'
}

// Methods become plain functions; receiver is the first parameter
func `main.X.M`(x X) {}
```

The takeaway here is that the compiler generates a lot of metadata about types
and embeds it into the final compiled binary. As mentioned earlier, this
information is necessary for reflection and other runtime capabilities.

### Interface value representation

A value of an interface type is represented at runtime as a data pointer + a
type information ‘header’. The compiler calls this an “iface”.

An “iface” value is not allocated; it is passed around by-value as a
struct/tuple/pair of those two components. This stands in contrast to languages
like Java or even C++ that must allocate the object header along with the object
data. Go does not pay this cost upfront; and when it is needed, it only occupies
stack space (or registers). In other words, we only pay for polymorphism if
we’re using it.

Defined in
[internal/abi/iface.go](https://github.com/golang/go/blob/5122a6796ef98e3453c994c95abd640596540bea/src/internal/abi/iface.go):

```go
package abi

import "unsafe"

type ITab struct {
  Inter *InterfaceType // the type of the interface
  Type  *Type          // the type of the underlying, concrete value
  Hash  uint32         // copy of Type.Hash. Used for type switches.
  Fun   [1]uintptr     // array of pointers to the method implementations
                       // * safe to cast to [len(Inter.Methods)]uintpr
}

// Note: not actually defined here (seems to be redefined in multiple places: 1, 2)
type IFace struct {
  Tab  *ITab
  Data unsafe.pointer
}

// EmptyInterface describes the layout of a "interface{}" or a "any."
type EmptyInterface struct {
  Type *Type
  Data unsafe.Pointer
}
```

### Compiling a static cast to interface

A static cast is a cast between two compile-time-known types. Syntactically, a
type cast occurs when:

- Explicitly
  - cast expression
    - `A(x)`
- Implicitly
  - variable assignment
    - `var a A = x`
  - argument passing
    - `(func (A) {...})(x)`
  - return values
    - `func () A { return x }`

Given the source code:

```go
package main

type X struct {}
func (x X) M() {}

type A interface { M() }

func example(x X) A {
  return x
}
```

It (roughly) compiles to:

```go
import "abi"
import "runtime" // func newobject(typ *abi.Type) unsafe.Pointer
import "unsafe"

const `type:main.X` abi.StructType = ...

const `type:main.A` abi.InterfaceType = ...

const `go:itab.main.X,main.A` abi.ITab = {
  Inter: &`type:main.A`,
  Type:  &`type:main.X`,
  Fun: [1]uintptr{
    &`main.(*X).M()`, // uses the pointer receiver wrapper
  },
}

func `main.X.M`(x X) {}

// a wrapper is generated
func `main.(*X).M()`(ptr *X) {
  var x X = *ptr // copy to stack
  `main.X.M`(x)
}

func `main.example`(x X) abi.IFace {
  // ITab methods always need a pointer receiver; plus `&x` is escaping the function
  var heapX unsafe.Pointer = runtime.newobject(&`type:main.X`)
  // and copy the expected contents into it
  *(*X)(heapX) = x
  // above may also be done by one of the runtime.convXXX functions
  return abi.IFace{
    Tab: &`go:itab.main.X,main.A`,
    Data: heapX,
  }
}
```

### (Bonus) Compiling a cast to empty interface

Given the source code:

```go
package main

func example(x int) any {
  return x
}
```

It (roughly) compiles to:

```go
import "abi"
import "runtime" // func convT64(val uint64) unsafe.Pointer

func `main.example`(x int64) abi.EmptyInterface {
  return abi.EmptyInterface{
    Type: &`type:int`,
    Data: runtime.convT64(x),
  }
}
```

### Compiling a dynamic cast to interface

Given the source code:

```go
package main

type A interface { M() }

func example(x any) A {
  return x.(A)
}
```

It (roughly) compiles to:

```go
import "abi"
import "runtime" // func typeAssert(s *abi.TypeAssert, t *abi.Type) *abi.ITab

const `type:main.A` abi.InterfaceType = ...

const `main.typeAssert.0` abi.TypeAssert = {
  Inter:   &`type:main.A`,
  CanFail: false, // because not doing `a, ok := a.(A)`
}

func `main.example`(x abi.EmptyInterface) abi.IFace {
  return abi.IFace{
    Tab:  runtime.typeAssert(&`main.typeAssert.0`, x.Type), // panics if bad cast
    Data: x.Data,
  }
}
```

The above “runtime.typeAssert”, after some runtime validations, will eventually
call
[runtime.itabInit](https://github.com/golang/go/blob/4ed358b57efdad9ed710be7f4fc51495a7620ce2/src/runtime/iface.go#L195).
Its job is to do the actual work of verifying that the concrete type’s methods
implement the interface’s methods.

(I don’t expect you to read the code below; I pasted it in for you to get a
‘feel’ of the complexity behind.)

```go
// itabInit fills in the m.Fun array with all the code pointers for
// the m.Inter/m.Type pair. If the type does not implement the interface,
// it sets m.Fun[0] to 0 and returns the name of an interface function that is missing.
// If !firstTime, itabInit will not write anything to m.Fun (see issue 65962).
// It is ok to call this multiple times on the same m, even concurrently
// (although it will only be called once with firstTime==true).
func itabInit(m *itab, firstTime bool) string {
  inter := m.Inter
  typ := m.Type
  x := typ.Uncommon()

  // both inter and typ have method sorted by name,
  // and interface names are unique,
  // so can iterate over both in lock step;
  // the loop is O(ni+nt) not O(ni*nt).
  ni := len(inter.Methods)
  nt := int(x.Mcount)
  xmhdr := (*[1 << 16]abi.Method)(add(unsafe.Pointer(x), uintptr(x.Moff)))[:nt:nt]
  j := 0
  methods := (*[1 << 16]unsafe.Pointer)(unsafe.Pointer(&m.Fun[0]))[:ni:ni]
  var fun0 unsafe.Pointer
imethods:
  for k := 0; k < ni; k++ {
    i := &inter.Methods[k]
    itype := toRType(&inter.Type).typeOff(i.Typ)
    name := toRType(&inter.Type).nameOff(i.Name)
    iname := name.Name()
    ipkg := pkgPath(name)
    if ipkg == "" {
      ipkg = inter.PkgPath.Name()
    }
    for ; j < nt; j++ {
      t := &xmhdr[j]
      rtyp := toRType(typ)
      tname := rtyp.nameOff(t.Name)
      if rtyp.typeOff(t.Mtyp) == itype && tname.Name() == iname {
        pkgPath := pkgPath(tname)
        if pkgPath == "" {
          pkgPath = rtyp.nameOff(x.PkgPath).Name()
        }
        if tname.IsExported() || pkgPath == ipkg {
          ifn := rtyp.textOff(t.Ifn)
          if k == 0 {
            fun0 = ifn // we'll set m.Fun[0] at the end
          } else if firstTime {
            methods[k] = ifn
          }
          continue imethods
        }
      }
    }
    // didn't find method
    // Leaves m.Fun[0] set to 0.
    return iname
  }
  if firstTime {
    m.Fun[0] = uintptr(fun0)
  }
  return ""
}
```

### Compiling a call to interface method

Given the source code:

```go
package main

type A interface { M(int, int) int }

func example(a A) int {
  return a.M(10, 20) // the compiler knows that A is an interface type,
                     // so the A.M() call is an interface method call
}
```

It (roughly) compiles to:

```go
import "abi"
import "unsafe"

const `type:main.A` abi.InterfaceType = ...

func `main.example`(a abi.IFace) {
  // `a.Tab.Fun[0]` contains the address of the code we want to jump to
  // first, cast it to a function pointer with the expected signature
  // note that the first argument is a pointer to the receiver
  f := (*func(unsafe.Pointer, int, int) int)(unsafe.Pointer(a.Tab.Fun[0]))
  // the receiver is stored in the `abi.IFace.Data` field
  f(i.Data, 10, 20) // indirect call (costly)
}
```

Note that the above does not actually compile due to how Golang handles function
pointers. For a full running example, check out
[this snippet](https://godbolt.org/z/f87GzobEz).

## Resources

- [Clement Rey's Go Internals: Chapter 2: Interfaces](https://github.com/teh-cmc/go-internals/blob/master/chapter2_interfaces/README.md)
  - This was the kickstarter for my investigation
- [Go language spec](https://go.dev/ref/spec)
- [Go compiler source](https://github.com/golang/go/tree/master/src/cmd/compile)
- [Compiler Explorer](https://godbolt.org/)
