---
layout:       post
title:        "Python: Effect Handlers and Free Monads via async/await"
date:         2020-06-27
description:  "I implement a restricted flavor of Effect Handlers and Free Monads via async/await."
---

## Background

### Effect Handlers

TODO

### Free Monads

TODO

## Example

### The domain

Imagine writing a small app that integrates Twitter's and Facebook's APIs.

The data & effect domain could look like this:

```python
@dataclass(frozen = True)
class Tweet: ...


@dataclass(frozen=True)
class FacebookUser: ...


@dataclass(frozen = True)
class GetTweets(Effect[List[Tweet]]):
  user_id: str


@dataclass(frozen = True)
class GetFollowers(Effect[List[str]]):
  user_id: str


@dataclass(frozen = True)
class GetFriends(Effect[List[FacebookUser]]):
  user_id: str
```

For example, `GetTweets` is an `Effect` that produces `List[Tweet]`.

Then, we make some boilerplate definitions. These help us interface with Python's async/await.

```python
async def get_tweets(user_id: str) -> List[Tweet]:
  return await EffectFuture(GetTweets(user_id=user_id))


async def get_followers(user_id: str) -> List[str]:
  return await EffectFuture(GetFollowers(user_id=user_id))


async def get_friends(user_id: str) -> List[FacebookUser]:
  return await EffectFuture(GetFriends(user_id=user_id))
```

`EffectFuture` is a support function from my effects system implementation. It lifts an `Effect[T]` into `Awaitable[T]`. `Awaitable[T]` is the generic abstract base class for objects that can be used in `await` expressions.

### Usage program

Then, we write a small program that makes use of those `async` functions. The program's code & types are not even aware that there is an effect system.

```python
async def my_program(user_id: str) -> int:
  tweets = await get_tweets(user_id)

  for t in tweets:
    print(t)

  print(await get_followers('someone_else'))
  print(await get_friends('yet_another_one'))

  return len(tweets)
```

### Handling the effects

Let's define trivial handlers that provide stub data for each API operation:

```python
class StubTwitterHandler(EffectHandler):
  def handle(self) -> Generator[None, None, Answer[Any]]:
    try:
      yield
    except GetTweets as get_tweets:
      return get_tweets.answer([Tweet(), Tweet()])
    except GetFollowers as get_followers:
      return get_followers.answer(['follow1', 'follow2'])
    else:
      impossible()


class StubFacebookHandler(EffectHandler):
  def handle(self) -> Generator[None, None, Answer[Any]]:
    try:
      yield
    except GetFriends as get_friends:
      return get_friends.answer([FacebookUser()])
    else:
      impossible()
```

Notice the code pattern that each handler implements:

```python
try:
  yield
except MyEffectType as my_effect:
  return my_effect.answer(expected_value)
except ...:
  ...
else:
  impossible()  # necessary to type-check
```

`Answer[T]` is the type of 'answers' to effects. Calling `Effect[T].answer(T value)` produces an `Answer[T]`. This helps the handler implementations remain relatively type-safe. Otherwise, doing `return value` would not be type checked in the context of a `Generator[None, None, Any]`. Particularly because there is no (static) relationship between the `value : T` and the `Effect[T]` that is being fulfilled.

It is also possible to define a passthrough handler that performs logging on all effects:

```python
class EffectLogger(EffectHandler):
  def handle(self) -> Generator[None, None, Answer[Any]]:
    try:
      yield
    except Effect as effect:
      print('EffectLogger:', repr(effect))
      raise  # forward the effect ahead
    else:
      impossible()
```

### Putting it all together

First, we must define a handler that composes all our handlers. (The handlers are tried in definition sequence.)

```python
def _main() -> None:
  handler = HandlerStack(
    EffectLogger(),
    StubTwitterHandler(),
    StubFacebookHandler(),
  )

  print('final output:', run_effects(handler, my_program('garciat')))
```

If we run the script, the output is:

```
EffectLogger: GetTweets(user_id='garciat')
Tweet()
Tweet()
EffectLogger: GetFollowers(user_id='someone_else')
['follow1', 'follow2']
EffectLogger: GetFriends(user_id='yet_another_one')
[FacebookUser()]
final output: 2
```

## Implementation

This is the support code for the example above.

**Note 1:** I'm still fairly unfamiliar with the `async`/`await` + Generators mechanism, so this implementation is probably sub-optimal.

**Note 2:** The implementation is focused around being statically checkable by `mypy --strict`.

```python
from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from typing import Any
from typing import Awaitable
from typing import Callable
from typing import Generator
from typing import Generic
from typing import List
from typing import NoReturn
from typing import Tuple
from typing import TypeVar
from typing import Union
from typing import cast


_T = TypeVar('_T')


###

class _PromiseSentinel: pass


_PROMISE_SENTINEL = _PromiseSentinel()


@dataclass
class Promise(Generic[_T]):

  _result: Union[_PromiseSentinel, _T] = _PROMISE_SENTINEL

  def complete(self, value: _T) -> None:
    if isinstance(self._result, _PromiseSentinel):
      self._result = value
    else:
      raise Exception('Promise already set')

  @property
  def value(self) -> _T:
    if isinstance(self._result, _PromiseSentinel):
      raise Exception('Promise not yet set')
    else:
      return self._result


def impossible() -> NoReturn: raise Exception('impossible')


###
# Effects implementation


class Answer(Generic[_T], ABC):
  pass


@dataclass
class _AnswerImpl(Generic[_T], Answer[_T]):
  value: _T


class Effect(Generic[_T], BaseException, ABC):
  def answer(self, value: _T) -> Answer[_T]:
    return _AnswerImpl(value)

  def __str__(self) -> str:
    return repr(self)


@dataclass
class EffectFuture(Generic[_T], Awaitable[_T]):

  effect: Effect[_T]

  def __await__(self) -> Generator[Any, None, _T]:
    p: Promise[_T] = Promise()
    yield self.effect, p
    return p.value


class EffectHandler(ABC):
  @abstractmethod
  def handle(self) -> Generator[None, None, Answer[Any]]: ...

  def do_handle(self, effect: Effect[_T]) -> Answer[_T]:
    h = self.handle()
    h.send(None)
    try:
      e: Any = effect
      h.throw(e)
    except StopIteration as stop:
      return cast(Answer[Any], stop.value)
    else:
      impossible()


class HandlerStack(EffectHandler):

  _handlers: Tuple[EffectHandler, ...]

  def __init__(self, *handlers: EffectHandler):
    self._handlers = handlers

  def handle(self) -> Generator[None, None, Answer[Any]]:
    try:
      yield
    except Effect as effect:
      for handler in self._handlers:
        try:
          return handler.do_handle(effect)
        except Effect as effect_inner:
          if effect_inner is effect:
            continue
          else:
            # TODO potential use case: mapping effects
            raise Exception('Unexpected effect: {!r}'.format(effect_inner))
      raise  # re-raise uhandled
    else:
      impossible()


def run_effects(handler: EffectHandler, awaitable: Awaitable[_T]) -> _T:
  gen = cast(Generator[Tuple[Effect[Any], Promise[Any]], None, _T], awaitable.__await__())
  try:
    while True:
      effect, promise = gen.send(None)
      answer = handler.do_handle(effect)
      if isinstance(answer, _AnswerImpl):
        promise.complete(answer.value)
      else:
        raise Exception('Unexpected answer: {!r}'.format(answer))
          
  except Effect as effect_inner:
    raise Exception('Unhandled effect: {!r}'.format(effect))
  except StopIteration as stop:
    return cast(_T, stop.value)
```
