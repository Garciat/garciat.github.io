---
title: "Full Haskell-like Type Class resolution in Java"
date: 2025-12-06
description: "Typeclasses, Higher-Kinded Types, and Overlapping Instances in Pure Java: A post about re-implementing a mini Haskell in Java, using reflection, generic metadata, and type unification."
tags:
  - Haskell
  - Java
---

## TL;DR

This post explores how far Java’s type system can be pushed by building a small
Haskell-style type class instance resolution engine entirely in plain Java.

Using only reflection, generic type metadata, and a tiny first-order unifier, we
can automatically resolve type class instances (including higher-kinded ones),
support overlapping instances, and derive witnesses for arbitrarily nested
generic types.

It’s not intended for production, but as an experiment it reveals just how much
structure Java actually preserves at runtime — and how surprisingly close it can
get to type-level programming without language changes.

## Intro: What are Type Classes?

Consider:

```java
interface Equatable<T> {
  boolean eq(T other);
}

record Point(int x, int y) implements Equatable<Point> {
  @Override
  public boolean eq(Point other) {
    return x == other.x() && y == other.y();
  }
}
```

That's a pretty simple OOP-style generic interface.

However:

```java
record Dup<A>(A fst, A snd) implements Equatable<Dup<A>> {
  @Override
  public boolean eq(Dup<A> other) {
    return fst.eq(other.fst()) && snd.eq(other.snd());
    // Error: no method eq() in type A!
  }
}
```

We can't implement `eq()` for `Dup` without knowing the fact that
`A extends Equatable<A>`.

So let's try that:

```java
record Dup<A extends Equatable<A>>(A fst, A snd) implements Equatable<Dup<A>> {
  @Override
  public boolean eq(Dup<A> other) {
    return fst.eq(other.fst()) && snd.eq(other.snd());
    // OK
  }
}
```

Now the code compiles.

However, `Dup` is now only compatible with types that extend `Equatable`. `Dup`
is now less capable.

We could have checked at runtime if each object is `instanceof Equatable`, but
that doesn't work very well with generics. And it may fail at runtime.

Ideally, there would be a way to say:

`Dup` implements `Equatable<Dup<A>>` **if and only if** `A` implements
`Equatable<A>`.

> Also, if you think about it, it is a bit strange that the definition of
> equality for a type `A` depends on the object instance. As in, `eq()` is an
> instance method.
>
> It would make more sense if equality depended only on the type `A` itself.
> Right?

That's where type clases come in:

```java
interface Eq<A> {
  boolean eq(A x, A y);
}

record Point(int x, int y) {
  public static Eq<Point> eq() {
    return (p1, p2) ->
        p1.x() == p2.x()
        && p1.y() == p2.y();
  }
}

record Dup<A>(A fst, A snd) {
  public static <A> Eq<Dup<A>> eq(Eq<A> eqA) {
    return (d1, d2) ->
        eqA.eq(d1.fst(), d2.fst())
        && eqA.eq(d1.snd(), d2.snd());
  }
}
```

Let's unpack this:

- `Eq<A>` now compares two values of type `A`.
  - This indicates that we are no longer expecting the implicit `this` parameter
    to be relevant in equality.
- `Point` no longer implements the interface.
  - Now it provides a static constructor (factory) for `Eq<Point>`.
  - We call this a _witness_ that `Point` conforms to `Eq`.
- `Dup` also does not implement the interface.
  - Its static constructor for `Eq<Dup<A>>` has a parameter of type `Eq<A>`.
    - This indicates the dependency that we were looking for:
    - In order to prove `Eq<Dup<A>>`, we must first prove `Eq<A>`.
  - It uses the witness `Eq<A> eqA`, which contains `boolean eq(A, A)`, to
    implement its own intended behavior.

The code is rather simple, but it marks a dramatic change of perspective:

Equality now belongs to the type definition and not to an object instance.

So, what are type classes?

Type classes can be seen as a pattern that allows us to model shared behavior in
a way that puts types first AND is entirely compositional.

Now, in the above example, how do we actually use `Dup`'s `eq()`?

```java
Eq<Dup<Point>> pointDupEq = Dup.eq(Point.eq());

pointDupEq.eq(new Point(1, 1), new Point(1, 1));
// Returns: true
```

We must first construct the witness `Eq<Dup<Point>>` by chaining calls to the
respective `Eq` witness constructors of `Dup` and `Point`.

Then, we use this witness to access/invoke the actual logic that we're after.

Notice how this pattern composes very nicely:

```java
static <K, V> Eq<Map<K, V>> mapEq(Eq<K> eqK, Eq<V> eqV) { ... }

static <E> Eq<List<E>> listEq(Eq<E> eqE);

static Eq<Integer> integerEq();

static Eq<String> stringEq();

// then:

Eq<Map<String, List<Integer>>> eq =
  mapEq(stringEq(), listEq(integerEq()));

Map<String, List<Integer>> m1 = ...;
Map<String, List<Integer>> m2 = ...;

eq.eq(m1, m2);
```

With witness constructors as our building blocks, we can recursively construct
infinitely many witnesses, as needed.

> A note on nomenclature:
>
> In Haskell, type class 'implementations' are called _instances_.
>
> Here, I am calling them _witnesses_ because that's how Java's Architect, Brian
> Goetz, decided to refer to them in
> [a recent talk](https://www.youtube.com/watch?v=Gz7Or9C0TpM) he gave about
> bringing type classes to Java sometime in the future.

Now, wouldn't it be great if we didn't have to manually construct these
witnesses?

## Goal: Programmatically instantiating witnesses

Given:

```java
@TypeClass
interface Show<A> {
  String show(A value);

  // Convenience shortcut
  static <A> String show(Show<A> showA, A value) {
    return showA.show(value);
  }

  @TypeClass.Witness
  static Show<Integer> showInteger() { ... }

  @TypeClass.Witness
  static <A> Show<List<A>> showList(Show<A> showA) { ... }
}
```

Instead of:

```java
Show<List<List<Integer>>> w =
    Show.showList(Show.showList(Show.showInteger()));

Show.show(w, List.of(List.of(1, 2), List.of(3, 4)));
// Returns: "[[1, 2], [3, 4]]"
```

We want:

```java
Show.show(witness(), List.of(List.of(1, 2), List.of(3, 4)));
// Returns: "[[1, 2], [3, 4]]"
```

Which means that the `witness()` method is able to automatically construct the
required witness for `Show<List<List<Integer>>>`.

How do we get there?

First, we must understand some aspects of how Java generics work at runtime.

## Aside: Java Generics and Type Erasure

It is a well-known fact that Java generics get erased at runtime.

However, there are a few scenarios in which generics _do_ get reified!

> Note: 'Type Reification' is the process by which type information is made
> concrete and available at runtime.

Given:

```java
interface Stream<T> { ... }

interface IntStream extends Stream<Integer> { ... }
```

Then:

```java
IntStream.class.getInterfaces()[0];
// Returns: Stream

IntStream.class.getGenericInterfaces()[0];
// Returns: Stream<Integer>
```

This means that Java _did_ preserve the generic type arguments for the supertype
`Stream<Integer>`. (We just need to know where to look for it.)

Note that this also occurs with anonymous classes:

```java
var s = new Stream<String>() { ... };

s.getClass().getGenericInterfaces()[0];
// Returns: Stream<String>
```

This leads us to our first workaround:

## Aside: Capturing static types

We define:

```java
interface Ty<T> {
  default Type type() {
    return requireNonNull(
        ((ParameterizedType) getClass().getGenericInterfaces()[0])
            .getActualTypeArguments()[0]);
  }
}
```

Which lets us write:

```java
Type type = new Ty<Map<String, List<Integer>>>() {}.type();

println(type);
// Prints: Map<String, List<Integer>>
```

Why do we need this?

Because our `witness()` method will need a runtime representation of the type
that it is trying to instantiate.

So our use case has turned into:

```java
Show.show(witness(new Ty<>() {}), List.of(List.of(1, 2), List.of(3, 4)));
```

Note that we do not have to specify the type argument for `Ty<>`. Thankfully,
type inference does that for us.

Type inference works in this case because the `List.of(...)` parameter has a
well-defined type, and the call to `<A> Show.show(Show<A>, A)` lets type
inference flow from the second argument to the first.

## Aside: Understanding `java.lang.reflect.Type`'s hierarchy

The standard `java.lang.reflect.Type` hierarchy consists of:

- `Class<?>`
- `GenericArrayType`
- `ParameterizedType`
- `TypeVariable<?>`
- `WildcardType`

Where:

- `Class<?>`, sometimes referred to as a 'raw type', represents either:
  - A non-generic type like `String` or `Integer`.
  - A generic type like `Function<T, R>` where its type parameter list `[T, R]`
    can be retrieved via `TypeVariable<?>[] getTypeParameters()`.
- `GenericArrayType` represents an array type `E[]` whose component type `E` is
  a `ParameterizedType` or a `TypeVariable<?>`.
- `ParameterizedType` represents a type `T<Arg1, Arg2, ..., ArgN>`. Its
  `getRawType()` method returns the class or interface `T`.
- `TypeVariable<?>` represents an unbound type parameter of a generic
  declaration like a generic class/interface or generic method.
- `WildcardType` represents an occurrence of `?` within a `ParameterizedType`.

Moreover, a `java.lang.reflect.Method` can be queried via
`TypeVariable<?>[] getTypeParameters()`, `Type[] getGenericParameterTypes()`,
and `Type getGenericReturnType()`.

For example:

```java
class Example {
  static <A> List<A> hello(String s, A[] arr, Optional<?> opt) { ... }
}
```

Inspecting the `Example`'s `hello` method at runtime would yield something like:

```
Method(
  name: "hello",
  typeParameters:
    [TypeVariable(A)],
  genericReturnType:
    ParameterizedType(
      rawType: List.class,
      typeArguments: [TypeVariable(A)],
    ),
  genericParameterTypes:
    [
      String.class,
      GenericArrayType(componentType: TypeVariable(A)),
      ParameterizedType(
        rawType: Optional.class,
        typeArguments: [WildcardType()]
      )
    ]
)
```

Note that the three ocurrences of `TypeVariable(A)` are unique in the sense that
they compare `equal()` to each other, but _not_ to other type variable
instances, even if their names are also `A`.

## Subgoal: Parsing `java.lang.reflect.Type` into an AST

We want to do this for a few reasons:

- `java.lang.reflect.Type` is not convenient for programming:
  - It is not a sealed hierarchy, so pattern-matching on it is error-prone.
  - Both `Class<?>` and `GenericArrayType` may be array types.
  - `Class<?>` may represent a primitive type, like `int` or `float`, which does
    not participate in generic parameterization (yet).
  - Type application as represented by `ParameterizedType` is variadic.
    Single-parameter-a-time is easier to program against.
- When we get to higher-kinded type classes (spoiler!), then we will need our
  own type representation anyway.

Here's the AST:

```java
sealed interface ParsedType {
  record Var(TypeVariable<?> java) implements ParsedType {}

  record App(ParsedType fun, ParsedType arg) implements ParsedType {}

  record ArrayOf(ParsedType elementType) implements ParsedType {}

  record Const(Class<?> java) implements ParsedType {}

  record Primitive(Class<?> java) implements ParsedType {}
}
```

And these are our parsing rules:

```java
sealed interface ParsedType {
  // ...

  static ParsedType parse(Type java) {
    return switch (java) {
      case Class<?> arr when arr.isArray() ->
          new ArrayOf(parse(arr.getComponentType()));
      case Class<?> prim when prim.isPrimitive() ->
          new Primitive(prim);
      case Class<?> c ->
          new Const(c);
      case TypeVariable<?> v ->
          new Var(v);
      case ParameterizedType p ->
          parseAll(p.getActualTypeArguments()).stream()
              .reduce(parse(p.getRawType()), App::new);
      case GenericArrayType a ->
          new ArrayOf(parse(a.getGenericComponentType()));
      case WildcardType w ->
          throw new IllegalArgumentException("Cannot parse wildcard type: " + w);
      default ->
          throw new IllegalArgumentException("Unsupported type: " + java);
    };
  }
}
```

> Note: the rule for `ParameterizedType` will take a type like `T<A, B>` and
> turn it into `App(App(Const(T), A), B)`.
>
> This means that the generic type `T` is first applied to `A` and then to `B`.

For example, `Map<Integer, List<String>>` becomes:

```
App(
  App(Const(Map.class), Const(Integer.class)),
  App(Const(List.class), Const(String.class))
)
```

That's it! Really, it's not much, but the added uniformity will help our code
down the line.

## Recap

Until this point we have:

- `new Ty<T>() {}`: a way to capture a type `T` from a static context and access
  it at runtime.
- `ParsedType`: a uniform representation for Java's `java.lang.reflect.Type`s.

Now, let's move on to the problem of type class instance resolution.

## Subgoal: Witness resolution

Let's consider the following scenario:

```java
@TypeClass
interface Show<A> {
  String show(A value);

  // Convenience shortcut
  static <A> String show(Show<A> showA, A value) {
    return showA.show(value);
  }

  @TypeClass.Witness
  static Show<Integer> showInteger() { ... }

  @TypeClass.Witness
  static <A> Show<List<A>> showList(Show<A> showA) { ... }
}

record Pair<A, B>(A fst, B snd) {
  @TypeClass.Witness
  public static <A, B> Show<Pair<A, B>> show(Show<A> showA, Show<B> showB) { ... }
}
```

We observe that, for example, in order to summon a witness for
`Show<List<Pair<Integer, List<Integer>>>`, then we must apply several witness
constructors recursively.

> What is a witness constructor? It is a `public static` method annotated with
> `@TypeClass.Witness`.

But first, we must find the witness constructors!

How do we do that? Do we need to do a runtime scan of all loaded classes?

That would be way too complicated.

In order to reduce our search scope, we can define the following convention:

> When trying to resolve a witness `C<T>` for some type class `C` and a concrete
> type `T`, then we only look for witness constructors within the definitions of
> `C` and `T` and nowhere else.

For example, when looking for `Show<Integer>`, then we scan the methods of
`Show` and `Integer`.

Generally, we will prefer to define witness constructors within concrete types
and not within type classes. However, for a built-in type like `Integer`, we
have no choice and we must define its witness constructors within the relevant
type classes, as we have done with `static Show<Integer> showInteger()`.

Now that we are able to find the relevant witness constructors, how do we:

- know which of them we must invoke,
- and in _which order_?

First, we must understand type unification:

## Aside: Type Unification

Type unification is the process of finding a substitution that makes two types
identical.

For example, given `Pair<[A], String>` and `Pair<Integer, String>`, then the
substitution `{A -> Integer}` would make the first type identical to the second.

> Here, I have placed the type `A` between square brackets to indicate that it
> is a _type variable_. We only substitute type variables!

Unification may fail when it encounters incompatible types. For example,
`List<Integer>` and `List<String>` cannot be unified because no substitution
exists that would make them identical.

Conversely, when two types are already identical, unification succeeds with an
empty substitution `{}`.

Because types are recursive, the unification algorithm must also be recursive
(in nature).

Consider:

```java
unify(
  Map<Pair<String, [T]>, List<[U]>>,
  Map<Pair<String, Integer>, List<Optional<Boolean>>>
)

// we are unifying two types of shape:
// - Map<K1, V1>
// - Map<K2, V2>
// the type constructors match on either side (Map)
// so we recurse to their type arguments:
// unify(K1, K2) ∪ unify(V1, V2)
// and so on!

=   unify(Pair<String, [T]>, Pair<String, Integer>)
  ∪ unify(List<[U]>, List<Optional<Boolean>>)

=   unify(String, String) // first arguments of Pair
  ∪ unify([T], Integer)   // second arguments of Pair
  ∪ unify([U], <Optional<Boolean>) // arguments of List

=   {}
  ∪ {T -> Integer}
  ∪ {U -> Optional<Boolean>}

= {T -> Integer, U -> Optional<Boolean>}

// Done!
```

If any unification step fails, then the entire unification fails:

```java
unify(Pair<[T], Integer>, Pair<String, String>)

=   unify([T], String)
  ∪ unify(Integer, String)

=   {T -> String}
  ∪ err

= err
```

Following is a code listing for the concrete type unification algorithm
`unify()` for our `ParsedType` definition, along with a `subsitute()` method
that applies a substitution to a type.

### Listing: Type Unification algorithm for `ParsedType`

Here we use the `Maybe` type, which is analogous to Java's `Optional`. It is
used to indicate that the `unify()` function may fail with a `nothing()` (empty)
case. This is different from it returning `just(Map.of())` (an empty map), which
signals success but without any substitutions. In short, based on the examples
above, `err` is `nothing()` and `{}` is `just(Map.of())`.

A key step here is the unification of `App`. This is the main driver for the
algorithm's recursion.

The following helper methods are relevant to this step:

```java
// applies function `f` if both `ma` and `mb` are present
<A, B, C> Maybe<C> apply(BiFunction<A, B, C> f, Maybe<A> ma, Maybe<B> mb);

// merges two maps
// it fails at runtime if duplicate keys /with different values/ exist
<K, V> Map<K, V> merge(Map<K, V> m1, Map<K, V> m2);
```

Here's the full code:

```java
class Unification {
  public static Maybe<Map<ParsedType.Var, ParsedType>> unify(ParsedType t1, ParsedType t2) {
    return switch (Pair.of(t1, t2)) {
      case Pair<ParsedType, ParsedType>(ParsedType.Var var1, ParsedType.Primitive p) ->
          Maybe.nothing(); // no primitives in generics
      case Pair<ParsedType, ParsedType>(ParsedType.Var var1, var t) ->
          Maybe.just(Map.of(var1, t));
      case Pair<ParsedType, ParsedType>(ParsedType.Const const1, ParsedType.Const const2)
          when const1.equals(const2) ->
          Maybe.just(Map.of());
      case Pair<ParsedType, ParsedType>(
              ParsedType.App(var fun1, var arg1),
              ParsedType.App(var fun2, var arg2)) ->
          Maybe.apply(Maps::merge, unify(fun1, fun2), unify(arg1, arg2));
      case Pair<ParsedType, ParsedType>(
              ParsedType.ArrayOf(var elem1),
              ParsedType.ArrayOf(var elem2)) ->
          unify(elem1, elem2);
      case Pair<ParsedType, ParsedType>(
              ParsedType.Primitive(var prim1),
              ParsedType.Primitive(var prim2))
          when prim1.equals(prim2) ->
          Maybe.just(Map.of());
      default ->
          Maybe.nothing();
    };
  }

  public static ParsedType substitute(Map<ParsedType.Var, ParsedType> map, ParsedType type) {
    return switch (type) {
      case ParsedType.Var var ->
          map.getOrDefault(var, var);
      case ParsedType.App(var fun, var arg) ->
          new ParsedType.App(substitute(map, fun), substitute(map, arg));
      case ParsedType.ArrayOf var ->
          new ParsedType.ArrayOf(substitute(map, var.elementType()));
      case ParsedType.Primitive p ->
          p;
      case ParsedType.Const c ->
          c;
    };
  }

  public static List<ParsedType> substituteAll(
      Map<ParsedType.Var, ParsedType> map, List<ParsedType> types) {
    return types.stream().map(t -> substitute(map, t)).toList();
  }
}
```

### Extra: A type representation for static methods

```java
record FuncType(Method java, List<ParsedType> paramTypes, ParsedType returnType) {
  public static FuncType parse(Method method) {
    if (!Modifier.isStatic(method.getModifiers())) {
      throw new IllegalArgumentException("Method must be static: " + method);
    }
    return new FuncType(
        method,
        ParsedType.parseAll(method.getGenericParameterTypes()),
        ParsedType.parse(method.getGenericReturnType()));
  }
}
```

## Subgoal: Witness resolution, part 2

Why is type unification relevant?

Type unification will guide the witness resolution process in two ways:

- By checking if any given witness constructor is relevant to our witness goal.
- And if it _is_ relevant, then it will tell us which witness subgoals to
  resolve next.

For example, when resolving `Show<List<Integer>>`, we check:

1. Which witness constructors can we find?

- We scan `List`:
  - It contains zero witness constructors.
- We scan `Show`, and it contains:
  - `Show<Integer> showInteger()`
  - `<A> Show<List<A>> showList(Show<A> showA)`

2. Which witness constructors apply to our goal?

- Does `Show<Integer> showInteger()` apply?
  - We try to unify `Show<Integer>` and `Show<List<Integer>>`.
  - Unification fails.
  - Skip this constructor ❌
- Does `<A> Show<List<A>> showList(Show<A> showA)` apply?
  - We try to unify `Show<List<A>>` and `Show<List<Integer>>`.
  - Unification succeeds with the substitution `{A -> Integer}`.
  - We can use this constructor ✅
  - But this constructor has an argument: `Show<A>`
  - If we apply the substitution to the argument, we find our next goal:
    - `substitute({A -> Integer}, Show<A>)` yields `Show<Integer>`.
  - Add `Show<Integer>` to our goals.

3. Recurse until we have no further goals.

That outlines the witness resolution algorithm.

## Recap

Until this point we have:

- `new Ty<T>() {}`: a way to capture a type `T` from a static context and access
  it at runtime.
- `ParsedType`: a uniform representation for Java's `java.lang.reflect.Type`s.
- `Unification`: an algorithm for type unification of `ParsedType`s.
- And a rough sketch for the overall recursive witness resolution algorithm.

Now, let's put it all together!

## Subgoal: Witness resolution implementation

Let's start with the witness constructor lookup code:

```java
@Retention(RetentionPolicy.RUNTIME)
@interface TypeClass {
  @Retention(RetentionPolicy.RUNTIME)
  @interface Witness {}
}

class TypeClasses {
  // ...

  private static List<InstanceConstructor> findRules(ParsedType target) {
    return switch (target) {
      case ParsedType.App(var fun, var arg) ->
          Lists.concat(findRules(fun), findRules(arg));
      case ParsedType.Const(var java) ->
          rulesOf(java);
      case ParsedType.Var(var java) ->
          List.of();
      case ParsedType.ArrayOf(var elem) ->
          List.of();
      case ParsedType.Primitive(var java) ->
          List.of();
    };
  }

  private static List<InstanceConstructor> rulesOf(Class<?> cls) {
    return Arrays.stream(cls.getDeclaredMethods())
        .filter(TypeClasses::isWitnessMethod)
        .map(FuncType::parse)
        .map(InstanceConstructor::new)
        .toList();
  }

  private static boolean isWitnessMethod(Method m) {
    return m.accessFlags().contains(PUBLIC)
        && m.accessFlags().contains(STATIC)
        && m.isAnnotationPresent(TypeClass.Witness.class);
  }

  private record InstanceConstructor(FuncType func) {}

  // ...
}
```

Now, let's move on to how we choose relevant witness constructors and find our
subsequent goals:

```java
class TypeClasses {
  // ...

  private static List<Candidate> findCandidates(ParsedType target) {
    return findRules(target).stream()
        .flatMap(
            rule ->
                rule
                    .tryMatch(target)
                    .map(requirements -> new Candidate(rule, requirements))
                    .stream())
        .toList();
  }

  private record Candidate(WitnessRule rule, List<ParsedType> requirements) {}

  // Spoiler: we will have another subtype of WitnessRule later on (;
  private sealed interface WitnessRule {
    Maybe<List<ParsedType>> tryMatch(ParsedType target);

    Object instantiate(List<Object> dependencies);
  }

  private record InstanceConstructor(FuncType func) implements WitnessRule {
    @Override
    public Maybe<List<ParsedType>> tryMatch(ParsedType target) {
      return Unification.unify(func.returnType(), target)
          .map(map -> Unification.substituteAll(map, func.paramTypes()));
    }

    @Override
    public Object instantiate(List<Object> dependencies) {
      try {
        return func.java().invoke(null, dependencies.toArray());
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
  }

  // ...
}
```

Then, the code that drives the recursive resolution:

```java
class TypeClasses {
  // ...

  private static Either<SummonError, Object> summon(ParsedType target) {
    return switch (ZeroOneMore.of(findCandidates(target, context))) {
      case ZeroOneMore.One<Candidate>(Candidate(var rule, var requirements)) ->
          summonAll(requirements, context)
              .map(rule::instantiate)
              .mapLeft(error -> new SummonError.Nested(target, error));
      case ZeroOneMore.Zero<Candidate>() ->
          Either.left(new SummonError.NotFound(target));
      case ZeroOneMore.More<Candidate>(var candidates) ->
          Either.left(new SummonError.Ambiguous(target, candidates));
    };
  }

  private static Either<SummonError, List<Object>> summonAll(List<ParsedType> targets) {
    return Either.traverse(targets, TypeClasses::summon);
  }

  private sealed interface SummonError {
    record NotFound(ParsedType target) implements SummonError {}

    record Ambiguous(ParsedType target, List<Candidate> candidates) implements SummonError {}

    record Nested(ParsedType target, SummonError cause) implements SummonError {}
  }

  // ...
}
```

And, finally, the public entry point for all of it:

```java
class TypeClasses {
  public static <T> T witness(Ty<T> ty) {
    return switch (summon(ParsedType.parse(ty.type()))) {
      case Either.Left<SummonError, Object>(SummonError error) ->
          throw new WitnessResolutionException(error);
      case Either.Right<SummonError, Object>(Object instance) -> {
        @SuppressWarnings("unchecked")
        T typedInstance = (T) instance;
        yield typedInstance;
      }
    };
  }

  public static class WitnessResolutionException extends RuntimeException {
    private WitnessResolutionException(SummonError error) {
      super(error.format());
    }
  }

  // ...
}
```

Surprinsingly, that's it!

You can find a _mostly accurate_ compilation of all of the above code in
[this Gist](https://gist.github.com/Garciat/a6ca3c9195d5b1d997badecd73282e38).
(This was the first version of the type class system that I built.)

Now, let's see it in action.

## Examples: First-Order Type Classes & Instances

### Type Class: Show

Given:

```java
@TypeClass
interface Show<A> {
  String show(A a);

  static <A> String show(Show<A> showA, A a) {
    return showA.show(a);
  }

  @TypeClass.Witness
  static Show<Integer> integerShow() {
    return i -> Integer.toString(i);
  }


  @TypeClass.Witness
  static Show<String> stringShow() {
    return s -> "\"" + s + "\"";
  }

  @TypeClass.Witness
  static <A> Show<Optional<A>> optionalShow(Show<A> showA) {
    return optA -> optA.map(a -> "Some(" + showA.show(a) + ")").orElse("None");
  }

  @TypeClass.Witness
  static <A> Show<List<A>> listShow(Show<A> showA) { ... }

  @TypeClass.Witness
  static <K, V> Show<Map<K, V>> mapShow(Show<K> showK, Show<V> showV) { ... }
}
```

Then:

```java
Map<String, List<Optional<Integer>>> m1 =
    Map.of(
        "a", List.of(Optional.of(1), Optional.empty()),
        "b", List.of(Optional.of(2), Optional.of(3)));

println(Show.show(witness(new Ty<>() {}), m1));
// Prints: {"a": [Some(1), None], "b": [Some(2), Some(3)]}
```

Note that this requires the recursive instantiation of 5 witness constructors.
Here's what some debug logs show:

```
Instantiating: () -> Show[A](String)
Instantiating: () -> Show[A](Integer)
Instantiating: ∀ A. (Show[A](A)) -> Show[A](Optional[T](A))
Instantiating: ∀ A. (Show[A](A)) -> Show[A](List[E](A))
Instantiating: ∀ K V. (Show[A](K), Show[A](V)) -> Show[A](Map[K, V](K)(V))
```

### Type Class: Monoid & Num

Given:

```java
@TypeClass
interface Monoid<A> {
  A combine(A a1, A a2);

  A identity();

  static <A> A combineAll(Monoid<A> monoid, List<A> elements) {
    A result = monoid.identity();
    for (A element : elements) {
      result = monoid.combine(result, element);
    }
    return result;
  }
}

@TypeClass
interface Num<A> {
  A add(A a1, A a2);

  A mul(A a1, A a2);

  A zero();

  A one();

  @TypeClass.Witness
  static Num<Integer> integerNum() {
    return new Num<>() {
      @Override
      public Integer add(Integer a1, Integer a2) {
        return a1 + a2;
      }

      @Override
      public Integer mul(Integer a1, Integer a2) {
        return a1 * a2;
      }

      @Override
      public Integer zero() {
        return 0;
      }

      @Override
      public Integer one() {
        return 1;
      }
    };
  }
}

record Sum<A>(A value) {
  @TypeClass.Witness
  public static <A> Monoid<Sum<A>> monoid(Num<A> num) {
    return new Monoid<>() {
      @Override
      public Sum<A> combine(Sum<A> s1, Sum<A> s2) {
        return new Sum<>(num.add(s1.value(), s2.value()));
      }

      @Override
      public Sum<A> identity() {
        return new Sum<>(num.zero());
      }
    };
  }
}
```

Then:

```java
var sums = List.of(new Sum<>(3), new Sum<>(5), new Sum<>(10));

println(Monoid.combineAll(witness(new Ty<>() {}), sums));
// Prints: Sum[value=18]
```

### Type Class: PrintAll

This example is based on:
[https://wiki.haskell.org/Varargs](https://wiki.haskell.org/Varargs)

It abuses type classes in order to implement variadic functions. Please read the
link above to understand how this works.

It's really striking how it _just works_ with our system!

Given:

```java
@TypeClass
interface PrintAll<T> {
  T printAll(List<String> strings);

  static <T> T of(PrintAll<T> printAll) {
    return printAll.printAll(List.of());
  }

  @TypeClass.Witness
  static PrintAll<Void> base() {
    return strings -> {
      for (String s : strings) {
        System.out.println(s);
      }
      return null;
    };
  }

  @TypeClass.Witness
  static <A, R> PrintAll<Function<A, R>> func(Show<A> showA, PrintAll<R> printR) {
    return strings -> a -> printR.printAll(Lists.concat(strings, List.of(showA.show(a))));
  }
}
```

Then:

```java
Function<String, Function<List<String>, Function<Integer, Void>>> printer =
    PrintAll.of(witness(new Ty<>() {}));

printer.apply("Items:").apply(JavaList.of("apple", "banana", "cherry")).apply(42);
// Prints:
// "Items:"
// ["apple", "banana", "cherry"]
// 42
```

### Type Class: Type Equality!

This examples shows how we can encode propositions about types themselves and
have the resolver construct evidence for them.

Reified type equality is very neat construct that I'd like to write more about
soon.

For now, let's appreciate how this neatly encodes
[Haskell's own type equality](https://hackage.haskell.org/package/base-4.21.0.0/docs/Data-Type-Equality.html)
in Java.

Consider:

```java
@TypeClass
sealed interface TyEq<A, B> {
  A castR(B b);

  B castL(A a);

  @TypeClass.Witness
  static <T> TyEq<T, T> refl() {
    return new Refl<>();
  }

  record Refl<T>() implements TyEq<T, T> {

    @Override
    public T castR(T t) {
      return t;
    }

    @Override
    public T castL(T t) {
      return t;
    }
  }
}
```

`TyEq<A, B>` represents the proposition that `A = B`.

And the only possible constructor for it is `refl()`, which can only prove that
`TyEq<T, T>` for any `T`.

How is that useful?

`TyEq<T, T>` may be trivial in the static context where it is constructed. But
it certainly is not in the context where it may be needed.

Take a look:

```java
class List<T> {
  // ...

  int sum(TyEq<T, Integer> ty) {
    int s = 0;
    for (T item : this) {
      s += ty.castL(item); // casts T to Integer !
    }
    return s;
  }

  // ...
}

// then

var xs = List.of(1, 2, 3);

xs.sum(refl());
// Returns: 6
```

Within `List<T>`, we have no idea what `T`. Code can make no assumptions about
it. However, if we have a proof that `T = Integer`, then we _can_ sum the
elements up into an `int`.

Now, we can also request them as witnesses in a witness constructor:

```java
@TypeClass
interface SumAllInt<A> {
  A sum(List<Integer> list);

  static <T> T of(SumAllInt<T> sumAllInt) {
    return sumAllInt.sum(List.of());
  }

  @TypeClass.Witness
  static SumAllInt<Integer> base() {
    return list -> list.stream().mapToInt(Integer::intValue).sum();
  }

  @TypeClass.Witness
  static <A, R> SumAllInt<Function<A, R>> func(TyEq<A, Integer> eq, SumAllInt<R> sumR) {
    return list -> a -> sumR.sum(Lists.concat(list, List.of(eq.castL(a))));
  }
}
```

Similar to the `PrintAll` example, this lets us summon variadic functions:

```java
Function<Integer, Function<Integer, Function<Integer, Integer>>> sum =
    SumAllInt.of(witness(new Ty<>() {}));
println(sum.apply(1).apply(2).apply(3));
```

However, notice how in the `func` rule, we requested `TyEq<A, Integer>`. This
constrains the `A` type argument to just `Integer`.

Funny enough, this is actually only necessary in Haskell due to how integer
literals are overloaded. So I implemented this here for no gain. But it was cool
that it just worked!

## Goal: Higher-Order Type Classes

Consider the `Functor` type class in Haskell:

```haskell
class Functor f where
  fmap :: (a -> b) -> f a - > f b
```

Notice how `f` is not a type?

It is not one because it is being applied to types `a` and `b`, respectively.

This means that `f` is a _type constructor_.

> A type constructor is a sort of type-level _function_ that builds new types
> from existing types.
>
> Here, we mean _function_ in a mathematical sense. A mathematical _relation_ is
> a _function_ if it is both injective (one-to-one) and surjective
> (non-partial).

In Java, `class List<T>` can be seen as a type constructor. Though we don't use
type application syntax as in Haskell, we do use type parameterization syntax:
`List<Integer>`. In Java, generic types cannot be partially applied. That is,
for a type `class C<T1, T2, ..., TN>`, we must provide all `N` type arguments at
once.

Let's try representing the `Functor` type class with a Java interface:

```java
interface Functor<F> {
  <A, B> F<B> fmap(Function<A, B> f, F<A> fa);
}
```

Uh-oh:

```
The type F is not generic; it cannot be parameterized with arguments <B>
```

Indeed, Java requires that the type parameter `F` is a _type_, and **not a type
constructor**.

Are we cooked?

Not quite.

## Aside: What is a kind?

Simply: values have types; types have kinds.

`42` has type `Integer`.

`Integer` has kind `*` (read: star).

> The syntax `*` for the kind of plain types comes from Haskell.
>
> We could also say `Integer` has kind `Type`, but that may be confusing given
> how overloaded the word 'type' is in this context.

`List<Integer>` also has kind `*`.

So what is the kind of `List` itself?

`List` has kind `* -> *`.

That is, it is a type-level function that accepts a type and returns a type.

## Aside: Higher-Kinded Types in Java

Here we introduce an _encoding_ of higher-kinded types for Java.

Recall that interface `Functor<F>` failed because Java insists `F` is a concrete
type, not a type constructor. This encoding gives us a way to pretend `F` is
higher-kinded.

> Note: I did not invent this encoding. I have seen several projects using it
> (see the Related Work section). I am not sure where it originated, but it is
> rather elegant.

Consider:

```java
interface TApp<F, A> {}

abstract class TagBase {}

sealed interface Maybe<A> extends TApp<Maybe.Tag, A> {
  record Nothing<A>() implements Maybe<A> {}
  
  record Just<A>(A value) implements Maybe<A> {}

  final class Tag extends TagBase {}

  static <A> Maybe<A> unwrap(TApp<Maybe.Tag, A> m) {
    return (Maybe<A>) m; // unsafe if we misuse TApp and tag types
  }
}
```

Let's unpack this:

- `TApp<F, A>` represents type application, hence its name.
  - We assume that `F` has kind `* -> *` and `A` has kind `*`.
  - `TApp<F, A>` represents `F<A>`.
  - Therefore `TApp<F, A>`, in principle, has kind `*`.
- `Maybe.Tag` is a sort of proxy type for `Maybe` as an unapplied type
  constructor.
  - `TApp<Maybe.Tag, A>`, in principle, means `Maybe<A>`.
  - That is why `Maybe<A> extends TApp<Maybe.Tag, A>`.
- `Maybe.Tag` extends `TagBase` just so that we can easily identify this type
  via reflection later.

How is this useful?

Now we _do_ have a mechanism (more of a convention) to represent `Functor`!

Check it out:

```java
interface Functor<F> {
  <A, B> TApp<F, B> fmap(Function<A, B> f, TApp<F, A> fa);
}
```

Remember: `TApp<F, A>` means `F<A>`.

And we can also define the witness constructor:

```java
sealed interface Maybe<A> extends TApp<Maybe.Tag, A> {
  // ...

  default <B> Maybe<B> map(Function<A, B> f) { ... }

  @TypeClass.Witness
  static Functor<Maybe.Tag> functor() {
    return new Functor<>() {
      @Override
      public <A, B> TApp<Maybe.Tag, B> fmap(Function<A, B> f, TApp<Maybe.Tag, A> fa) {
        return unwrap(fa).map(f);
      }
    };
  }
}
```

Let's unpack that:

- We define a witness constructor for `Functor<Maybe.Tag>`.
  - Remember: `Functor<Maybe.Tag>` means `Functor<Maybe>`, where `Maybe` is the
    unapplied type constructor.
- We then have to implement:
  - `<A, B> TApp<Maybe.Tag, B> fmap(Function<A, B> f, TApp<Maybe.Tag, A> fa)`
  - And remember:
    - `TApp<Maybe.Tag, A>` means `Maybe<A>`
    - `TApp<Maybe.Tag, B>` means `Maybe<B>`
  - If we squint our eyes a bit, _it does make sense_.
- We use `unwrap()` to convert from `TApp<Maybe.Tag, A>` to `Maybe<A>`.
- `Maybe<B>` is a subtype of `TApp<Maybe.Tag, B>`, so the return type just
  works.

That's it!

Now, we must extend our type class system to understand these typing
conventions.

## Subgoal: Extending `ParsedType` to support HKTs

This is actually not very involved. Check it out:

```java
sealed interface ParsedType {
  // ...

  static ParsedType parse(Type java) {
    return switch (java) {
      // New:
      case Class<?> tag
        when parseTagType(tag) instanceof Maybe.Just<Class<?>>(var tagged) ->
          new Const(tagged);
      // New:
      case ParameterizedType p
          when parseAppType(p)
              instanceof Maybe.Just<Pair<Type, Type>>(Pair<Type, Type>(var fun, var arg)) ->
          new App(parse(fun), parse(arg));
      // etc
    };
  }

  private static Maybe<Class<?>> parseTagType(Class<?> c) {
    return switch (c.getEnclosingClass()) {
      case Class<?> enclosing when c.getSuperclass().equals(TagBase.class) ->
          Maybe.just(enclosing);
      case null -> Maybe.nothing();
      default -> Maybe.nothing();
    };
  }

  private static Maybe<Pair<Type, Type>> parseAppType(ParameterizedType t) {
    return switch (t.getRawType()) {
      case Class<?> raw when raw.equals(TApp.class) ->
          Maybe.just(Pair.of(t.getActualTypeArguments()[0], t.getActualTypeArguments()[1]));
      default -> Maybe.nothing();
    };
  }
}
```

We only had to add two new pattern-match cases to `parse`:

- `case Class<?> tag when parseTagType(tag) ... tagged`
  - `-> new Const(tagged)`
  - This replaces any occurrence of `T.Tag` with `T` itself.
- `case ParameterizedType p when parseAppType(p) ... (fun, arg)`
  - `-> new App(parse(fun), parse(arg))`
  - This replaces any occurrence of `TApp<F, A>` with
    `new App(parse(F), parse(A))`.

That's it!

I was also surprised! The witness resolution code needs no changes whatsoever!

Although, I was worried about potential bugs coming from misuses of `Tag`s and
`TApp`. So I came up with a lightweight embedded kind-checking mechanism.

## Aside: Kind-checking Java-embedded HKTs

Given:

```java
interface Kind<K extends Kind.Base> {
  sealed interface Base {}

  // KStar = *
  final class KStar implements Base {}

  // KArr k = * -> k
  final class KArr<K extends Base> implements Base {}
}

abstract class TagBase<K extends Kind.Base> implements Kind<K> {}

// Full application of a unary type constructor
// TApp :: (* -> *) -> * -> *
interface TApp<Tag extends Kind<KArr<KStar>>, A> extends Kind<KStar> {}

// Partial application of a binary type constructor
// TPar :: (* -> * -> *) -> * -> (* -> *)
interface TPar<Tag extends Kind<KArr<KArr<KStar>>>, A> extends Kind<KArr<KStar>> {}
```

- `TApp` now can only apply to tags of kind `* -> *`, itself becoming a kind
  `*`.
- `TPar` applies to tags of kind `* -> * -> *`, itself becoming a kind `* -> *`.
- This gives us some rudimentary kind-checking in Java

Then:

```java
sealed interface Maybe<A> extends TApp<Maybe.Tag, A> {
  // ...

  final class Tag extends TagBase<KArr<KStar>> {}

  static <A> Maybe<A> unwrap(TApp<Tag, A> value) {
    return (Maybe<A>) value;
  }
}
```

And also:

```java
@FunctionalInterface
interface State<S, A> extends TApp<TPar<State.Tag, S>, A> {
  // ...

  @TypeClass.Witness
  static <S> Functor<TPar<Tag, S>> functor() { ... }

  final class Tag extends TagBase<KArr<KArr<KStar>>> {}

  static <S, A> State<S, A> unwrap(TApp<TPar<Tag, S>, A> value) {
    return (State<S, A>) value;
  }
}
```

Notice in this case that `State` has two type parameters:

- `State.Tag` has kind `KArr<KArr<KStar>>`
  - This means: `* -> * -> *`
- The first application of `State.Tag` must go through `TPar`.
- The subsequent application must go through `TApp`.

## Examples: Higher-Kinded Type Clases

### Type Class: Functor, Applicative, Monad

As expected:

```java
@TypeClass
interface Functor<F extends Kind<KArr<KStar>>> {
  <A, B> TApp<F, B> map(Function<A, B> f, TApp<F, A> fa);
}

@TypeClass
interface Applicative<F extends Kind<KArr<KStar>>> extends Functor<F> {
  <A> TApp<F, A> pure(A a);

  <A, B> TApp<F, B> ap(TApp<F, Function<A, B>> ff, TApp<F, A> fa);

  @Override
  default <A, B> TApp<F, B> map(Function<A, B> f, TApp<F, A> fa) {
    return ap(pure(f), fa);
  }
}

@TypeClass
interface Monad<M extends Kind<KArr<KStar>>> extends Applicative<M> {
  <A, B> TApp<M, B> flatMap(Function<A, TApp<M, B>> f, TApp<M, A> fa);

  @Override
  default <A, B> TApp<M, B> map(Function<A, B> f, TApp<M, A> fa) {
    return flatMap(a -> pure(f.apply(a)), fa);
  }

  @Override
  default <A, B> TApp<M, B> ap(TApp<M, Function<A, B>> ff, TApp<M, A> fa) {
    return flatMap(a -> map(f -> f.apply(a), ff), fa);
  }
}
```

### Type Class: Traversable

Given:

```java
@TypeClass
interface Traversable<T extends Kind<KArr<KStar>>> {
  <F extends Kind<KArr<KStar>>, A, B> TApp<F, ? extends TApp<T, B>> traverse(
      Applicative<F> applicative, Function<A, TApp<F, B>> f, TApp<T, A> ta);

  static <F extends Kind<KArr<KStar>>, T extends Kind<KArr<KStar>>, A, B>
      TApp<F, ? extends TApp<T, B>> traverse(
          Traversable<T> traversable,
          Applicative<F> applicative,
          TApp<T, A> tA,
          Function<A, TApp<F, B>> f) {
    return traversable.traverse(applicative, f, tA);
  }
}
```

Then:

```java
// Unfortunately for HKTs, we must wrap regular Java lists
record JavaList<A>(List<A> toList) implements TApp<JavaList.Tag, A> {
  // ...

  @TypeClass.Witness
  public static <A> Show<JavaList<A>> show(Show<A> showA) { ... }

  @TypeClass.Witness
  public static Functor<JavaList.Tag> functor() { ... }

  @TypeClass.Witness
  public static Traversable<JavaList.Tag> traversable() { ... }

  // ...
}
```

For example:

```java
println(
    Traversable.traverse(
        witness(new Ty<>() {}), // for Traversable<JavaList>
        witness(new Ty<>() {}), // for Applicative<Maybe>
        JavaList.of(1, 2, 3)
        Maybe::just));
// Prints: Just[value=JavaList[toList=[1, 2, 3]]]
```

## Conclusion

This was **a lot** of fun to work on. I had never before implemented type
classes in a language, and it turned out to be way simpler than I thought. The
key insight was figuring out that type unification was all that I needed.
Stupidly, I did not check Haskell's spec to figure that out. But it did come
somewhat naturally after a bit of thinking, given my experience in implementing
type systems.

This project was partially inspired by
[this recent Brian Goetz JVMLS talk](https://www.youtube.com/watch?v=Gz7Or9C0TpM)
where he presents his early ideas on how to bring type clases to Java. His
proposed syntax is `Show<Integer>.witness`. And, of course, the mechanism is
supposed to resolve witnesses at compile time.

You can find the complete implementation in
[this Gist](https://gist.github.com/Garciat/204226a528018fa7d10abb93fa51c4ca).

The code also contains several other type class examples like QuickCheck's
[Arbitrary type class](https://hackage-content.haskell.org/package/QuickCheck-2.17.1.0/docs/Test-QuickCheck-Arbitrary.html).

### Future work

- The resolution mechanism could use some caching:
  - For witness constructor lookups.
  - For witness instances themselves.
- It would be ideal to shift witness resolution to compile time.
  - Perhaps with a javac plugin or something like that?

### Related Work

Here are some related projects and posts:

- [HighJ](https://github.com/DanielGronau/highj)
  - HKT encoding via `Higher<F, A>`.
  - Provides Functor/Monad/etc.
  - **No automatic instance resolution**, instances are explicit classes.

- [Cyclops React](https://github.com/aol/cyclops)
  - Functional programming toolkit for Java.
  - Type class-like interfaces (Functor, Monad, etc.).
  - **Manual instance lookup**, no reflection or unification.

- [Higher-Kinded-J](https://github.com/higherkindness/higherkinded-j)
  - Modern HKT encoding using witness types.
  - Supports Functor, Applicative, Monad, MonadError, etc.
  - **Instances must be explicitly provided**, not inferred.

- [mduerig/java-functional](https://github.com/mduerig/java-functional)
  - Experimental HKT + type class encodings in Java.
  - Conceptually related exploration.
  - **No generic instance search or unification engine**.

- [Type Classes in Java (blog post)](https://zarinfam.github.io/2018/12/01/type-classes-in-java/)
  - Demonstrates type class pattern using interfaces.
  - **Requires manual wiring of instances**.

- [JavaGI](https://www.infosun.fim.uni-passau.de/cl/staff/sulzmann/javagi/)
  - Research extension to Java with Haskell-style type classes.
  - Uses **unification-based instance resolution**.
  - **Requires its own compiler**, not a Java library.

## Annex: Context Instances

Consider this example:

```java
static <A> String example(Show<A> showA, A value) {
  return Show.show(witness(new Ty<>() {}), JavaList.of(value));
}
```

It is equivalent to the following Haskell code:

```haskell
example :: Show a => a -> String
example value = show [value]
```

In the Java code, we try to lookup `Show<List<A>>`, but we don't know what `A`
is!

Sure, at runtime we may know its real type, but we actually would like
resolution to be static. (Even though we use reflection for witness resolution.)

In the Haskell code, the available instance of `Show a` as captured by the
function's signature becomes available as a 'context instance' that is used to
derive `Show [a]` for the call of `show`.

How can we achieve this in Java?

First, we define a type that can capture a witness along with its static type:

```java
abstract class Ctx<T> {
  private final T instance;

  Ctx(T instance) {
    this.instance = instance;
  }

  public T instance() {
    return instance;
  }

  public Type type() {
    return requireNonNull(
        ((ParameterizedType) getClass().getGenericSuperclass())
            .getActualTypeArguments()[0]);
  }
}
```

It leverages the same mechanism as `Ty<T>` to capture static types.

Then, we pass it to the `witness()` method:

```java
static <A> String example(Show<A> showA, A value) {
  return Show.show(
      witness(new Ty<>() {}, new Ctx<>(showA) {}),
      JavaList.of(value));
}
```

Finally, we update a bit of our type class resolution code:

```java
class TypeClasses {
  // New: second parameter
  public static <T> T witness(Ty<T> ty, Ctx<?>... context) {
    return switch (summon(ParsedType.parse(ty.type()), parseContext(context))) {
      // ...
    };
  }

  // New: parsing Ctx<?> into ContextInstance
  private static List<ContextInstance> parseContext(Ctx<?>[] context) {
    return Arrays.stream(context)
        .map(ctx -> new ContextInstance(ctx.instance(), ParsedType.parse(ctx.type())))
        .toList();
  }

  // ...

  // New: second parameter
  private static Either<SummonError, Object> summon(
      ParsedType target, List<ContextInstance> context) {
    // ...
  }

  // New: second parameter
  private static Either<SummonError, List<Object>> summonAll(
      List<ParsedType> targets, List<ContextInstance> context) {
    // ...
  }

  // New: second parameter
  private static List<Candidate> findCandidates(
      ParsedType target, List<ContextInstance> context) {
    // New: use the context instances along with the discovered witness constructors!
    return Stream.<WitnessRule>concat(
            context.stream(),
            findRules(target).stream())
        .flatMap(...)
        .toList();
  }

  // ...

  // New: a new case class for WitnessRule
  private record ContextInstance(Object instance, ParsedType type) implements WitnessRule {
    @Override
    public Maybe<List<ParsedType>> tryMatch(ParsedType target) {
      // This is a concrete instance, so we only check for type equality
      return target.equals(type) ? Maybe.just(List.of()) : Maybe.nothing();
    }

    @Override
    public Object instantiate(List<Object> dependencies) {
      // Trivial
      return instance;
    }
  }
}
```

That's all. A bit noisy, but rather simple.

Now this works:

```java
static <A> String example(Show<A> showA, A value) {
  return Show.show(
      witness(new Ty<>() {}, new Ctx<>(showA) {}),
      JavaList.of(value));
}

println(example(witness(new Ty<>() {}), 123));
```

Here, the type captured by `new Ctx<>(showA) {}` is `Show<A>`, where `A` is the
_unique type variable_ belonging to the `example` method.

The `Show<List<A>>` witness that we are trying to summon needs a `Show<A>` whose
type could only possibly exist in this static context!

## Annex: Overlapping Instances

In Haskell, the `String` type is defined as:

```haskell
type String = [Char]
```

That is, a `String` is just a list of `Char`.

Now, notice the difference here:

```haskell
show [1, 2, 3]
-- "[1, 2, 3]"

show [('a', 1), ('b', 2)]
-- "[('a', 1), ('b', 2)]"

show ['a', 'b']
-- "\"ab\"" what?
```

The generic `Show` instance for `[a]` simply intercalates `", "` between
elements.

But the `Show` instance for `[Char]` behaves differently.

Why is that? This is due to a language extension called
[overlapping instances](https://ghc.gitlab.haskell.org/ghc/doc/users_guide/exts/instances.html#overlapping-instances).

It allows otherwise ambiguous instances to coexist:

```haskell
instance Show a => Show [a] where ...

instance {-# OVERLAPPING #-} Show [Char] where ...
```

The `OVERLAPPING` pragma tells the compiler that this instance may override
another instance iff it is more specific.

The rules for instance specificity are explained in the same link.

Now, consider in Java:

```java
sealed interface FwdList<A> extends TApp<FwdList.Tag, A> {
  record Nil<A>() implements FwdList<A> {}

  record Cons<A>(A head, FwdList<A> tail) implements FwdList<A> {}

  @TypeClass.Witness
  static <A> Show<FwdList<A>> show(Show<A> showA) { ... }

  // Ambiguous!
  @TypeClass.Witness
  static Show<FwdList<Character>> show() { ... }
}
```

`FwdList` (name inspired by
[C++'s std::forward_list](https://en.cppreference.com/w/cpp/container/forward_list.html))
implements a data structure like Haskell's lists.

As it is, witness resolution will fail with an ambiguous witness error.

In order to support overlapping instance, we must apply some changes.

First, let's model Haskell's `OVERLAPPING` and `OVERLAPPABLE` pragmas:

```java
@Retention(RetentionPolicy.RUNTIME)
@interface TypeClass {
  @Retention(RetentionPolicy.RUNTIME)
  @interface Witness {
    Overlap overlap() default Overlap.NONE;

    enum Overlap {
      NONE,
      OVERLAPPING,
      OVERLAPPABLE
    }
  }
}
```

Then, we make it accessible from `InstanceConstructor`:

```java
private record InstanceConstructor(FuncType func) implements WitnessRule {
  public TypeClass.Witness.Overlap overlap() {
    return func.java().getAnnotation(TypeClass.Witness.class).overlap();
  }

  // ...
}
```

Finally, we implement the overlapping instances deduction algorithm as described
in
[Haskell's spec](https://ghc.gitlab.haskell.org/ghc/doc/users_guide/exts/instances.html#overlapping-instances):

```java
private static List<InstanceConstructor> reduceOverlapping(
    List<InstanceConstructor> candidates) {
  return candidates.stream()
      .filter(
          iX ->
              candidates.stream()
                  .filter(iY -> iX != iY)
                  .noneMatch(cY -> isOverlappedBy(iX, cY)))
      .toList();
}

private static boolean isOverlappedBy(
    InstanceConstructor iX, InstanceConstructor iY) {
  return (iX.overlap() == OVERLAPPABLE || iY.overlap() == OVERLAPPING)
      && isSubstitutionInstance(iX, iY)
      && !isSubstitutionInstance(iY, iX);
}

private static boolean isSubstitutionInstance(
    InstanceConstructor base, InstanceConstructor reference) {
  return Unification.unify(base.func().returnType(), reference.func().returnType())
      .fold(() -> false, map -> !map.isEmpty());
}
```

And we apply it to our candidate resolution function:

```java
private static List<Candidate> findCandidates(
    ParsedType target, List<ContextInstance> context) {
  return Stream.<WitnessRule>concat(
          context.stream(),
          reduceOverlapping(findRules(target)).stream())
      .flatMap(...)
      .toList();
}
```

And, of course, we annotate our witness constructor:

```java
sealed interface FwdList<A> extends TApp<FwdList.Tag, A> {
  record Nil<A>() implements FwdList<A> {}

  record Cons<A>(A head, FwdList<A> tail) implements FwdList<A> {}

  @TypeClass.Witness
  static <A> Show<FwdList<A>> show(Show<A> showA) { ... }

  // OK now!
  @TypeClass.Witness(overlap = OVERLAPPING)
  static Show<FwdList<Character>> show() { ... }
}
```

Now, our witness resolution code will pick `Show<FwdList<Character>>` because it
is more specific AND it declares that it may overlap other instances.
