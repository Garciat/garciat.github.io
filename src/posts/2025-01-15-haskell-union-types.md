---
title:        "TypeScript and Haskell: Unions & Singletons"
date:         2025-01-15
description:  "I briefly explore union types and singleton types in Haskell and TypeScript."
no_toc: true
---

I like TypeScript's type system. In particular, I like the combination of
[Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
(aka anonymous Sum Types) and
[Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
(aka Singleton Types).

Those features allow us to achieve API precision, while also minding
conciseness:

```typescript
// Not very precise
type Result = {
  ok: boolean;
  error?: string;
  userRole?: string;
  avatarSize?: number;
};

// Much more precise
type Result =
  | { ok: false; error: string }
  | { ok: true; userRole: "ADMIN" | "GUEST"; avatarSize: 96 | 128 | 512 };
```

Let's compare that to Haskell without any language extensions:

```haskell
data Result =
  ResultError { resultError :: String }
  | ResultOk { resultUserRole :: UserRole, resultAvatarSize :: AvatarSize }

data UserRole = UserRoleAdmin | UserRoleGuest

data AvatarSize = AvatarSize96 | AvatarSize128 | AvatarSize512
```

Unfortunately, Haskell falls short compared to TypeScript:

- We must declare the types `UserRole` and `AvatarSize`.
- Actual value alternatives (e.g 96, 128) are obfuscated by their respective ADT
  tags (e.g `AvatarSize96` and `AvatarSize128`).

So I went on the hunt for Haskell extensions that could help bridge those gaps.

Here's one alternative that I found:

```haskell
{-# Language DataKinds, GADTs #-}

import GHC.Base
import GHC.TypeLits

---

type OneOfNat :: [Nat] -> Type

data OneOfNat ns where
  Here :: SNat n -> OneOfNat (n ': ns)
  There :: OneOfNat ns -> OneOfNat (n ': ns)

---

type AvatarSize = OneOfNat [96, 128, 512]

hello :: AvatarSize -> String
hello size =
  case size of
    Here @96 _ -> "96"
    There (Here @128 _) -> "128"
    There (There (Here @512 _)) -> "512"

---

main = print $ hello $ There (Here SNat)
```

Here's another alternative:

```haskell
{-# Language DataKinds, UnboxedSums #-}

import GHC.Base
import GHC.TypeLits

---

type AvatarSize = (# SNat 96 | SNat 128 | SNat 512 #)

hello :: AvatarSize -> String
hello size =
  case size of
    (# SNat @96 | | #) -> "96"
    (# | SNat @128 | #) -> "128"
    (# | | SNat @512 #) -> "512"

---

main = print $ hello $ (# SNat @96 | | #)
```

I like this solution because the syntax is flat, compared to the previous nested
`Here`s and `There`s.

However,
[unpacked sum types](https://gitlab.haskell.org/ghc/ghc/-/wikis/unpacked-sum-types)
behave very differently from regular types.

For example, we cannot do this:

```haskell
type family UOneOfNat ns where
  UOneOfNat [a, b] = (# SNat a | SNat b #)
  UOneOfNat [a, b, c] = (# SNat a | SNat b | SNat c #)

type AvatarSize = UOneOfNat [96, 128, 512]
```

Because each unpacked sum type has a different kind based on its arity:

```
Main.hs:10:25: error: [GHC-83865]
    • Couldn't match kind: '[LiftedRep]
                     with: '[]
      Expected kind ‘TYPE (SumRep [LiftedRep, LiftedRep])’,
        but ‘(# SNat a | SNat b | SNat c #)’ has kind ‘TYPE
                                                         (SumRep [LiftedRep, LiftedRep, LiftedRep])’
    • In the type ‘(# SNat a | SNat b | SNat c #)’
      In the type family declaration for ‘UOneOfNat’
   |
10 |   UOneOfNat [a, b, c] = (# SNat a | SNat b | SNat c #)
   |                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

Moreover, neither alternative holds the desired semantics of the type union
behaving like a set of types, i.e. normalizing duplicates. We could use
[type-level Sets](https://hackage.haskell.org/package/type-level-sets-0.8.9.0/docs/Data-Type-Set.html)
for this, but that only further complicates our representation.
