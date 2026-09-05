---
title:        "Understanding Go generics"
date:         2024-05-17
description:  "A complete brain dump of my understanding of Go generics at the time."
tags:
  - Go
  - Tutorial
---

## Introduction

[As of Go 1.18](https://tip.golang.org/doc/go1.18), type parameters can be used
in the following declarations:

- Function declarations
  - But not methods
    - Although generic type may have methods (just not generic methods)
- Named type declarations
  - But not type aliases

### Generic functions by example

```go
func IdentityInt(x int) x { return x }
func IdentityString(x string) x { return x }
// etc...

// They can be replaced by
func Identity[T any](x T) T { return x }

// Identity[int]    ~ IdentityInt
// Identity[string] ~ IdentityString

func Concat[T any](slices ...[]T) []T {
  var s []T
  for _, slice := range slices {
    for _, elem := range slice {
      s = append(s, elem)
    }
  }
  return s
}
// Concat([]int{1,2,3}, []int{4,5}, []int{6}) == []int{1,2,3,4,5,6}
```

### Generic types by example

```go
type Pair[T any, U any] struct {
  T Fst
  U Snd
}
// Can have Pair[int, string] or Pair[struct{}, Pair[*int, func()]] etc.

// This is a method for the generic type `Pair`
// The type parameters `T` and `U` are implicitly declared
// We cannot add any other explicitly declared type parameters with e.g. `[X any]`
func (p Pair[T, U]) Swap() Pair[U, T] {
  return Pair[U, T]{p.Snd, p.Fst}
}
```

## Instantiation

Generic functions are not functions; and generic types are not types. They
become functions and types, respectively, when they are instantiated.

[Instantiation](https://go.dev/ref/spec#Instantiations) is substituting
(applying) type arguments for each of the declared type parameters.
Instantiation may fail (at compile time, of course) if the given type arguments
do not satisfy their respective type parameters’ type constraints.

```go
func IdentityInt(x int) x { return x }
func Identity[T any](x T) T { return x }

var f = IdentityInt // OK
var g = Identity    // NOT OK: "cannot use generic function without instantiation"
var h = Identity[int] // OK
var i func(int)int = Identity // OK: implicit instantiation; type arguments were inferred
```

## Type constraints

### Usage

The operations possible on an unconstrained type are limited:

```go
func example[T any](t T) T {
  t2 := t  // OK: can be 'copied'
  var t3 T // OK: can declare new variable
  return t // OK: can return it
  new(T)   // OK: can allocate for it
  // etc.. moving it around, using it in other declarations; generally fine

  t + t    // NOT OK: `+` operator may not be available for all Ts
  t.field  // NOT OK: field may not be available
  t.m()    // NOT OK: method may not be available
  map[T]int{} // NOT OK: `T` may not be compatible for map keys (like a function type)
  // etc.. specific operations; cannot be assumed
}
```

So we use constraints to ‘gain’ information about a type that we may use in the
function implementation:

```go
type Stringer interface { String() string }

func example[T Stringer](t T) string {
  return t.String() // OK! we declared that `T` must implement `Stringer`
                    //     so we can rely on the presence of method `String() string`
}
```

### Syntax

Type constraints are defined through the
[general interface syntax](https://go.dev/ref/spec#General_interfaces):

- Intersection of zero or more of (separated by `;`)
  - Method
  - Union of one or more of (separated by `|`)
    - Empty interface type
    - Non-interface type
    - Underlying type of (denoted by `~`)
      - Non-interface type

And any of the above may be wrapped by `interface { … }` zero or more times.

An interface type denotes a type set; the set of all types that may be assigned
to it.

A union denotes a closed type set.

An intersection denotes an open type set, if it does not include any unions.

The `comparable` constraint is a builtin that denotes the type set of
[types that are strictly comparable](https://go.dev/ref/spec#Comparison_operators).
I.e. types that can be used as map keys.

Let’s explore:

```go
[T any] // no constraint on `T`
[T interface{}] // same
[T interface{interface{}}] // valid syntax; exactly the same as above
[T interface{interface{interface{}}}] // same

[T interface{ M() }] // interface type with one method `M` with type signature `func()`
[T interface{ interface{ M() }] // again, same thing
// A type `T` satisfies the above if it has a method `M()`

[T interface{ M(); N() }] // interface with two methods
[T interface{ interface{ M() }; interface{ N() } }] // same thing
[T interface{ M(); interface{ N() } }] // same thing
// A type `T` satisfies the above if it has method `M()` AND it has method `N()`

[T interface{ int }] // type union of one element, `int`
[T interface{ interface{ int } }] // same
[T int] // shorthand for unions
// A type `T` satisfies the above if it is `int`

[T interface{ int | float32 }] // type union of two elements, `int` and `float32`
[T interface{ int | interface{ float32 }}] // you get the idea...
[T int|float32] // shorthand for unions
// A type `T` satisfies the above if it is either `int` or `float32`

[T interface{ ~int }] // type union of one element, `~int`
// A type `T` satisfies the above if its underlying type is `int`
// For example: `type PrimaryKey int`
// The `~` syntax basically 'unwraps' named types
[T ~int] // shorthand

[T interface{ ~int; M() }]
// A type `T` satisfies the above if its underlying type is `int` AND it has method `M()`
// For example: `type Code int; func (c Code) M() { ... }`

[T interface{ int; M() }]
// A type `T` satisfies the above if it is `int` AND has method `M()`
// ... which is impossible
// The builtin type `int` has no methods (nor any may be declared for it)

[T interface{ int; float32 }] // Intersection of union `int` and union `float32`
// A type `T` satisfies the above it is `int` AND it is `float32`
// ... which is impossible
// So the above denotes an empty type set.

[T interface{ comparable }]
[T comparable] // same
// A type `T` satisfies the above if it can be compared with `==` and `!=`
// This is needed to use a type parameter as a map key

// given
type Stringer interface { String() string }
// then
[T interface{ ~int; comparable; Stringer }]
// A type `T` satisfies the above if: its underlying type is `int`
//                                AND it is comparable
//                                AND it implements Stringer

[T interface{ M() U }, U any]
// Satisfies if `T` has a method `M() U`
// And `U` can be any type

type WithM[T any] = interface{ M() T }
[T WithM[U], U any] // same as above
```

## Type inference

Type inference follows suit from constraints and turns out to be rather
[principled](https://go.dev/ref/spec#Type_inference). (Perhaps this is no
surprise given that Philip Wadler
[worked on an early version of Go generics](https://www.youtube.com/watch?v=Dq0WFigax_c).)

Inference kicks in when we do not provide sufficient explicit type arguments at
an instantiation site. That is, given a generic declaration with N type
parameters, if we provide 0 to N-1 arguments during instantiation, inference
will deal with the rest.

Type inference supports calls of generic functions and assignments of generic
functions to (explicitly function-typed) variables.

The inference process uses a
[unification algorithm](https://en.wikipedia.org/wiki/Unification_(computer_science))
and is pretty math-y.

Let’s explore:

```go
// I'll use a simplified syntax for type parameter lists + instantiation
[T any](T)[_](32) // means: given a generic function
                  //          with type parameters [T any]
                  //          and function parameters (T)
                  //        do not provide an explicit type argument for T
                  //        and provide 32 as a function argument
// inference will derive T=int

[T any, U any](T, U)[_, _]("hi", 42)
// straightforward: T=string; U=int

[T struct{Name U}, U any](T)[_, _](struct{Name string}{})
// T = struct{Name string} -- given by function argument
// but also:
// struct{Name U} = struct{Name string} -- given by constraint on T
// U = string -- given by 'pattern matching' on struct shape

[T any](struct{Name T})[_](struct{Name string}{}) // kind of the same
// struct{Name T} = struct{Name string} -- given by function argument
// T = string -- given by 'pattern matching' on struct shape

[T int|float32](T)[_](42)
// known:
//   T=int | T=float32 -- from constraints of `T`
//   T=int -- from function argument
// infers:
//   T=int

[T int|float32]()[_]() // note no function arguments!
// known:
//  T=int | T=float32 -- from constraints of `T`
// infers:
//  ??? fail

[T int]()[_]() // note no function arguments!
// known:
//  T=int -- from constraints of `T`
// infers:
//  T=int -- follows directly from known equations!

[T any, PT *T](T)[_, _](42)
// known:
//  PT=*T -- from constraints of `PT`
//  T=int -- from function argument
// infers:
//  T=int
//  PT=*int  -- from replacing T=int in PT=*T !
[T any, PT *T](T)[int, *int](42) // this becomes the effective call

type User struct{ ... }
type Users []User
[T ~[]E, E any, PE *E](T)[_, _, _](Users{})
// known:
//   T~[]E -- from constraint on `T`
//   PE=*E    -- from constraint on `PE`
//   T=Users  -- from function argument
// infers:
//   T=Users  -- follows directly
//   E=User   -- from T=User & T~[]E & Users~[]User ==> []E=[]User ==> E=User
//   PE=*User -- from PE=*E & E=User
[T ~[]E, E any, PE *E](T)[Users, User, *User](Users{}) // effective call

// wild!
```

## Compilation

A compiler must follow the semantics described in
[the language specification](https://go.dev/ref/spec).

The language specification doesn’t say anything about translation (compilation),
so any details about how language constraints are optimized and compiled are
implementation-specific.

Regardless, it is worth having a general idea of how the current (1.22) Go
compiler compiles generics.

Generics compilation is described in
[this design document](https://github.com/golang/proposal/blob/master/design/generics-implementation-dictionaries-go1.18.md).

In short, the compiler does stenciling (a la C++ templates), but it tries to
reduce instantiations by reusing them across types that have the same ‘GC
shape’.

> The GC shape of a type means how that type appears to the allocator / garbage
> collector. It is determined by its size, its required alignment, and which
> parts of the type contain a pointer.
> [Reference](https://github.com/golang/proposal/blob/master/design/generics-implementation-gcshape.md)

For example:

Given the following Go code:

```go
package main

type Num int

//go:noinline
func add[T ~int | ~float64](x, y T) T {
  return x + y
}

func main() {
  println(add(3, 3))
  println(add(5.2, 2.3))
  println(add[Num](9, 99))
}
```

We get the following x86 code:

```x86asm
main.main:
  PUSHQ	BP
  MOVQ	SP, BP
  SUBQ	$40, SP

  LEAQ	main..dict.add[int](SB), AX
  MOVL	$3, BX
  MOVQ	BX, CX
  CALL	main.add[go.shape.int](SB)
  MOVQ	AX, main..autotmp_2+32(SP)
  CALL	runtime.printlock(SB)
  MOVQ	main..autotmp_2+32(SP), AX
  CALL	runtime.printint(SB)
  CALL	runtime.printnl(SB)
  CALL	runtime.printunlock(SB)

  LEAQ	main..dict.add[float64](SB), AX
  MOVSD	$f64.4014cccccccccccd(SB), X0
  MOVSD	$f64.4002666666666666(SB), X1
  CALL	main.add[go.shape.float64](SB)
  MOVSD	X0, main..autotmp_3+24(SP)
  CALL	runtime.printlock(SB)
  MOVSD	main..autotmp_3+24(SP), X0
  CALL	runtime.printfloat(SB)
  CALL	runtime.printnl(SB)
  CALL	runtime.printunlock(SB)

  LEAQ	main..dict.add[main.Num](SB), AX
  MOVL	$9, BX
  MOVL	$99, CX
  CALL	main.add[go.shape.int](SB)
  MOVQ	AX, main..autotmp_3+32(SP)
  CALL	runtime.printlock(SB)
  MOVQ	main..autotmp_3+32(SP), AX
  CALL	runtime.printint(SB)
  CALL	runtime.printnl(SB)
  runtime.printunlock(SB)

  ADDQ	$40, SP
  POPQ	BP
  RET

main.add[go.shape.float64]:
  ADDSD	X1, X0
  RET

main.add[float64]:
  LEAQ	main..dict.add[float64](SB), AX
  CALL	main.add[go.shape.float64](SB)
  RET

main.add[go.shape.int]:
  LEAQ	(BX)(CX*1), AX // fancy add lol
  RET

main.add[int]:
  MOVQ	BX, CX
  MOVQ	AX, BX
  LEAQ	main..dict.add[int](SB), AX
  CALL	main.add[go.shape.int](SB)
  RET

main.add[<unlinkable>.Num]:
  MOVQ	BX, CX
  MOVQ	AX, BX
  LEAQ	main..dict.add[main.Num](SB), AX
  CALL	main.add[go.shape.int](SB)
  RET
```

Things to note:

The compiler stenciled the code:

- `main.add[go.shape.int]`
- `main.add[go.shape.float64]`

Those contain the actual function logic. Observe how the code is specialized to
the respective data types. It uses the `ADDSD` instruction for `float64`, and a
sneaky ‘addition’ instruction for int (to avoid `ADD BX, CX` + `MOV CX AX`).

But it also generated the wrappers:

- `main.add[int]`
- `main.add[float64]`
- `main.add[Num]`

Those load the appropriate dictionaries from static data and then defer to the
shape-based stenciled code.

Also, in `main.main`, it seems like the compiler is inlining the wrappers. The
actual code is not inlined because I used the `go:noinline` pragma. (Otherwise
everything would’ve been constant-folded.)

## Examples

### Generic algorithms

```go
type PrimaryKeyed[T any] interface {
  GetPrimaryKey() T
}

func SliceByKeys[T PrimaryKeyed[K], K comparable](elems []T) map[K]T {
  m := make(map[K]T, len(elems))
  for _, elem := range elems {
    m[elem.GetPrimaryKey()] = elem
  }
  return m
}

// ===

type PaymentProfile struct {
  ID uuid.UUID
  // etc
}
func (p PaymentProfile) GetPrimaryKey() uuid.UUID { return p.ID }

var paymentProfiles []PaymentProfile = ...

// map[uuid.UUID]PaymentProfile
profilesByUUID := SliceByKeys(paymentProfiles)

// note that the inference here is pretty wild:
// known:
//   []PaymentProfile = []T -- from function argument
//   T `sat` PrimaryKeyed[K] -- from constraint on `T`
//      ==> T `impl` interface{GetPrimaryKey() K}  -- from definition of constraint
// infers:
//   unify([]PaymentProfile, []T)
//     ==> T=PaymentProfile
//   impl(PaymentProfile, interface{GetPrimaryKey() K})
//     ==> unify(GetPrimaryKey() uuid.UUID, GetPrimaryKey() K)
//     ==> uuid.UUID=K
SliceByKeys[[]PaymentProfile, uuid.UUID](paymentProfiles) // effective call
```

```go
func SliceGroupBy[T any, K comparable](elems []T, key func(T) K) map[K][]T {
  m := make(map[K][]T)
  for _, elem := range elems {
    k := key(elem)
    m[k] = append(m[k], elem)
  }
  return m
}

func SlicePartition[T any](elems []T, predicate func(T) bool) struct{True, False []T} {
  g := SliceGroupBy(elems, predicate) // infers K=bool; and it is comparable
  return struct{True, False []T}{g[true], g[false]}
}

// ===

g := SlicePartition(paymentProfiles, func(pp PaymentProfile) { return pp.IsBanned })
g.True  // banned profiles
g.False // non-banned profiles
```

### Generic utilities

```go
type PaymentProfile struct {
  UUID uuid.UUID
  // ...
}

func (p *PaymentProfile) MarshalLogObject(enc zapcore.ObjectEncoder) error {
  enc.AddString("payment_profile_uuid", p.UUID.String())
  // ...
}

type ListPaymentProfilesResponse struct {
  PaymentProfiles []PaymentProfile
  // ...
}

func (r *ListPaymentProfilesResponse) MarshalLogObject(enc zapcore.ObjectEncoder) error {
  enc.AddArray("payment_profiles", zapcore.ArrayMarshalerFunc(func(arrEnc zapcore.ArrayEncoder) error {
    for _, pp := range r.PaymentProfiles {
      arrEnc.AppendObject(&pp) // need to take address here because
                               // MarshalLogObject is implemented on *PaymentProfile
    }
  })
  // ...
}

// or sometimes we create `type PaymentProfiles []PaymentProfile`
// and implement `zapcore.ArrayMarshaler` on it

// either way, it is a lot of duplication

// ===

func MarshalArrayOfPtrObject[T ~[]E, E any, PE interface {
	*E
	zapcore.ObjectMarshaler
}](enc zapcore.ObjectEncoder, key string, arr T) error {
	enc.AddArray(key, zapcore.ArrayMarshalerFunc(func(arrEnc zapcore.ArrayEncoder) error {
		for _, elem := range arr {
			var ptr PE = &elem // cool
			arrEnc.AppendObject(ptr)
		}
	}))
}

// ===

func (r *ListPaymentProfilesResponse) MarshalLogObject(enc zapcore.ObjectEncoder) error {
  MarshalArrayOfPtrObject(enc, "payment_profiles", r.PaymentProfiles)
  // ...
}
```

### Crazy stuff

The example below is inspired by
[Haskell’s type equality module](https://hackage.haskell.org/package/base-4.20.0.0/docs/Data-Type-Equality.html).

```go
// Given
type Slice[T any] []T

// We could write
func SliceJoin(s Slice[string], sep string) string {
  // join strings
}

// But it is not a method, so it cannot be chained:
Slice[string]{...}.Filter(...).Join(...) // ???

// Could we write this?
func (s Slice[string]) Join(sep string) { ... }
// NO we can't
// Although this compiles, `string` above is actually a type parameter
// and it is not the concrete builtin type `string`.
// Remember, all of these mean the same:
func (s Slice[T]) Join(sep string) { ... }
func (s Slice[U]) Join(sep string) { ... }
func (s Slice[Hello]) Join(sep string) { ... }
func (s Slice[hello]) Join(sep string) { ... }
func (s Slice[_]) Join(sep string) { ... } // special case, when we don't care

// So are we stuck with top-level functions?
// Nope.

// Enter type witnesses 😈

// Note: this makes a LOT more sense if you understand "Propositions as Types"

// ===

// A 'witness' that T=U
type TyEq[T, U any] interface {
  Cast(T) U // if T=U, then I should be able to cast `T` to `U`
}

// TyEqImpl[T] implements TyEq[T, T] which is a trivial case, of course
type TyEqImpl[T any] struct{}
func (_ TyEqImpl[T]) Cast(t T) { return t }

// `Refl` stands for reflexivity, i.e. for every type T, then T=T
func Refl[T any]() TyEq[T, T] { return TyEqImpl[T]{} }

// ===

// We can only join a Slice[T] if T=string
// So we demand from the caller a PROOF that T=string, in the form of TyEq[T, string]
func (s Slice[T]) Join(ty TyEq[T, string], sep string) string {
  x := ""
  for _, elem := range s {
    x += ty.Cast(elem) + sep // and we use it to 'cast' elem:T to a string
  }
  return x
}

// ===

// Here, the call to Join() is made on a Slice[string]
// So we are being asked for a TyEq[string, string], which is trivial by reflexivity
Slice[string]{...}.Filter(...).Join(Refl(), ", ")

// In a way, we have worked around Go's limitation on generic methods 😇
```

The above trick only works for type equality. It would also be nice to encode “T
implements A” as a value:

```go
// A witness that type T implements interface A
type Implements[T any, A any] interface{
  Cast(T) A
}

type ImplemenentsImpl[T A, A any] struct{} // DOES NOT COMPILE
```

The language
[does not support](https://github.com/golang/go/blob/1667dbd7be0da5e75a25f14c339c859ed2190b43/src/cmd/compile/internal/types2/decl.go#L627)
using a type parameter (`A`) as a constraint (`T A`). I created
[a GitHub issue](https://github.com/golang/go/issues/67513) to propose enabling
this, but it didn't go anywhere unfortunately.

## Closing thoughts

- I recommend learning [Haskell](https://www.haskell.org/)
  - Haskell code is extremely generic
  - Its “generics” (parametric polymorphism) also follow a unification-based
    inference
  - It has helped me shape my generic reasoning and design
- In general, only use generics for ‘library-level’ code. Business code should
  seldom use generics.
