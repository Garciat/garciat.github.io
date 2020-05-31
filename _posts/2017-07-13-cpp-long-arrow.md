---
layout:       post
title:        "RE: The long arrow operator in C++"
date:         2017-07-13 19:10
description:  "Overloading C++ syntax via constexpr"
---

I came accross Ivan Čukić's [post on the long arrow operator](http://cukic.co/2017/07/12/the-long-arrow-operator-in-cxx/) for C++, where he *jokingly* proposes the use of `--->`, `----->`, etc. for dereferencing nested pointer-like structures.

Like most jokes, there's a nugget of truth behind it, and I decided to tackle the problem of nested structures with my own crazy C++.

My take allows the user to write the following code:

```cpp
auto hello1(wrap<vec2> w) {
    return w->x + w->y;
}

auto hello2(wrap<wrap<vec2>> w) {
    return w->x + w->y;
}

auto hello3(wrap<wrap<wrap<vec2>>> w) {
    return w->x + w->y;
}

// ... etc
```

Essentially, the `->` collapses an arbitrary number of `wrap` applications into a single one. But how?

Here's how.

```cpp
template <typename T>
struct wrap {
    auto operator->() {
        if constexpr (is_wrap_v<T>) {  // impl of is_wrap_v below
            return value.operator->();
        } else {
            return &value;
        }
    }

    T value;
};
```

We make use of C++17's `if constexpr` feature to statically determine whether we've reached a "pure" value or we need to continue unwrapping.

The full code can be found [here](https://gist.github.com/Garciat/d63d79976ad9c09aa771915a76281530), and thanks to the amazing Compiler Explorer you can try it for yourself [here](https://godbolt.org/g/FkfkoX).

One possible generalization is to replace `is_wrap_v<T>` with a `has_operator_arrow_v<T>` which returns `true` if `T` provides `operator->`.

Modern C++ is fun!
