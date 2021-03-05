---
layout:       post
title:        "Programming with Units"
date:         2021-03-05
description:  "I describe a code meta-pattern that I have developed and applied in the last year."
---

## Abstract

In this post I describe a code 'meta-pattern' that has helped me segregate responsibilities and keep tests neat.

Note: there is more I'd like to say about this topic, so consider this a _draft_.

## Structurally

A Unit is a class that follows this structure:

  - Its instance fields (if any) are private and final. These are called dependencies.

  - It has a trivial constructor which receives the expected dependencies and sets them to the corresponding fields.

  - It has a single public instance method.

  - It does not reference any stateful classes directly (i.e. If a stateful class is referenced, then it must be declared as a dependency).

Example:

```java
@RequiredArgsConstructor // trivial constructor via Lombok
public class NameForTheClass {

  private final SomeDependencyA a;
  private final SomeDependencyB b;

  public ReturnType methodName([Arg arg, ...]) {
    [...]
  }

  // as many private methods as desired
}
```

## Semantically

  - Units and their dependency requirements form a DAG.

    - This graph is resolved at application startup by a Dependency Injection library.

    - Thus, all Units are singletons.

  - Units are stateless.

  - Units with only stateless dependencies (aka pure Units) are referentially transparent.

  - A Unit's public method describes its interface. (Obviously.)

## Testing

  - All of a Unit's dependencies are mocked.

  - Tests exercise individual code paths, stubbing the necessary method calls on the mocked dependencies.

Example JUnit 5 tests with Mockito:

```java
@RunWith(MockitoJUnitRunner.StrictStubs.class)
public class NameForTheClassTests {

  @Mock private SomeDependencyA a;
  @Mock private SomeDependencyB b;
  @InjectMocks private NameForTheClass subject;

  @Test
  public void methodName_pathA() {
    when(a.someMethod(x, y)).thenReturn(z);

    val result = subject.methodName(a, b, c);

    val expected = [...];
    assertThat(expect).isEqualTo(result);
  }
}
```

## Intuition: Correct by Construction

A cluster of pure Units can be programmed in a 'correct by construction' fashion:

  - Assume the received dependencies are correct.

    - And they are, if tested appropriately.

  - Implement logic using the dependencies.

    - Test the logic appropriately, mocking the dependencies.

  - The resulting Unit is now correct.

  - Note: 'Correct by construction' is not a strict claim -- just an analogy.

## Prescription: Programming Paradigm

My recommended programming paradigm is Functional Programming.

This means that:

  - Business logic is exclusive to Units.

  - Data types are immutable POJOs with trivial constructors and no behavior.

    - Exception: Base Types (TODO).

  - The input and output types of a Unit must be immutable.
