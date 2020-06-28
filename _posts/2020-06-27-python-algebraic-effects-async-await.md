---
layout:       post
title:        "Python: Algebraic Effects via async/await"
date:         2020-06-27
description:  "I implement some kind of restricted effects system in Python via async/await."
---

## Background

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
  async def handle(self, effect: Effect[Any]) -> Optional[Answer[Any]]:
    if isinstance(effect, GetTweets):
      return effect.answer([Tweet(), Tweet()])
    elif isinstance(effect, GetFollowers):
      return effect.answer(['follow1', 'follow2'])
    else:
      return None


class StubFacebookHandler(EffectHandler):
  async def handle(self, effect: Effect[Any]) -> Optional[Answer[Any]]:
    if isinstance(effect, GetFriends):
      return effect.answer([FacebookUser()])
    else:
      return None
```

`Answer[T]` is the type of 'answers' to effects. Calling `Effect[T].answer(T value)` produces an `Answer[T]`. This helps the handler implementations remain relatively type-safe. Otherwise, doing `return value` would not be type checked in the context of a `Generator[None, None, Any]`. Particularly because there is no (static) relationship between the `value : T` and the `Effect[T]` that is being fulfilled.

It is also possible to define a passthrough handler that performs logging on all effects:

```python
class EffectLogger(EffectHandler):
  async def handle(self, effect: Effect[Any]) -> Optional[Answer[Any]]:
    print('EffectLogger:', repr(effect))
    return None
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

<script src="https://gist.github.com/Garciat/1484d16ae455ca791147a1eab0836f9a.js"></script>
