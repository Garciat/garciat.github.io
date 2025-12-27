---
title: "GHC Generics in Java via associated types"
date: 2025-12-27
description: "Extending my type class resolution library to support an approximation of associated types, so that I can build something like GHC Generics for Java."
tags:
  - Java
  - Haskell
---

## Background

> This post is a continuation of my previous post on
> [Type Classes for Java](/posts/java-type-classes/).

During the implementation of type classes for Java, I had an interesting
thought: what if we had
[GHC Generics](https://hackage-content.haskell.org/package/base-4.22.0.0/docs/GHC-Generics.html)
in Java?

This could allow us to write data type-generic code without reflection. Not only
could that be promising in terms of ergonomics and (in _theory_) efficiency, but
also potentially more _principled_ because the generic code then only has access
to the _structure_ of the data type and not the data type itself.

I parked the idea while I was still implementing the type class resolution
library. But also because I just couldn't get past the challenge of how to
properly encode associated types in Java.

Until now &mdash; I eventually managed to come up with a sufficient encoding,
which we will explore later.

First, let's take a look at the Haskell code that we're trying to emulate.

## The Goal

```haskell
class Generic a where
  type Rep a :: Type
  from :: a -> Rep a
  to :: Rep a -> a
```

`type Rep a :: Type` there is a case of
[associated type synonyms](https://wiki.haskell.org/GHC/Type_families#An_associated_type_synonym_example).

```haskell
-- # (Reduced) Type Representation Constructors:

-- No-args constructor
data U1 = U1
-- Reference to type
data K1 a = K1 a
-- Product type
data a :*: b = a :*: b
-- Sum type
data a :+: b = L1 a | R1 b

-- # Example:

data Tree a = Leaf a | Node (Tree a) (Tree a)

-- Compiler-generated:
instance Generic (Maybe a) where
  type Rep (Maybe a) = K1 a :+: (K1 (Tree a) :*: K1 (Tree a))

  from = ...
  to = ...

-- # Usage:

data JSON
  = JsonString String
  | JsonInt Int
  | JsonObject [(String, JSON)]
  | JsonArray [JSON]

class ToJSON a where
  toJSON :: a -> JSON

class GenericToJSON a where
  gToJSON :: a -> Bool

instance GenericEq U1 where
  gToJSON U1 = JsonObject []

-- This may recurse!
instance ToJSON a => GenericToJSON (K1 a) where
  gToJSON (K1 a) = toJSON a

instance (GenericToJSON a, GenericToJSON b) => GenericToJSON (a :*: b) where
  gToJSON (a :*: b) = JsonArray [gToJSON a, gToJSON b]

instance (GenericToJSON a, GenericToJSON b) => GenericToJSON (a :+: b) where
  gToJSON (L1 a) = gToJSON a
  gToJSON (R1 b) = gToJSON b

-- (Note those implementations are just toy examples.)

instance ToJSON Int where
  toJSON i = JsonInt i

instance ToJSON a => ToJSON (Tree a) where
  toJSON a = gToJSON (from a)
```

## The Encoding

I first had to find a way to represent Haskell's _associated type synonyms_ in
Java.

My first idea was trying something with existentials:

```java
@TypeClass
interface Generic<A> {
  <R> R accept(Visitor<A, R> visitor);

  interface Visitor<A, R> {
    <Rep> R visit(Function<A, Rep> from, Function <Rep, A> to);
  }
}
```

The `Visitor` type says: there exists a type `Rep` which is isomorphic to `A`
(via `from` and `to`).

But that is not enough. It means the right thing, but we actually need access to
`Rep` itself so that it can be recursively pattern-matched by type class
instance resolution.

I then thought, go simple:

```java
@TypeClass
interface Generic<A, Rep> {
  Rep from(A value);

  A to(Rep rep);
}
```

But I need `Rep` to be an _output_ of the type class, not a regular type that
gets matched during resolution.

So I 'just' declared it as such:

```java
@TypeClass
interface Generic<A, @Out Rep> {
  Rep from(A value);

  A to(Rep rep);
}
```

**That's it.** That's the encoding I went for. Everything else unfolds from
this.

- This is not a normal type parameter.
- It is **computed by resolution**, not supplied by the caller.
- It changes resolution from unification-only → dependency-driven inference.

The expectation is that witness resolution will match on just `Generic<A, _>`
and when it finds a match, the `Rep` type argument will _flow_ outwards in an
instance declaration:

```java
@TypeClass.Witness
static <A, Rep> SomeReturnType example(Generic<A, Rep> g, GenericToJson<Rep> json);
```

In this example, `GenericToJson<Rep>` depends on the resolution of
`Generic<A, Rep>`, out of which we will get the actual `Rep` type to resolve it
with.

## An Example

We can now start translating the motivating Haskell code into Java:

```java
// Type Representation Constructors
interface TyRep {
  record U1() {}

  record K1<A>(A value) {}

  sealed interface Sum<A, B> {
    record L1<A, B>(A left) implements Sum<A, B> {}

    record R1<A, B>(B right) implements Sum<A, B> {}
  }

  record Prod<A, B>(A first, B second) {}
}

// Example data type with Generic representation
sealed interface Tree<A> {
  record Leaf<A>(A value) implements Tree<A> {}

  record Node<A>(Tree<A> left, Tree<A> right) implements Tree<A> {}

  @TypeClass.Witness
  static <A> Generic<Tree<A>, Sum<K1<A>, Prod<K1<Tree<A>>, K1<Tree<A>>>>> generic() {
    return new Generic<>() {
      // mechanic transformation code
    };
  }
}
```

Defining generic instances looks like this:

```java
interface JsonValue {
  record JsonString(String value) implements JsonValue {}

  record JsonInteger(int value) implements JsonValue {}

  record JsonObject(List<Prop> props) implements JsonValue {}

  record JsonArray(List<JsonValue> values) implements JsonValue {}

  record Prop(String key, JsonValue value) {}
}

@TypeClass
interface ToJsonGeneric<Rep> {
  JsonValue toJson(Rep rep);

  @TypeClass.Witness
  static ToJsonGeneric<TyRep.U1> u1() {
    return _ -> new JsonValue.JsonObject(List.of());
  }

  @TypeClass.Witness
  static <A> ToJsonGeneric<K1<A>> k1(Lazy<ToJson<A>> toJsonA) {
    return rep -> toJsonA.get().toJson(rep.value());
  }

  @TypeClass.Witness
  static <A, B> ToJsonGeneric<Prod<A, B>> prod(
      ToJsonGeneric<A> toJsonA, ToJsonGeneric<B> toJsonB) {
    return rep ->
        new JsonValue.JsonArray(
            List.of(toJsonA.toJson(rep.first()), toJsonB.toJson(rep.second())));
  }

  @TypeClass.Witness
  static <A, B> ToJsonGeneric<Sum<A, B>> sum(ToJsonGeneric<A> toJsonA, ToJsonGeneric<B> toJsonB) {
    return rep ->
        switch (rep) {
          case L1(var value) -> toJsonA.toJson(value);
          case R1(var value) -> toJsonB.toJson(value);
        };
  }
}
```

And the final bit that brings it all together:

```java
@TypeClass
interface ToJson<A> {
  JsonValue toJson(A a);

  @TypeClass.Witness
  static ToJson<Integer> toJsonInteger() {
    return JsonValue.JsonInteger::new;
  }
}

sealed interface Tree<A> {
  // ...

  // Notice here how `Rep` is an "output" of `Generic<Tree<A>, Rep>`
  // which becomes an input for `ToJsonGeneric<Rep>`
  @TypeClass.Witness
  static <A, Rep> ToJson<Tree<A>> toJson(
      Generic<Tree<A>, Rep> generic, ToJsonGeneric<Rep> toJsonGeneric) {
    return tree -> toJsonGeneric.toJson(generic.from(tree));
  }

  // ...
}
```

## The Machinery

I introduced `@Out` which annotates a type parameter in a type class. It denotes
that a witness for this type class _outputs_ a type through the respective type
argument.

The API is really simple. But then we have a couple of implementation challenges
to tackle:

1. Revamping witness resolution so that types flow out of type variables whose
   target parameter is annotated with `@Out`.
2. Tying the knot for recursive data types such as `Tree` above, so that:
   - resolution terminates, and
   - the resolved witness constructor plan can be reified.

Let's tackle (2) first.

First, I introduced a wrapper type that introduces laziness for witness
constraints:

```java
interface Lazy<A> {
  A get();
}
```

It needs to be applied, for example, when handling the `K1` type representation
constructor, which may or may not introduce recursion. For example:

```java
@TypeClass
interface ToJsonGeneric<Rep> {
  JsonValue toJson(Rep rep);

  @TypeClass.Witness
  static <A> ToJsonGeneric<K1<A>> k1(Lazy<ToJson<A>> toJsonA) {
    return rep -> toJsonA.get().toJson(rep.value());
  }
}
```

Then, I updated the recursive resolution algorithm:

- Introduced a `Lazy` constructor for the `ParsedType` ADT. This marks the
  request for lazy resolution by the client.
- Started keeping track of previously seen resolution targets. (Similar to a DFS
  algorithm.)
- When the resolution target is has `Lazy` on the head, then:
  - If this the type under the `Lazy` constructor has been seen before, then
    emit a `LazyLookup` node.
    - In this case, witness reification is expected to keep its own cache to tie
      the know and use this a signal to look up in the cache.
  - Otherwise, recurse into resolution as usual, but wrap the result in a
    `LazyWrap` node.
    - This is so that witness reification can correctly return an instance of
      `Lazy<A>`, even though we have a concrete object.

Now, onto tackling (1).

At a high level:

- Type variables which are arguments to `@Out`-annotated type parameters are
  annotated in the `ParsedType` structure somehow.
- After finding a single witness constructor candidate (through unification and
  overlapping instances reduction):
  - The candidate's constraints (its argument dependencies) are substituted with
    the result from unification. (This is not new).
    - These resolved constraint types may contain unbound type variables.
    - Some of which are under an `Out` constructor. (Note: unification ignores
      `Out` nodes.)
  - From each constrain type, we can derive:
    `(provides: List<Var>, expects: List<Var>)`.
    - Type variables under `Out` constructors go in `provides` and the rest go
      under `expects`.
  - This denotes a directed graph. (Possibly acyclic due to Java's type system;
    not sure.)
  - Constraints can be topologically sorted, from fewest expectations to most.
    (Like a `TreeMap<Integer, List<Constraint>>`.)
  - At each expectation stratum:
    - Resolve each constraint type.
    - Unify each newly-resolved constraint type with the original constraint
      type.
    - Merge all substitutions maps and apply them to all of the constraint types
      (or just the following stratum).
  - By the end of this, there should be no unbound type variables.
    - If there are any, resolution fails.
  - Resolution succeeds with a witness constructor match where its return type
    and constraint types have been fully substituted .

## The Code

I prototyped this solution in
[this PR](https://github.com/Garciat/java-type-classes/pull/25), and the latest
version (as of writing) of the instance resolution code is
[here](https://github.com/Garciat/java-type-classes/blob/20ae9c0f30d6f400d63c8b4541f5f20e1a1ac5d6/core/src/main/java/com/garciat/typeclasses/impl/Resolution.java).
It reads slightly better than the prototype.

## What else can we do?

It turns out that now we can do a fair bit of type-level computation!

> A fantastic inspiration for this is
> [Alexis King's _An introduction to typeclass metaprogramming_](https://lexi-lambda.github.io/blog/2021/03/25/an-introduction-to-typeclass-metaprogramming/).

### Flattening of arbitrarily nested lists

Based on this Haskell code:

```haskell
type family ElementOf a where
  ElementOf [[a]] = ElementOf [a]
  ElementOf [a]   = a

class Flatten a where
  flatten :: a -> [ElementOf a]

instance Flatten [a] where
  flatten x = x

instance {-# OVERLAPPING #-} Flatten [a] => Flatten [[a]] where
  flatten x = flatten (concat x)
```

We can now write in Java:

```java
@TypeClass
interface Flatten<A, @Out T> {
  List<T> flatten(A list);

  @TypeClass.Witness
  static <A> Flatten<List<A>, A> here() {
    return list -> list;
  }

  @TypeClass.Witness(overlap = TypeClass.Witness.Overlap.OVERLAPPING)
  static <A, R> Flatten<List<List<A>>, R> there(Flatten<List<A>, R> e) {
    return list -> list.stream().flatMap(innerList -> e.flatten(innerList).stream()).toList();
  }
}
```

And the usage code looks like:

```java
Flatten<List<String>, String> e1 = witness(new Ty<>() {});

assertThat(e1.flatten(List.of("a", "b", "c")))
    .isEqualTo(List.of("a", "b", "c"));

Flatten<List<List<String>>, String> e2 = witness(new Ty<>() {});

assertThat(e2.flatten(List.of(List.of("a", "b"), List.of("c"))))
    .isEqualTo(List.of("a", "b", "c"));
```

### Natural number addition

```java
void example() {
  ReifyNatAdd<S<S<Z>>, S<S<S<Z>>>> reifyAdd = witness(new Ty<>() {});

  assertThat(reifyAdd.reify()).isEqualTo(5);
}

sealed interface Nat<N extends Nat<N>> {
  record Z() implements Nat<Z> {}

  // Note that we don't store the predecessor!
  record S<N extends Nat<N>>() implements Nat<S<N>> {}
}

@TypeClass
interface ReifyNat<N extends Nat<N>> {
  int reify();

  @TypeClass.Witness
  static ReifyNat<Z> reifyZ() {
    return () -> 0;
  }

  @TypeClass.Witness
  static <N extends Nat<N>> ReifyNat<S<N>> reifyS(ReifyNat<N> rn) {
    return () -> 1 + rn.reify();
  }
}

@TypeClass
interface NatAdd<A, B, @Out C> {
  Unit trivial();

  @TypeClass.Witness
  static <B extends Nat<B>> NatAdd<Z, B, B> addZ() {
    return Unit::unit;
  }

  @TypeClass.Witness
  static <A extends Nat<A>, B extends Nat<B>, C extends Nat<C>> NatAdd<S<A>, B, S<C>> addS(
      NatAdd<A, B, C> prev) {
    return Unit::unit;
  }
}

@TypeClass
interface ReifyNatAdd<A, B> {
  int reify();

  @TypeClass.Witness
  static <A extends Nat<A>, B extends Nat<B>, C extends Nat<C>> ReifyNatAdd<A, B> reifyAddS(
      NatAdd<A, B, C> addAB, ReifyNat<C> reifyC) {
    return reifyC::reify;
  }
}
```
