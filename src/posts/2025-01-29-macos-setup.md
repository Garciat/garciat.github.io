---
title: "Setting up macOS"
date: 2025-01-29
description: "I describe how I set up my new macOS installation, as a future reminder."
tags:
  - macOS
  - Note to Self
  - Blog
no_toc: true
---

## Background

I recently bought my first MacBook ever. It's a refurbished 13-inch MacBook Air
M1 with 8GB of RAM and 128GB of storage (the base model). The device is in
essentially perfect state, and it cost me only 560 Euros[^1].

As a moderately frugal person, I'm (sort of) proud to say that this is the first
personal computer that I have bought in over 10 years. The last computer that I
(my mom) bought back in 2011 was a somewhat average gaming laptop that served me
very well for about 6 years.

Ever since I got my first job after university, I started relying more and more
on the computers that I got from work. They tend to be very well-specced and,
more importantly, they're free. I eventually just sold my personal computer and
bought a decent tablet for Netflix, online banking, and such. When I was in
between jobs, I would sometimes even write code directly on the tablet with a
Bluetooth mouse and keyboard.

Now I feel that it is time to go back to owning a personal computer. First, it's
the wise thing to do (legally, etc.). But also, I increasingly found it annoying
how companies may end up installing software that would bloat my programming
environment, or how they would set up things in a way that I wouldn't.

## The setup

I like to keep my setup simple and to minimize personalization. Whenever I can,
I'll stick to the defaults. After several years of owning and using computers, I
came to the conclusion that I'm better off
[spending my keystrokes](https://www.hanselman.com/blog/do-they-deserve-the-gift-of-your-keystrokes)
on the things that really matter. I have switched computers several times; I
have had HDDs die on me; I have had my computer hacked and wiped[^2]; I have
switched operating systems; and so on. I do not want to spend my time heavily
customizing something that I'll replace sooner or later.

Here's what I have set up on the MacBook Air:

- System Settings, with:
  - Appearance > Dark
  - Control Center > Sound > Always show in the menu bar
  - iCloud > Saved to iCloud > {Photos, iCloud Drive, iCloud Mail} > Off
- Google Chrome
- [iTerm2](https://iterm2.com/), with:
  - Profiles > Colors > Color Presets > Dark background
  - Profiles > Keys > Key Mappings > Presets > Natural Text Editing
- Xcode Command Line Tools
  - This is pretty large (2GB), but some development tools rely on it.
- [Homebrew](https://brew.sh/), with:
  - git
  - zsh + [ohmyzsh](https://ohmyz.sh/)
  - [Deno](https://deno.com/)
  - Go
  - [GHC](https://www.haskell.org/) (Haskell)[^3]
- Visual Studio Code

As a programming language enthusiast, I expect that I will be installing many
more language toolchains soon enough. And I will have to watch my disk space as
I do so.

For the time being, that's all that I need.

Whenever I install something significant, I should come back and update this
list, for future reference.

[^1]: Big thanks to Elmer from [Elmer Repairs](https://www.elmerrepairs.com/) in
    Amsterdam for letting me sit in his shop for a good half hour as I tried out
    different things to make sure that the device would suit my needs.

[^2]: That's a story for a different time, but at some point I was running my
    own public server on Windows with no access controls. Yikes.

[^3]: The GHC installation takes up a surprising amount disk space -- about
    2.5GB. Considering my limited disk space, I hope that I don't have to
    uninstall it. Worst case, I could use GitHub Codespaces to develop with
    Haskell.
