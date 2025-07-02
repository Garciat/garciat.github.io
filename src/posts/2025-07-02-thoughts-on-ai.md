---
title: "Thoughts on AI"
date: 2025-07-02
description: "I share my thoughts on the current state of AI coding agents."
tags:
  - AI
  - Thoughts
---

Code is very important because, when it fails, there are consequences in the
real world.

Code fails when it does not do what it is designed, intended, or supposed to do.

Writing code that succeeds is called software engineering. It entails various
aspects like designing, testing, peer reviewing, observability, and so on.

We can trust that a programmer will try their best to write working code. And
while they may not succeed at times, we can trust that they will continue
learning and trying to write working code. Otherwise, they risk being fired and
possibly not hired again. And people who have bills to pay want to stay
employed.

Can we trust AI agents to autonomously write working code?

AI agent providers want their agents to write code that works. But how are
failures penalized? What about critical failures? Does a provider care if their
agent gets fired from a job, when it still works a thousand other jobs? I don't
know. Meanwhile, we pay providers per line of code and not for succeeding.

Ultimately, the consequences of failing code will only be suffered by humans;
implementers and users.

That is why we need a human in the loop to review the AI-generated code.

Who can successfully review code?

Reviewing code is the act of reading and understanding code, then making a
judgment of whether the code is satisfactory (it leads to success) and providing
feedback accordingly.

Knowing how to read and understand code is obviously important for code
reviewing.

I believe that knowing how to write code is also important for code reviewing.

A code reviewer can provide better feedback if they have a sense of what
satisfactory code looks like and are able to articulate it. Even AI agents
benefit from detailed feedback, which helps them narrow their search space and
improve future output.

Also, I am not sure if humans can learn how to read code at a high level while
writing little or zero code. (We are able to understand spoken language while
not being able to produce it; so there's that.)

I worry that the current generation of programmers will become rusty and that
the future generation will not learn enough or well enough.

How do I use AI?

AI helps me write the code that I want to write, faster.

Most times, I know exactly what I want to write and I let the AI try to write it
for me. It often fails and I need to guide it with edits. But overall, I feel
that it does help me write code faster.

Only occasionally, I use the AI as a search engine. When I am "deep in the
coding loop" and I am not exactly sure how to interact with a given API, I let
the AI give me a couple of suggestions. And when that fails, I fall back to
traditional search engines.

What are my hopes for AI?

I want AI to understand when it fails and learn from it. AI fails too often and
it doesn't learn. It makes the same mistakes over and over.

I want AI agents to be actual superhuman programmers. Imagine having a 10x John
Carmack agent programming by your side. Or even a fleet of them, working on all
of your project's tasks in parallel.

I want AI to ask me questions. When I say "build X", the AI should make sure
that it understands what "X" means by rephrasing and saying it back to me, by
expanding on it, by asking me questions about it, and so on. That is, it should
actually think. Otherwise, I have to write a precise and complete specification
upfront. And what you call that? Programming. But in natural language, which is
way worse due to ambiguity.

Overall, I am satisfied with the current state of AI coding and its rate of
improvement. But I don't think AI "gets it" yet.
