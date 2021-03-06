---
layout:       post
title:        "Python: Algebraic Effects via async/await"
date:         2020-06-27
description:  "I implement some kind of restricted effects system in Python via async/await."
redirect_from:
  - /2020/06/27/python-algebraic-effects-async-await/
---

## TL;DR

The full source code can be found in [this gist](https://gist.github.com/Garciat/1484d16ae455ca791147a1eab0836f9a).

## The Challenge

We are looking to implement a library through which side-effect "requests" can be separated from their implementation.

A requirement of this implementation is that it is as type-safe as possible and that it type-checks under `mypy --strict`.

Let's go.

## First, Some Concepts

```python
from abc import ABC  # abstract base classes
from typing import Generic, TypeVar  # static type checking

T = TypeVar('T')

class Effect(Generic[T], ABC): ...
```

An `Effect[T]` is an _abstract generic type_ that describes an effect that produces a value of type `T`.

For example, we may describe an API to fetch tweets like so:

```python
from dataclasses import dataclass
from typing import List

# A data type describing the contents of a Tweet
@dataclass(frozen = True)
class Tweet: ...

@dataclass(frozen = True)
class GetTweets(Effect[List[Tweet]]):
  user_id: str
```

This type definition means: `GetTweets` is an `Effect` that produces a `List` of `Tweet`s.

We have a simple type by which we can describe effects that produce values: `Effect[T]`. Now, we need something that can handle (or run) these effects in order to produce actual values.

```python
from abc import abstractmethod
from typing import Any

class EffectHandler(ABC):
  @abstractmethod
  def handle(self, effect: Effect[Any]) -> Any: ...
```

`EffectHandler` is an _abstract type_ with an operation `handle` that takes an `Effect[Any]` (any type of effect) and returns a value that is produced from handling the effect.

For example, we may implement a class that is able to handle effects related to the Twitter API:

```python
class StubTwitterHandler(EffectHandler):
  def handle(self, effect: Effect[Any]) -> Any:
    if isinstance(effect, GetTweets):
      # Return some fake tweets
      return [Tweet(), Tweet(), Tweet()]
```

And we may invoke the handler directly:

```python
StubTwitterHandler().handle(GetTweets('garciat_com'))
# returns: [Tweet(), Tweet(), Tweet()]
```

However, if we defined a new effect for logging, this `StubTwitterHandler` would not handle the effect:

```python
@dataclass(frozen = True)
class Log(Effect[None]):
  message: str

StubTwitterHandler().handle(Log('this is a message'))
# returns: None  (sort of indistinguishable from a "real" None value)
```

Great. We now have two fundamental definitions at hand:
  * An `Effect[T]` describes an effect that produces values of type `T`.
  * An `EffectHandler` is able to handle/execute/run a _subset_ of effects.

## Using Generators to Emit Effects

Python Generators allow two functions to communicate with 'message passing'. This is a good fit for our goal of separating side-effect requests from side-effects implementation.

For example:
  1. A generator produces an instance of `Effect[T]` and then pauses execution.
  2. The underlying 'effect system' invokes the relevant `EffectHandler` to obtain a value of type `T`.
  3. The value `T` is passed to the generator to resume its execution.
  4. Repeat until generator terminates.

In code:

```python
def print_user_tweets(user_id: str) -> ???:
  tweets = yield GetTweets(user_id)
  for tweet in tweets:
    print(tweet)
  return len(tweets)

def run_effects(handler: EffectHandler, generator: ???) -> ???:
  # 'effect system' implementation

# Running it:
run_effects(StubTwitterHandler(), print_user_tweets('garciat_com'))
```

Notice that some type declarations are missing and have `???` instead. Why?

## The Typing Problem With Generators

The `typing` module describes the type of generators as `Generator[YieldType, SendType, ReturnType]`.

The problem with this definition is that there is no static relationship between `YieldType` and `SendType`. That is, given `x = yield e` where `e: Effect[T]`, we would like `x` to _statically_ have type `T`.

Saying `Generator[Effect[T], T, ...]` would not work, because the type `T` is determined at the call time of the generator function, and not by the body of the function.

For example:

```python
def does_not_work() -> Generator[Effect[T], T, str]:
  tweets: List[Tweet]
  tweets = yield GetTweets('garciat_com')
  return 'bye'
```

`mypy` complains with:

```
error: Incompatible types in "yield" (actual type "GetTweets", expected type "Effect[T]")
error: Incompatible types in assignment (expression has type "T", variable has type "List[Tweet]")
```

## `await` is like `yield` with ∀

We observed that `yield`'s type is determined by its `Generator` type. `await`'s type, however, is _universally quantified_:

`∀T. y : T = await (x : Awaitable[T])`.

In English:
  * for all type `T`
    * given `y = await x`
      * `x` has type `Awaitable[T]`
      * and `y` has type `T`

Now, what is an `Awaitable[T]` and how do we turn our `Effect[T]` into one?

`Awaitable[T]` stands for a type that has a method `__await__(self) -> Generator[Any, None, T]`. In other words, given an `aw : Awaitable[T]`, `aw.__await__()` must return a generator that eventually terminates by returning a value of type `T`.

At the moment, it is not clear how we would implement the `__await__` method. However, we may start defining a type that wraps `Effect`s into `Awaitable`s:

```python
from typing import Awaitable, Generator

@dataclass(frozen = True)
class EffectFuture(Generic[T], Awaitable[T]):
  effect: Effect[T]

  def __await__(self) -> Generator[Any, None, T]:
    raise NotImplementedError
```

Now we are able to expose `Effect`s as regular 'async' functions:

```python
async def get_tweets(user_id: str) -> List[Tweet]:
  return await EffectFuture(GetTweets(user_id=user_id))
```

This successfully type-checks with `mypy --strict`.

We may now revisit our untypable definitions (those with the `???`) and give them proper types:

```python
async def print_user_tweets(user_id: str) -> int:
  tweets = await get_tweets(user_id)
  for tweet in tweets:
    print(tweet)
  return len(tweets)

def run_effects(handler: EffectHandler, awaitable: Awaitable[T]) -> T:
  # 'effect system' implementation
```

Great. It's interesting how the `print_user_tweets` function is not aware of the existence of the effects mechanism. As far as it is concerned, it is calling a 'regular async function' `get_tweets` to get the list of tweets.

## Understanding `__await__`

First, let's take a look at what `print_user_tweets` actually does.

If we run this:

```python
gen = print_user_tweets('garciat_com')
x = gen.send(None)  # resume the generator
print(x)
```

It fails with:

```
Traceback (most recent call last):
  File "post.py", line ?, in <module>
    x = gen.send(None)
  File "post.py", line ?, in print_user_tweets
    tweets = await get_tweets(user_id)
  File "post.py", line ?, in get_tweets
    return await EffectFuture(GetTweets(user_id=user_id))
  File "post.py", line ?, in __await__
    raise NotImplementedError
```

The call graph eventually reaches the `__await__` method we defined.

In order for the flow to continue, `__await__` in `EffectFuture[T]` must return a value of type `T`. Where can we get one?

Let's take a closer look at `__await__`'s signature:

```python
def __await__(self) -> Generator[Any, None, T]
```

Remember the definition of the `Generator` type:

`Generator[YieldType, SendType, ReturnType]`

In `__await__`'s case, the type variables are set to:
  * `YieldType = Any`
  * `SendType = None`
  * `ReturnType = T`

This means that `__await__` may yield any value, but _it may not receive a value_.

That's interesting. If it may not receive a value, where will it get the `T` instance that it needs?

One option is using `Promise`s. In our context, a `Promise` is a "box" that starts out empty and is filled in once.

```python
from typing import Union

class _PromiseSentinel: pass

_PROMISE_SENTINEL = _PromiseSentinel()

@dataclass
class Promise(Generic[T]):

  _result: Union[_PromiseSentinel, T] = _PROMISE_SENTINEL

  def complete(self, value: T) -> None:
    if isinstance(self._result, _PromiseSentinel):
      self._result = value
    else:
      raise Exception('Promise already set')

  @property
  def value(self) -> T:
    if isinstance(self._result, _PromiseSentinel):
      raise Exception('Promise is not set')
    else:
      return self._result
```

Then, we fit the `Promise` inside the `Future`:

```python
from dataclasses import field

@dataclass(frozen = True)
class EffectFuture(Generic[T], Awaitable[T]):

  effect: Effect[T]
  promise: Promise[T] = field(default_factory=Promise)

  def __await__(self) -> Generator[Any, None, T]:
    yield self
    return self.promise.value
```

We implement `__await__` by yielding the `Future` itself, which contains the `Effect` and the `Promise`. We assume that the effect loop will complete the promise before `__await__` is resumed. Finally, we read the `T` value out of the `Promise` and return it.

If we run this again:

```python
gen = print_user_tweets('garciat_com')
x = gen.send(None)  # resume the generator
print(x)
```

It prints:

```
EffectFuture(effect=GetTweets(user_id='garciat_com'), promise=Promise(_result=<__main__._PromiseSentinel object at 0x10a326a10>))
```

We can then run:

```python
x.promise.complete([Tweet(), Tweet()])
gen.send(None)  # resume the generator
```

And we get:

```
Tweet()
Tweet()
Traceback (most recent call last):
  File "post.py", line 102, in <module>
    gen.send(None)
StopIteration: 2
```

This means that `print_user_tweets` received the list of tweets, performed its loop, and terminated by returning `2` (the length of the list of tweets).

However, a generator's way of signaling termination is by raising `StopIteration`, with a property `value` populated with the return value of the generator. Here, it's `2`.

Here's the full interaction:

```python
gen = print_user_tweets('garciat_com')
x = gen.send(None)  # resume the generator
x.promise.complete([Tweet(), Tweet()])
try:
  gen.send(None)  # resume the generator
except StopIteration as stop:
  assert stop.value == 2
```

We are now prepared to implement `run_effects`!

## The Effect Loop

TODO: explain code

```python
from typing import cast

def run_effects(handler: EffectHandler, awaitable: Awaitable[T]) -> T:
  gen = cast(Generator[EffectFuture[Any], None, T], awaitable.__await__())
  try:
    while True:
      future = gen.send(None)
      future.promise.complete(handler.handle(future.effect))
  except StopIteration as stop:
    return cast(T, stop.value)
  finally:
    gen.close()
```

Using it:

```python
handler = StubTwitterHandler()
awaitable = print_user_tweets('garciat_com')
print('final result:', run_effects(handler, awaitable))
```

Prints:

```
Tweet()
Tweet()
Tweet()
final result: 3
```

## Type Safety in Handlers

TODO: introduce `Answer` type

## Composing Handlers

TODO: introduce `HandlerStack`

## Effectful Handlers

TODO: `async def handle` + recursive `run_effects`
