---
title: "Full Haskell-like Type Class resolution in Java"
date: 2025-12-06
description: "Typeclasses, Higher-Kinded Types, and Overlapping Instances in Pure Java: A post about re-implementing a mini Haskell in Java, using reflection, generic metadata, and type unification."
tags:
  - Haskell
  - Java
---

## Goal: First-Order Type Classes

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

println(Show.show(w, List.of(List.of(1, 2), List.of(3, 4))));
// Prints: [[1, 2], [3, 4]]
```

We want:

```java
println(Show.show(witness(), List.of(List.of(1, 2), List.of(3, 4))));
// Prints: [[1, 2], [3, 4]]
```

Which means that the `witness()` method was able to automatically produce the
value of type `Show<List<List<Integer>>>` for us!

How do we get there?

First, we must understand some aspects of how Java generics work at runtime.

> Note: I use the words 'witness' and 'type class instance' interchangeably.

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
System.out.println(IntStream.class.getInterfaces()[0]);
// Prints: Stream

System.out.println(IntStream.class.getGenericInterfaces()[0]);
// Prints: Stream<Integer>
```

This means that Java _did_ preserve the generic type arguments for the supertype
`Stream<Integer>`. (We just need to know where to look for it.)

Note that this also occurs with anonymous classes:

```java
var s = new Stream<String>() { ... };

System.out.println(s.getClass().getGenericInterfaces()[0]);
// Prints: Stream<String>
```

This leads us to our first workaround:

## Aside: Capturing types

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

System.out.println(type);
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

- `new Ty<T>() {}`: a way to capture an arbitrary type `T` and access it at
  runtime.
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
and not within type classes. However, for built-in type like `Integer`, we have
no choice and we must define its witness constructors within the relevant type
classes, as we have done with `static Show<Integer> showInteger()`.

Now that we are able to find the relevant witness constructors, how do we know
_which of them we must invoke_ and in _which order_?

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

### Listing: Type Unification algorithm for `ParsedType`

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

- `new Ty<T>() {}`: a way to capture an arbitrary type `T` and access it at
  runtime.
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

Reified type equality is very neat construct that I'd like to write more about
soon.

For now, let's appreciate how this neatly encodes
[Haskell's own type equality](https://hackage.haskell.org/package/base-4.21.0.0/docs/Data-Type-Equality.html)
in Java.

Given:

```java
@TypeClass
sealed interface TyEq<A, B> {
  A castR(B b);

  B castL(A a);

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

  @TypeClass.Witness
  static <T> TyEq<T, T> tyEqRefl() {
    return refl();
  }
}
```

Of course, we can manually construct `refl()` instances. And these can be really
useful. (I will write about this soon.)

But we can also request them as witnesses in a witness constructor:

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

I am not sure where this workaround originated, but it is rather elegant.

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
- We use `unwrap()` to covert from `TApp<Maybe.Tag, A>` to `Maybe<A>`.
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

The code also:

- Implements Haskell's notion of
  [overlapping instances](https://ghc.gitlab.haskell.org/ghc/doc/users_guide/exts/instances.html#overlapping-instances).
  (But not incoherent instances.)
- Contains several other type class examples like QuickCheck's
  [Arbitrary type class](https://hackage-content.haskell.org/package/QuickCheck-2.17.1.0/docs/Test-QuickCheck-Arbitrary.html).

### Future work

- The resolution mechanism could use some caching:
  - For witness constructor lookups.
  - For witness instances themselves.
- It would be ideal to shift witness resolution to compile time.
  - Perhaps with a javac plugin or something like that?

### Related Work

As of the time of writing, ChatGPT reports the following:

- [HighJ](https://github.com/DanielGronau/highj)
  - HKT encoding via `Higher<F, A>`.
  - Provides Functor/Monad/etc.
  - **No automatic instance resolution**, instances are explicit classes.

- [Cyclops React](https://github.com/aol/cyclops)
  - Functional programming toolkit for Java.
  - Typeclass-like interfaces (Functor, Monad, etc.).
  - **Manual instance lookup**, no reflection or unification.

- [Higher-Kinded-J](https://github.com/higherkindness/higherkinded-j)
  - Modern HKT encoding using witness types.
  - Supports Functor, Applicative, Monad, MonadError, etc.
  - **Instances must be explicitly provided**, not inferred.

- [mduerig/java-functional](https://github.com/mduerig/java-functional)
  - Experimental HKT + typeclass encodings in Java.
  - Conceptually related exploration.
  - **No generic instance search or unification engine**.

- [Type Classes in Java (blog post)](https://zarinfam.github.io/2018/12/01/type-classes-in-java/)
  - Demonstrates typeclass pattern using interfaces.
  - **Requires manual wiring of instances**.

- [JavaGI](https://www.infosun.fim.uni-passau.de/cl/staff/sulzmann/javagi/)
  - Research extension to Java with Haskell-style typeclasses.
  - Uses **unification-based instance resolution**.
  - **Requires its own compiler**, not a Java library.
