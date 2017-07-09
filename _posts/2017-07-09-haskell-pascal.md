---
layout:     post
title:      Pascal's triangle in Haskell
date:       2017-07-09 14:34
---

(My answer to [this Stack Overflow question](https://stackoverflow.com/a/44999165/612169).)

Start out with the triangle itself:

         1
        1 1
       1 2 1
      1 3 3 1
     1 4 6 4 1
        ...

You should notice that to write down the next row, you must apply this rule: sum the previous rows' adjacent elements, using a `0` for the lonely edge elements. Visually:

        0   1   0
         \+/ \+/
      0   1   1   0
       \+/ \+/ \+/
    0   1   2   1   0
     \+/ \+/ \+/ \+/
      1   3   3   1
           ...

Operationally, that looks like this:

    For row 0:
    [1]  (it's a given; i.e. base case)
    
    For row 1:
    [0, 1]   <- row 0 with a zero prepended ([0] ++ row 0)
     +  +
    [1, 0]   <- row 0 with a zero appended  (row 0 ++ [0])
     =  =
    [1, 1]   <- element-wise addition
    
    For row 2:
    [0, 1, 1]
     +  +  +
    [1, 1, 0]
     =  =  =
    [1, 2, 1]

    Generally, for row N:
    
    element-wise addition of:
      [0] ++ row(N-1)
      row(N-1) ++ [0]

Remember that element-wise addition of lists in Haskell is `zipWith (+)`.

Thus we arrive at the following Haskell definition:

```haskell
pascal 0 = [1]
pascal n = zipWith (+) ([0] ++ pascal (n-1)) (pascal (n-1) ++ [0])
```

Or in a fashion similar to the famous "lazy fibs":

```haskell
pascals = [1] : map (\xs -> zipWith (+) ([0] ++ xs) (xs ++ [0])) pascals
```
