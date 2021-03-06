---
layout:       post
title:        "Binary search on the integer number line"
date:         2017-07-06
description:  "Exploring the usefulness of C++'s std::partition_point"
redirect_from:
  - /2017/07/06/integer-partition/
---

Consider a predicate `p(x)` such that:

* `forall x in [1..k-1]: p(x)`
* `forall x in [k..n]: !p(x)`

In other words, `[1..n]` is partitioned by `p(x)` at `k`.

In problems such as [this one (First Bad Version)](https://leetcode.com/problems/first-bad-version/), we are asked to implement an algorithm analogous to git's [bisect command](https://git-scm.com/docs/git-bisect). Based on the problem statement, it is straightforward to model it as the above partitioning scheme.

Then there's problems such as [this other one (Arranging Coins)](https://leetcode.com/problems/arranging-coins/) where the connection to partitioning is not exactly obvious, but it's still there.

A naive approach to finding `k` is to iterate over `[1..n]` sequentially and stop when `p(x)` no longer holds. The time-complexity of this algorithm is `O(n)` (ignoring the cost of computing `p(x)`).

A more efficient approach is to perform a binary search over `[1..n]`. This brings down the time-complexity to `O(lg n)`. Visually:

```text
     [xxxxxxxxxxooo]
     /     /\      \
    /     /  \      \
   /     /    \      \
a:[xxxxxx]  b:[xxxxooo]

p(x) holds for a's last element.
This means that the partition point (k) is not in this range.
We are safe to discard range `a`, halving our search space.
```

The algorithm works and it's quite efficient, but implementing binary search can be quite a hassle. I think that playing around with indices is a pain, and it's very easy to forget when to `+1` something or when not to do it. I can rarely get it right on the first try.

When implementing something is too costly, we must first turn our attention to libraries. Thankfully, binary search is a common enough algorithm that it's not a big surprise to find an implementation in the standard library of our language of choice.

For example, C++'s `algorithm` library provides the `lower_bound` operation with the following signature:

```cpp
template< class ForwardIt, class T >
ForwardIt lower_bound( ForwardIt first, ForwardIt last, const T& value );

// -- or --

template< class ForwardIt, class T, class Compare >
ForwardIt lower_bound( ForwardIt first, ForwardIt last, const T& value, Compare comp );
```

However, that's not quite the droid we're looking for. The function assumes that we know the element we're looking for and only tries to find its position (roughly) in the range. Although we could jump through some hoops to make `lower_bound` work, C++11 has sneaked in a function that better suits our needs: `partition_point`. Take a look at its signature and description:

```cpp
template< class ForwardIt, class UnaryPredicate >
ForwardIt partition_point( ForwardIt first, ForwardIt last, UnaryPredicate p );
```

> Examines the partitioned (as if by std::partition) range [first, last) and locates the end of the first partition, that is, the first element that does not satisfy p or last if all elements satisfy p.

That's *exactly* what we need... or is it?

If we decide to reify the `[1..n]` range into some collection (e.g. a `std::vector<int>`), then yes it is. But that's an obvious waste of space.

Can we do away with reifying the range? Yes we can, but it's not pretty. We need to implement [RandomAccessIterator](http://en.cppreference.com/w/cpp/concept/RandomAccessIterator) by essentially lifting `int` into its interface:

```cpp
struct number_iter {
    int val;
    bool operator ==(number_iter rhs) {
        return val == rhs.val;
    }
    bool operator !=(number_iter rhs) {
        return val != rhs.val;
    }
    number_iter& operator++() {
        ++val;
        return *this;
    }
    int operator*() {
        return val;
    }
    int operator-(number_iter rhs) {
        return val - rhs.val;
    }
    number_iter& operator+=(int x) {
        val += x;
        return *this;
    }
};

// This is the tricky part:

namespace std {
    template <>
    struct iterator_traits<number_iter> {
        using difference_type = int;
        using iterator_category = random_access_iterator_tag;
    };
}
```

Now we can solve [First Bad Version](https://leetcode.com/problems/first-bad-version/) like so:

```cpp
auto pred = [](int x) { return !isBadVersion(x+1); };
auto it = std::partition_point(number_iter{0}, number_iter{n}, pred);
return *it + 1;
```

And similarly with [Arranging Coins](https://leetcode.com/problems/arranging-coins/):

```cpp
if (n == 1) return 1;
auto pred = [n](long long x) { return x*(x+1)/2 <= n; };
auto it = std::partition_point(number_iter{0}, number_iter{n}, pred);
return *it - 1;
```

Okay, okay. I agree that this approach is suboptimal in terms of implementability. You could argue that it's harder to implement than binary search. But, hey, at least we learned a couple of things about the STL.

Don't forget to carefully scan through the [C++ algorithm library](http://en.cppreference.com/w/cpp/algorithm).

### Edit (2017-07-16):

Yet another problem: [Single Element in a Sorted Array](https://leetcode.com/problems/single-element-in-a-sorted-array/).

```cpp
int singleNonDuplicate(vector<int>& nums) {
    int n = nums.size();
    auto pred = [&nums] (int i) { return nums[2*i] == nums[2*i+1]; };
    auto it = partition_point(number_iter{0}, number_iter{n/2}, pred);
    return nums[2 * (*it)];
}
```
