---
title: "16+ years of gists"
date: 2026-01-25
description: "Looking back at 16 years of GitHub gists."
no_toc: true
tags:
  - Gist
  - Thoughts
---

## 2007

### [San Andreas Multiplayer Scripts](https://sampforum.blast.hk/showthread.php?tid=20596)

I almost forgot about this! I used to play a mod for GTA: San Andreas that
enabled multiplayer. And you could use
[the Pawn scripting language](https://www.compuphase.com/pawn/pawn.htm) to write
server scripts for the game.

I am pretty sure this was the first non-web programming I ever did. At the time,
I had started programming only a couple of years earlier, exclusively for the
web with PHP and _some_ JavaScript.

## 2010

### [codeigniter-mongodb](https://github.com/Garciat/codeigniter-mongodb)

This is not actually a gist, but I'm including it because it exemplifies my
early commitment to PHP. This is a library that I wrote for an early version of
CodeIgniter, an application framework for PHP.

Based on
[this line](https://github.com/Garciat/codeigniter-mongodb/blob/master/config/mongo_db.php#L8),
I think this library was intended for use on
[OnePage](https://joel.is/why-i-crave-mistakes/), my first ever coding
collaboration with another person ([Buffer](https://buffer.com/)'s Joel
Gascoigne).

### [imgur_upload.py](https://gist.github.com/Garciat/757429)

A short Python 2 script that uploads image files to Imgur. Apparently, I put
some effort to make it cross-platform.

The gist also contains a `.desktop` file for easy drag-and-drop invocation from
a desktop UI on Linux.

At this point in time, I had been programming for about 4-5 years, most of which
were spent building web apps with PHP. So I am a bit surprised that I used
Python for this. I thought that I had learned Python a bit later.

## 2011

This was a gap year for me, before starting university.

This was also the year when I realized that PHP was not an end-game language,
and so I started learning a bunch of languages at once: C, C++, C#, D, Go,
Haskell, Java, Python (more of it).

I wasn't planning on learning D, but I was lucky enough to stumble upon Andrei
Alexandrescu's "The D Programming Language" in a secluded section of a random
bookstore in São Paulo. Looking back, this makes no sense at all. But it
happened so. And I'm very glad it did, because it introduced me to a) Andrei's
entertaining writing style, and b) that language design can be approachable and
fun.

### [youtube_subs.py](https://gist.github.com/Garciat/798870)

Another Python 2 script that appears to transform an RSS feed of YouTube
subscription videos. I can't remember why I needed this.

I see the use of the `BeautifulSoup` library, which at some point had become a
staple in my web scraping scripts. I found myself doing that frequently, and
this library was very handy.

It's also funny that I thought that I needed to use `global` to read global
variables. AFAIK, that's only needed for writing. Maybe I was trying to be
explicit about what's local and what's global?

### [js-flash-audio-input](https://github.com/Garciat/js-flash-audio-input)

Also not a gist, but it could have been. This seems to be a proof of concept on
how to access the microphone from JavaScript before the
[Media Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API)
became available a couple of years later.

Audio samples are captured by a Flash (ActionScript) component and fed into
JavaScript via a callback. The demo then stores these samples to create a WAV
file in memory and expose it to the user via a
[Data URL](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data)
for playback in an Audio element.

### [minify.py](https://gist.github.com/Garciat/1077310)

Yet another Python 2 script/utility. This one reads a URL from the clipboard,
minifies it, and writes that back to the clipboard. I also tried to make it
cross-platform.

I remember URL minification being a big deal around this time, I'm not sure why.
I think Twitter back then wouldn't do that automatically? I also remember
Google's URL minifier coming in as a new player in ths URL minification space,
so I think I was just eager to implement a tool with it.

The code looks somewhat neat overall. It's very imperative, too.

### [kag-map-renderer](https://github.com/Garciat/kag-map-renderer)

A Python script that renders [King Arthur's Gold](https://kag2d.com/en/) maps.

I think this was one of my earliest ventures into graphics, so the code is very
messy. But it did a decent job.

This eventually led to a collaboration with the game's creator, Michał
Marcinkowski, to build a new website for the game.

## 2012

This year I started university.

For whatever reason, I barely used GitHub and gists during this period. So a lot
the code that I have saved from this period lives on my Google Drive.

In particular, I wrote a lot of C++, because that's what my university's
curriculum was based on. Because I was already familiar with the language, I
used the spare time and energy going deeper into it. I got into template
metaprogramming, decompiling _a la_ Godbolt before that became a thing, poking
at RTTI and vtable internals, and so on.

### [cinecenter.py](https://gist.github.com/Garciat/4115134)

This Python 2 script scraped the movie listings of my local cinema at the time.

I can see the usualy combination of `urllib2` and `BeautifulSoup` (version 4,
this time). I also see that I structured the code in a class this time. Maybe I
was getting into OOP. Though this is a very poor use of classes.

### [Pixelated](https://gbrlgrct.com/games/pixelated/) ([source](https://github.com/Garciat/pixelated))

This is a clone of a [Blackberry game](https://ebscer.com/pixelated/) by the
same name. I remember playing this game on a friend's phone during a road trip.
When we arrived at our location, I just had to pull out my laptop and code up
the game.

## 2013

### [static_iterator.cpp](https://gist.github.com/Garciat/5017857)

More C++ template metaprogramming shenanigans. This time, it seems that I was
trying to emulate statically-defined loops. For example, the 32-bit constant
`0xDEADBEEF` would need 32 iterations to be turned into a
`std::array<bool, 32>`.

### [screenshot.py](https://gist.github.com/Garciat/5023987)

A Python 2 script that takes a screenshot and uploads it to Imgur.

### [leonardo_numbers.cpp](https://gist.github.com/Garciat/5042828)

Computes (Leonardo numbers)[https://en.wikipedia.org/wiki/Leonardo_number] at
compile time via C++ templates.

I remember having watched some
[Channel 9](https://en.wikipedia.org/wiki/Channel_9_(Microsoft)) videos by none
other than [Stephan T. Lavavej](https://nuwen.net/stl.html) about template
metaprogramming. I then reached out to him to ask some questions. He was kind
enough to explain some concepts and techniques to me.

### [closure_list.js](https://gist.github.com/Garciat/5261758/revisions)

This appears to implement a list data structure in JavaScript using `eval` and
dynamically-constructed variable names. The first element is stored in `v`, the
second in `vv`, and so on. This is very weird! Maybe I was trying to understand
closures and lexical scopes?

### [ruby_n_times.d](https://gist.github.com/Garciat/5573048)

The first appearance of D! Here I was trying to replicates Ruby's
[N.times](https://ruby-doc.org/core-2.5.4/Integer.html#method-i-times) construct
in D using templates and
[UFCS](https://tour.dlang.org/tour/en/gems/uniform-function-call-syntax-ufcs).

I was probably trying to exemplify the expressiveness of D to some peer.

### [variadic_mergesort.cpp](https://drive.google.com/file/d/0BztPxhD3dHdhY2paSUJYS1g1TTA/view?usp=sharing&resourcekey=0-_m2Tz3Yqp5WmO363vNJw7w)

Implements mergesort with C++11 variadic templates.

Judging by the local variable named `meow`, this is probably a continuation of
my exploration of template programming inspired by Stephan.

### [function_traits.cpp](https://gist.github.com/Garciat/5786154)

A C++ experiment that seems to extract RTTI information from each parameter of a
function. Was I trying to undertand the C++ ABI? (Like array-to-pointer decay.)
Or was I preparing to do some runtime inspection of types? I can't remember.

### [simplex.py](https://gist.github.com/Garciat/6632788)

I remember being taught
[the Simplex algorithm](https://en.wikipedia.org/wiki/Simplex_algorithm) in a
linear programming course at university. As the teacher explained it on the
blackboard, I transcribed the steps to Python code. I'm pretty sure it didn't
work out in the end, though!

### [tuple_explode.cpp](https://gist.github.com/Garciat/6657651)

Based on the code comment, this was also inspired by a Channel 9 video. I think
the challenge was to call a function by exploding a `std::tuple` into a
parameter pack.

My comment explains:

> This is the first idea that came to mind after watching the video.
>
> I wouldn't recommend its use, but it is one way of tackling the challenge.

### [devirt.cpp](https://gist.github.com/Garciat/6772412)

I remember this. I was trying to manually implement
[devirtualization](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html#index-fdevirtualize).
Maybe because I had heard about this compiler optimization and was trying to
understand it?

## 2014

### [count_digits.d](https://gist.github.com/Garciat/9611566)

A D experiment that counts the number of decimal digits of a runtime integer by
building the binary search statically.

I vaguely remember this being inspired by one of Alexandrescu's talks.

### [descent.d](https://gist.github.com/Garciat/54e62d7e2a2b851442a8), [descent.hs](https://gist.github.com/Garciat/8f3d344d5d6b48ba0457)

I think around this time I was taking Andrew Ng's course on Machine Learning.

These two programs seem to implement one of the course's descent algorithms in D
and in Haskell, respectively.

### [bk.py](https://gist.github.com/Garciat/9fd0efc25b0f5a68c370)

This is a funny one. Around the time, our local Burger King was running a
campaign that allowed you to win some food vouchers by playing a football
minigame. (2014 was a FIFA World Cup year, so that tracks.) You had to pick one
of five positions to shoot and the goalie may or may not defend your shot. The
minigame was completely luck-based.

Naturally, I wrote a Python script that played the game for you, for a number of
email-password pairs.

### [automata-pila.hs](https://gist.github.com/Garciat/72a3101ce9938d9df342)

A barebones stack automaton implementation in Haskell, for one of our
programming language courses.

I wanted to showcase Haskell's conciseness to my teacher and peers.

### [pushdown.hs](https://gist.github.com/Garciat/62871857a9cb14df1702)

A similar thing but for pushdown automata.

This seems to make an attempt to generalize the concept with a type class and
type families.

### [iterators.py](https://gist.github.com/Garciat/b59e7522b9909d1a21bc), [generators.py](https://gist.github.com/Garciat/a96fa3f031aa834411c2)

I think I was trying to explain Python's iterator and generator protocols to a
peer.

The second script reads much more like a tutorial. This type of writing
eventually became one my core style for explaining things, as demonstrated by
some posts in this blog.

### [roundrobin-kernel.hs](https://gist.github.com/Garciat/8fe009d131a1e747249f)

I do not remember this at all. It looks like a CPU process scheduling simulation
in Haskell. I was probably taking an operating systems course at the time.

It looks pretty involved, though [running it](https://godbolt.org/z/75YEEM4Mz)
doesn't seem to do much. Maybe it is incomplete.

### [google_ascii.py](https://gist.github.com/Garciat/73d411745ee1847446e5)

A Python 3 script that picks a random image from a Google search, downloads it,
and then outputs it as ASCII art. I remember writing this while bored during
class.

## 2015

### [Lambda.hs](https://gist.github.com/Garciat/a594cc6a3bd7f8e24dbb)

Possibly my first lambda calculus evaluator in Haskell. I'm actually surprised
that it happened this late.

### [curry.cpp](https://gist.github.com/Garciat/c7e4bef299ee5c607948)

Implements function currying in C++14. I guess I still had some template
programming itches to itch! I wrote a second version here:
[curry2.cpp](https://gist.github.com/Garciat/5007c7a735840a234f2a).

### [translate_im.py](https://gist.github.com/Garciat/f438d436e6f29b304726), [translate_im.d](https://gist.github.com/Garciat/68cf1a9f0cfe3846fd9e)

A toy script that translates a word from Spanish to Portuguese using Bing's API
and then downloads an random image from Google using that word as a search term.

I remember writing this to help my then-girlfriend learn Portuguese.

I wrote the script in both Python and D. I think I was pleasantly surprised with
D's conciseness compared to Python. Combined with `rdmd` (compile & run), D
proved a good alternative to Python.

### [pptx_image_extractor.html](https://gist.github.com/Garciat/65c163b4e9e9968ca2dc)

A web 'script' that extracts images from a PPTX and saves them to a ZIP file.

I wrote this for my grandfather, who enjoyed sending and receiving PowerPoint
presentations that contained pretty photos accompanied by music and
inspirational quotes. He would manually copy the images to this computer and use
them in his desktop wallpaper randomizer.

### [pixelated-hs](https://github.com/Garciat/pixelated-hs), [pixelated.d](https://gist.github.com/Garciat/557299821af6d314b497), [pixelated.cpp](https://gist.github.com/Garciat/c8317f565975e4774864)

This was an attempt at writing a solver for the game Pixelated. Despite my best
attempt at the time, I think the algorithm had an expontential running time.

### [Program.dnx.il](https://gist.github.com/Garciat/b8b364234d89d8079a4a)

I was early adopter of .NET's new compiler toolchain back then. Before Roslyn
was production-ready, they still relied on Mono for Linux builds. I found some
issue and [reported it](https://github.com/aspnet/dnx/issues/1591).

### [json.hs](https://gist.github.com/Garciat/87bc71709d1537bed7cc)

I suppose this was my first attempt at using parser combinators to parse JSON in
Haskell?

### [fibs.ipynb](https://gist.github.com/Garciat/dcb6c874f6f36a33440c)

Different ways of computing Fibonacci numbers in Haskell.

### [expr.hs](https://gist.github.com/Garciat/e06d71b8c9487dd2a085)

Yet another lambda calculus in Haskell. This time, with a syntax and parser.

### [gene.hs, gene.py](https://gist.github.com/Garciat/1a4f4744eaae23f29843)

A transcription of a genetic algorithm from a thesis print I found in my
university's library. Unfortunately, I could not get it to work.

### [Parser.hs](https://gist.github.com/Garciat/afef2465bf8456521c03)

Possibly one of my first attempts at writing my own parser combinators in
Haskell.

### [data.hs](https://gist.github.com/Garciat/d5f47d2fcfa98830efe9)

An early attempt at understanding Church (or Mogensen-Scott) encodings of data
types in Haskell.

I think this also kickstarted my itch for initial/final encodings.

### [ffi.idr](https://gist.github.com/Garciat/33f1caff0b7c9d9d3220)

A basic demo of using the C FFI in Idris.

Apparently around this time I started playing around with Idris.

### [paks.d, paks.hs](https://gist.github.com/Garciat/69a84718f6765dc8ff7a)

I used to be an avid Arch Linux user. These scripts seem to print installed
packages sorted by installation date?

## 2016

### [emscripten.php](https://gist.github.com/Garciat/0a6c70a6ccf2d5df4e57)

A PHP script that compiles C++ using [emscripten](https://emscripten.org/) and
then runs the output on [Node.js](https://nodejs.org/en). What a weird
combination of technologies! I am not sure what I built this for.

### [miaw.cpp](https://gist.github.com/Garciat/e7fcf0f371673cda57d0)

A C++ interpreter for a basic stack-based language.

I think I was trying to prove to a friend that 'inventing' a language is not
that hard.

### [test300.raw.xz.b64](https://gist.github.com/Garciat/c01d75e88891f66c8565)

> 300 seconds of 440Hz sine signal in raw 32bit IEEE Float format, xz-ipped, in
> base64

What the hell was I doing thinking with this? So weird.

### [async.js](https://gist.github.com/Garciat/9f6559d5146c0be660b9)

I think this tried to emulate `async/await` via generators in JavaScript.

### [ib_codes.json](https://gist.github.com/Garciat/c36070e44fe0e9ff9dce33f21ccf07a3)

Around this time I was working with Interactive Brokers Trader Workstation API.

### [vortex.html](https://gist.github.com/Garciat/4e586d81abd67a7e39f820020487b139)

A colleague of mine liked to draw this sort of spiral pattern on paper. So I
wrote a JS script that draws the same pattern programmatically.

I decided to write it in a very functional style.

### [lambda_delegate](https://gist.github.com/Garciat/06fec39ffb589783f889e234747fd33d)

Implements some
[C++/CLI](https://learn.microsoft.com/en-us/cpp/dotnet/dotnet-programming-with-cpp-cli-visual-cpp?view=msvc-170)
helpers to be able to use C++ lambdas as CLI delegates.

I remember using C++/CLI a lot in 2012 because my university was really into C++
and WinForms. I found it really interesting how they managed to compile C++ for
the CLI. But I have no idea why I was still looking into this in 2016!

### [lazy_primality.cpp](https://gist.github.com/Garciat/fdd4203dd744c28dbb3f897191a31c94)

It is 'lazy' in the sense that it just delegates the primality check to the
`factor` program.

### [leaking.cpp](https://gist.github.com/Garciat/dc79201aa230330d3606f5ff499b5ee4)

A C++ template that purposefully leaks (doesn't call the destructor) of a given
type.

### [simple-any.cpp](https://gist.github.com/Garciat/f356654c944c847eb9d544006c919f97)

Implements a toy version of
[std::any](https://en.cppreference.com/w/cpp/utility/any.html).

### [novice-tuple.cpp](https://gist.github.com/Garciat/cf1d50f2564e5efe7931c343e0e6aa49)

Implements a toy version of
[std::tuple](https://en.cppreference.com/w/cpp/utility/tuple.html).

### [JavaStringMemchr.java](https://gist.github.com/Garciat/745545a62584dd079055d10841c8777c)

Uses C's `memchr` on a Java byte array. I guess I was experimenting with the JNI
for the first time.

## 2017

### [Circle.hs](https://gist.github.com/Garciat/90c40974386462f1c88bba673ccd513b)

I think I had found a cool solution to some Leetcode-style problem. This gist
describes my analysis.

## 2018

### [HM.hs](https://gist.github.com/Garciat/221d38117f7346613fa0acfecd6e8efb)

I think this implements Hindley-Milner style type inference.

### [EventDescriptionValidity.java](https://gist.github.com/Garciat/f5834776685658a183e19828f7a35875)

A demo of using phantom types in Java to hold validation invariants.

### [Snake.hs](https://gist.github.com/Garciat/6fe00349f5c6b3b4c34d5d055eebb029)

Snake game in Haskell.

### [Quad.hs](https://gist.github.com/Garciat/ad044e8828a04b223f57c06f7b45c860)

I think this implements [Quadtree](https://en.wikipedia.org/wiki/Quadtree) for
2D collisions in Haskell?

### [FunctionalParsers.java](https://gist.github.com/Garciat/c334cdef1abef57a33272b8787496b1a)

My first attempt at writing very functional Java, inspired by Haskell.

### [StackExpr.hs](https://gist.github.com/Garciat/b0f060ddf8c5fcd6e4933a739fe57db9)

My first experiment with initial encodings and the interpretation problem in
Haskell.

### [Vect.hs, Vect.java](https://gist.github.com/Garciat/4daca968e29529373c66d3c27bedc863)

Length-indexed vectors in Haskell and Java.

## 2019

### [free_monad.py](https://gist.github.com/Garciat/06cd0091ef59d9670aa106e4103c563f)

An attempt to build a sort of effect system in Python 3 using generators.

### [di.py](https://gist.github.com/Garciat/ad8a3afbb3cef141fcc500ae6ba96bf4)

A basic dependency injection container in Python 3 with type annotations.

## 2020

### [Parser.java](https://gist.github.com/Garciat/5ec68e4989e46e519dcc79662aba7b70)

The first version of the code that eventually became my post on
[Declarative and composable input validation with rich errors in Java](https://garciat.com/posts/java-functional-validation/).

### [ExprCompiler.java](https://gist.github.com/Garciat/14f03720e60caa3a5f85b20987f47044)

Continuing my exploration of initial/final encodings, this time in Java.

### [TypedExpr.java](https://gist.github.com/Garciat/dca3bbf83eda066cfef4a419cd0e3f82)

A similar thing but with typed expressions.

### [free.py](https://gist.github.com/Garciat/1484d16ae455ca791147a1eab0836f9a)

A continuation of the Python algebraic effects idea, which then became
[this blog post](https://garciat.com/posts/python-algebraic-effects-async-await/).

### [Life.hs](https://gist.github.com/Garciat/698579aef7a1d2b2cf98fdea892ce54e)

Conway's Game of Life in Haskell.

### [Parsec.java](https://gist.github.com/Garciat/46059728a0bfd5f78129a947b1577826)

A [Parsec](https://hackage.haskell.org/package/parsec) adaptation to Java.

## 2021

### [MicroWire.java](https://gist.github.com/Garciat/f747fcb5d384ccdabb3ae49107db7fe2)

A toy dependency injection container in Java.

### [ParserClass.hs](https://gist.github.com/Garciat/5ea9d5a66bc5db95f13ddc36e70e7c99)

Further exploration of initial/final encodings in Haskell, applied to parsers.

I wasn't sure what I was really doing, so I started a thread on
[Haskell's Discourse](https://discourse.haskell.org/t/what-is-the-name-of-this-pattern/2473)
and came to learn of those terms.

### [ParserClass.java](https://gist.github.com/Garciat/5391cb757780265d3b8b3865ff97f01c)

I implemented the same thing in Java. This taught me about the higher kinds
encoding for Java and about type equalities.

### [Nat.{cs,java,kt}](https://gist.github.com/Garciat/d9235d76bb6570ac3d26ee5646f42d97)

Length-indexed vectors in C#, Java, and Kotlin.

### [hk.py](https://gist.github.com/Garciat/25947e56812891506c294332076f503d)

Applying the higher kinds encoding to Python 3 with type annotations.

### [Sub.{cs,java}](https://gist.github.com/Garciat/f27148cf8c245bb1550da0b730daa883)

Just like the type equality witness above, this is a subtyping witness.

## 2022

### [Stages.java](https://gist.github.com/Garciat/a641b22aa00c4dfe234d71ff0f403ec6)

An interesting idea about representing the type of each field in a structure
with a unique type parameter. Then, computations can be split into 'stages',
each on which accurately represents the change of structure in each field.

## 2024

### [sql.go](https://gist.github.com/Garciat/16ff6cfcb542f30afe8d5e4424bbb578)

A SQL sort of DSL written in Go, which can be 'compiled' to actual SQL or can be
executed into actual values.

## 2025

### [vscode-tunnel.php](https://gist.github.com/Garciat/48ca4c3394e26642b746f5861faca2d1)

A PHP script that manages the background process for
[VS Code Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels).

### [vscode-tunner.py](https://gist.github.com/Garciat/4112888e649f37d032ed671265781b8c)

The same thing but in Python 3 as a CGI script, also implementing Google
authentication.

### [vscode-tunnel.tsx](https://gist.github.com/Garciat/66dbdb1b7534c63e82560a7d0440bdb8)

The same thing again but in Deno + TypeScript, also as CGI script.

### [refined.java](https://gist.github.com/Garciat/0db4b5abd9981c132e8ef650ffa707bb)

An idea for refinement types in Java.

### [TypeClassSystem.java](https://gist.github.com/Garciat/a6ca3c9195d5b1d997badecd73282e38)

The very first version on my type classes implementation for Java.

This eventually became my post,
[Full Haskell-like Type Class resolution in Java](https://garciat.com/posts/java-type-classes/).

### [rex.c](https://gist.github.com/Garciat/c5f472ea8f7f57b11dbcdacb4a44b29d)

A regular expressions DSL for C, inspired by Haskell's Parsec library. Continued
in [https://github.com/Garciat/parsing.c](https://github.com/Garciat/parsing.c).
