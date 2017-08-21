---
layout:     post
title:      Rotate a Square Matrix
date:       2017-08-21 01:19
---

(Referring to [this leetcode problem](https://leetcode.com/problems/rotate-image/).)

Pictorally, my approach consists of:

Given a NxN (N=6 here) matrix, number its four corners:

    1 . . . . 2
    . . . . . .
    . . . . . .
    . . . . . .
    . . . . . .
    4 . . . . 3

Rotate elements at positions 1, 2, 3, 4 clockwise:

    4 . . . . 1
    . . . . . .
    . . . . . .
    . . . . . .
    . . . . . .
    3 . . . . 2

Next, number their clockwise-immediate elements:

    # 1 . . . #
    . . . . . 2
    . . . . . .
    . . . . . .
    4 . . . . .
    # . . . 3 #

(Already dealt with elements are marked with `#`.)

Repeat the previous steps N-1 times (in total):

    # # 1 . . #        # # # 1 . #
    . . . . . #        . . . . . #
    . . . . . 2  --->  4 . . . . #
    4 . . . . .  --->  # . . . . 2
    # . . . . .        # . . . . .
    # . . 3 # #        # . 3 # # #
                    //
                  //
                 LL 
    # # # # 1 #        # # # # # #
    4 . . . . #        # . . . . #
    # . . . . #  --->  # . . . . #
    # . . . . #  --->  # . . . . #
    # . . . . 2        # . . . . #
    # 3 # # # #        # # # # # #

Notice how we moved through the 'outer layer' of the matrix
in a 'spiral' shape, and its elements were rotated thusly.

By applying the same procedure to the inner layers, we arrive at a fully rotated matrix.

The code follows:

```cpp
struct Pos { int i, j; };

void rotate(vector<vector<int>>& m) {
  // for every k-th layer:
  for (int k = 0; k < m.size() / 2; ++k) {
    // it has n*n size:
    int n = m.size() - k * 2;
    // apply our 'spiral' rotating procedure n-1 times:
    for (int s = 0; s < n - 1; ++s) {
      rotateLayer(m, k, s);
    }
  }
}

void rotateLayer(vector<vector<int>> &m, int layer, int step) {
  int k = layer;
  int s = step;

  // top-left corner,  moving right   (j += s)
  Pos p1 { k,             k + s };
  // top-right corner, moving down    (i += s)
  Pos p2 { k + s,         k + n - 1 };
  // bottom-right corner, moving left (j -= s)
  Pos p3 { k + n - 1,     k + n - 1 - s };
  // bototm-left corner,  moving up   (i -= s)
  Pos p4 { k + n - 1 - s, k };
  
  // swap clockwise
  tie(at(m, p1), at(m, p2), at(m, p3), at(m, p4))
    = make_tuple(at(m, p4), at(m, p1), at(m, p2), at(m, p3));
}

int& at(vector<vector<int>>& m, Pos p) {
  return m[p.i][p.j];
}
```

Note that this algorithm is not exactly cache-friendly (: