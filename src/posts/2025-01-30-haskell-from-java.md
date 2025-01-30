---
title: "Calling Haskell from Java"
date: 2025-01-30
description: "I put together a self-contained example that calls compiled Haskell from Java using the new Foreign Function & Memory API from JEP 454."
tags:
  - Haskell
  - Java
  - FFI
---

Around 2021, while working at Uber, I collaborated briefly with
[Joshua Shinavier](https://github.com/joshsh) on
[Dragon](https://www.youtube.com/watch?v=W3rpPnhw-nM), a schema integration tool
based on Algebraic Property Graphs. This was a very interesting project to me,
because it was the only (to my knowledge) project at Uber that used Haskell.

Joshua had written the Dragon's core in Haskell and wanted to expose its
functionality to Java without having to go through the hassle of creating an RPC
service or something similar. Since I was not familiar with Property Graphs, I
thought that I could at least help with this problem.

My proposal was to:

- Compile Haskell into a shared library that exposed C-compatible symbols via
  [Haskell's FFI](https://www.haskell.org/definition/ffi/sec-entry.html).
- Use Java's
  [JNI](https://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/intro.html)
  to wrap the C functions into Java-callable native functions.
- Write an idiomatic Java façade that eventually calls into the JNI-exposed
  functions.

In principle, the idea was rather simple and almost obvious; but in practice, it
turned out to be a pain to get it all working, especially on macOS. I think we
got it working on Linux, but we also needed macOS support because other Uber
devs had to be able to run the project locally. I can't really recall what sort
of issue we encountered, but we just couldn't make it work after days of trying.

Today I remembered that experience and wondered whether the state of things had
improved. For example, I was aware of [JEP 454](https://openjdk.org/jeps/454)[^1]
that introduced a much better alternative to JNI. After a few minutes of
searching and a bit of trial-and-error, I got a small demo working. I didn't
struggle at all this time, and the final result (code and steps) were pretty
neat and simple.

I uploaded the demo to
[garciat/haskell-from-java](https://github.com/Garciat/haskell-from-java), in
case I or anyone ever needs a basic starting point to call Haskell from Java.

[^1]: I like to check on the [JEP Index](https://openjdk.org/jeps/0) a few times
    a year to catch up on Java's developments.
