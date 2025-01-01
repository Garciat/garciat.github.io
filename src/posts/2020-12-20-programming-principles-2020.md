---
title:        "My Programming Principles in 2020"
date:         2020-12-20
description:  "This is rough brain dump of several principles/ideas that I applied in 2020 while working at Uber."
---

## Abstract

This is rough brain dump of several principles/ideas that I applied in 2020
while working at Uber.

## The fact that the code runs and does what you want means _very little_

- There are several other aspects of code that matter critically in a
  professional environment.

## Correctness composes

- It's easier to prove that a small thing is correct.
  - So write small classes; glue them together.
    - A small class is easy to test, change, reason about, delete, refactor.
    - The hard part is picking What it does and its Name, of course!
  - If the glue is correct, then everything is correct.
- To prove that something is correct:
  - Try all inputs
    - If there are too many combinations (N*M inputs)
    - Then use **Types** to constrain the domains! (smaller N * smaller M)
    - Or if you split the responsibility (if possible) you get N+M
  - Exercise all code paths
    - If there are too many combinations (N*M paths)
    - Then extract the inner part to a class. Now you have N+M.

## Let tests tell you how complex your code is

- If tests for a single class are:
  - Abundant (many test cases)
  - Require big preambles/setups
    - Like loading big, complex JSON fixtures
  - Hard to read
  - ...
- Then the code being tested is too complex!
- Note: do not try to refactor the tests!
  - They are only a side-effect of the logic being tested!

## Try to not couple tests to logic that is not the subject of the test

## Some test inputs shall remain fully abstract

## There are _kinds_ of responsibilities

- For example:
  - Orchestrating other classes
  - Bridging domains
  - Making decisions
  - Bridging layers
  - …
- It is useful to understand which kind of responsibility you’re writing.
  - And make sure you’re doing only one!

## There are _kinds_ of data

- For example:
  - Boundary types (aka DTOs)
  - …
- Again, it is useful to understand which kind of data type you’re writing.
  - And make sure you’re doing only one!

## Arrows shall flow in a single direction

- Arrows include:
  - Control flow
  - Data flow
  - Class relationships
  - Dependencies
  - Layers
  - …
- The ideal shape is **a line**.
  - But sometimes a shallow tree may be better than a _very long_ line.
    - One problem with a long line is the burden of passing and accumulating
      context.
      - Either as data or just cognitively.
- The next best shape is **a tree**.
  - Remember: sibling tree branches _never meet at any point_ (except for their
    parent).
  - **Do note:** I have a strong suspicion that shallow trees are easier to deal
    with than deep ones.
- If your arrows form a graph, you’re in trouble.
  - Think very very hard and try to make it a tree.
  - At least try to make it a DAG.
  - If all else fails, aim to reduce the size of your loops.

## Immutability changes everything

- Mutation introduces a boatload of problems:
  - ...
- That said, if you must, mutation is only allowed within the scope of a
  **single method**.
  - And only on data that was created within that scope.
  - Imagine constructing a list or some other structure.

## Data or logic; not both

- Only place logic in business classes.
- Business classes do not have data fields.
  - They only have dependencies on other business classes.
- There is one exception:
  - Base types (will try to think of a better name)
    - (Explanation)
  - But this comes at a cost: these are hard to mock and _usually shouldn’t be
    mocked_.
    - Hard to mock because of
      - A) coupling to constructor / static factory
      - B) repeated/complex interactions
        - Think how much fun you’d have mocking a Stream object!

## Rich data reifies meaning, but is interpretation-free

- This one is pretty abstract, but there is something to it. I need to think
  harder on how to articulate it.
- Some thoughts:
  - Computation flow/semantics can be reified into data
    - Think eDSL + interpreter

## Plain data = pure interface

- See:
  [Scott encoding](https://en.wikipedia.org/wiki/Mogensen%E2%80%93Scott_encoding)
- The moment you deviate from:
  - Immutable
  - Trivial constructor
  - Structural equality
- Then you are in a different territory.
  - Not bad.
  - Just be aware.

## Think in terms of types and transformations

## Added meaning = changed type

- For example:
  - If you validated that a String is a valid currency code,
  - Then you should wrap that String in a CurrencyCode type.
  - Otherwise, that String is still a String.
    - And any code that touches it **must hold an implicit assumption** (which
      implies accidental coupling) that the String has been validated at some
      point.
      - Haha! And sometimes that _assumption_ becomes a _hope_!

## Organize code in domain packages

- What is the point of putting all Controllers in a controller folder when
  they’re all functionally unrelated to each other? Really.

## ‘Code reuse’ considered harmful

- Writing libraries is extremely hard.
  - And even then, experts constantly fail.
  - I’m sure you’ve come across more than a few hideous libraries and
    frameworks.
- And the cost of failure is, by definition, high.
  - The code is being used in many places. So it will be wrong in many places.
- Another point:
  - Things that are conceptually different should **be** different.
    - TODO make this a principle?
  - ...

## ‘Everything is an X’ considered harmful

- Everything is a Controller. Everything is a Service. Everything is an Object.
- If you like, sure.
- But what distinguishes controller A from controller B?
- And how do you make that distinction evident to others?

## ‘Mappers’ considered harmful

- ‘Mapping’ means nothing.
  - Any function is a mapping.
    [Literally](https://en.wikipedia.org/wiki/Function_(mathematics)#Map).
- Because the name means nothing and imposes no restrictions
  - Then the code will inevitably do anything
  - This is a ‘Pit of Despair’
- Important: if they are not declared dependencies (e.g. in Spring) they will be
  retested and add more complexity to the overall tests.
  - See: "Unmockable + reused = double-testing & test breakage"
- Instead consider:
  - If the input is some structured object and the output is a String
    - Call this a Format or Codec
  - If the input is a String and the output is a structured object
    - Call this a Parser
  - If the input is a Thrift/Proto object and the output is a structured object
    - Call this a Parser
    - Yes, that’s right.
      - Because the code is taking barely-structured data (structs and strings,
        basically) into well-typed, well-structured data in your internal model
    - Bonus:
      [parsers compose](https://garciat.com/2020/06/27/java-functional-validation/)
      (shameless plug).
  - And more
    - The point is to consider what are the layers or domains being bridged.

## Java Builders considered harmful

- Automatically-generated Builders (eg via Lombok) have issues:
  - It is possible to forget setting a field, so it will be `null` and NullAway
    wont pick it up
    - Source of bugs
    - Pit of Despair
  - If you use @NonNull, then you just turned a compiler-detectable error into a
    runtime error
    - Read the point below
    - Also: "Static > Dynamic"
- Instead, use straight up constructors or factory methods
  - Then whenever you add a new field to your data type, all callers **will
    break**. And that is exactly what you want. The compiler will not let you
    move on unless you fix this.
    - Builders will silently compile and fail at runtime.

## null considered harmful

## ‘Automappers’ considered harmful

## ‘Anti-boilerplate’ _sometimes_ considered harmful

## Mind your layers

## Mind your public API surface

## Unmockable + reused = double-testing & test breakage

## If error handling is not required, it will be skipped

- Yet another ‘Pit of Despair’.
- Consider using ADTs
  - Where success and failure cases are represented by the same type
  - Then the observer **must** pattern match on the ADT to be able to proceed
    - And it **must** handle all the cases

## Algebraic Data Types are not great; they’re _necessary_

- What are ADTs? [Shameless plug](https://garciat.com/2020/05/07/java-adt/).
  - Think of them as “enums with data inside”.
- A very useful feature is that an ADT disjunction (case A, **or** case B) can
  be used not only to **model decisions** but also to **separate the decision
  maker from the decision observer**.
  - The decision maker returns the decision as one of the cases of an ADT.
  - The decision observer uses pattern matching to exercise/interpret the
    decision.
  - This helps with:
    - Separation of concerns
    - Sticking to a single responsibility
    - Avoiding deep class dependencies
      - Because instead of calling the next step in the flow _as a decision_,
        you return the decision as data and let your caller do that.

## (Tip) Use ADTs in your public API to remain open to extension

## Build ‘Pits of Success’

- If you are designing an API that others will use (e.g. Thrift)
  - Then you want **the correct thing to be the easiest and simplest thing to
    do**
- If it is easy to make a mistake (misinterpret, misuse, misunderstand)
  - Then the wrong thing _will inevitably_ happen!
  - aka Murphy’s Law
- In contrast, a ‘Pit of Despair/Doom’ is an API that is so hard to use that
  _misuse is the default_.
- Some tips:
  - Leverage types!
    - Make incorrect inputs or states _impossible to represent_!
  - If all else fails, use documentation.
- Credits to [Scott Hanselman](https://www.hanselman.com/) for this idea.

## Incorrect code should not compile

- Contrast these signatures:
  - sadMethod(String, String, String)
  - happyMethod(Currency, Locale, UserName)
- I think it is clear which one evokes the ‘Pit of Success’ concept.
- Again, if it is **possible** to mix up the arguments, then they **will be
  mixed**.
  - Good luck writing your postmortem and refunding your users!
- That is just one example of **leveraging types** so that **the compiler makes
  it impossible to do the wrong thing**.
- There are many more cases, examples, and techniques.
  - To learn many of them: learn Haskell!

## One public method

- If a business class has more than one public method, then it probably has more
  than one responsibility.
  - And we want to avoid that!

## Static > Dynamic

- It is easier to understand static relationships.
- It is harder to understand relationships that depend on time or the state of
  the system.
- Relationships are:
  - Caller-callee relationships
  - Dependencies
  - Control flow
  - ...

## Avoid inheritance

- I have seen it misused more frequently than not.
  - And if it does work, it will probably not be compatible with the rest of
    these principles, because I simply avoid thinking in terms of inheritance.
- Many authors advise against it.
- It is one of the (if not **the**) strongest coupling relationships in the
  toolbox.
  - And that is _very risky_.

## Be wary of dynamic business-level higher-order inputs & outputs

- Dependencies are **static** higher-order inputs
  - They are easier to reason about, mock

## (Proto idea) Structural equality only
