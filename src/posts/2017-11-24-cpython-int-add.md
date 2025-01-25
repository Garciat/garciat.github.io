---
title:        "Adding two integers in CPython"
date:         2017-11-25
description:  "Analyzing the cost of adding to integers in CPython"
---

Ignoring cheap operations (arithmetic, logical, bits) and some not-so-cheap
operations (branching), this is the operational cost of adding two integers in
CPython.

1. 1 (hot) indirect read:
   [read bytecode buffer](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1167).
   ([NEXTOP macro](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L874))

2. 1 jump-table jump:
   [instruction selection](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1199)
   ([BINARY_ADD](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1464)
   in this case).

3. 2 (hot) indirect reads:
   [pop the evaluation stack](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1466-L1467).
   ([POP macro](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L932),
   [TOP macro](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L920))

4. 2 indirect reads:
   [RTTI check for int type](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1468).
   ([PyInt_CheckExact macro](https://github.com/Garciat/cpython/blob/74f49ab28b91d3c23524356230feb2724ee9b23f/Include/intobject.h#L32))

5. 2 indirect reads:
   [extract int value](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1471-L1472).
   ([PyInt_AS_LONG macro](https://github.com/Garciat/cpython/blob/74f49ab28b91d3c23524356230feb2724ee9b23f/Include/intobject.h#L52))

6. 1 unsigned long add:
   [the actual addition](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1475)
   (maybe).

7. 1
   [overflow check](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1476).
   Four paths:

   1. “Fast” path: (cached int object)

      1. 1 range check:
         [determine if value is cached](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L91).

      2. 1 (warm) global read:
         [read the cached object](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L92).

      3. 1 indirect increment:
         [reference count](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L93).

   2. “Slow” path: (not cached; int object 'free list' not full)

      1. 1 global read:
         [use free list](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L108).

      2. 1 global write:
         [advance free list](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L109).

      3. 1 indirect write:
         [set object type](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L110).
         ([PyObject_INIT macro](https://github.com/Garciat/cpython/blob/c83ea137d7e717f764e2f31fc2544f522de7d857/Include/objimpl.h#L163))

      4. 1 indirect write:
         [initialize reference count](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L110).
         ([_Py_NewReference macro](https://github.com/Garciat/cpython/blob/e2eacc02bcc9f8977f5f3cea6243f236c508b772/Include/object.h#L755))

      5. 1 indirect write:
         [set integer value](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L111).

   3. “Slower” path: (not cached; free list full / not allocated)

      1. 1 memory allocation:
         [allocate new PyIntObject free list](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L52).

      2. 1 indirect write:
         [chain new free list to current (full) free list](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L55).

      3. 1 global write:
         [set new free list as current free list](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L56).

      4. 1000 (hot) indirect writes:
         [link PyIntObjects to each other](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L62).

      5. Go to “Slow” path.

   4. “Slowest” path:
      ([addition overflow](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1477))

      1. 2 indirect reads:
         [RTTI check](https://github.com/Garciat/cpython/blob/2a0438d2e4f023b5edf0fcb27151b6ec4357642e/Objects/abstract.c#L929-L931).

      2. 1 double-indirect reads:
         [read number method table](https://github.com/Garciat/cpython/blob/2a0438d2e4f023b5edf0fcb27151b6ec4357642e/Objects/abstract.c#L930).

      3. 1 triple-indirect reads:
         [read addition method from table](https://github.com/Garciat/cpython/blob/2a0438d2e4f023b5edf0fcb27151b6ec4357642e/Objects/abstract.c#L930).
         ([NB_BINOP](https://github.com/Garciat/cpython/blob/2a0438d2e4f023b5edf0fcb27151b6ec4357642e/Objects/abstract.c#L895))

      4. 1 quadruple-indirect call:
         [go to int addition](https://github.com/Garciat/cpython/blob/2a0438d2e4f023b5edf0fcb27151b6ec4357642e/Objects/abstract.c#L945).
         ([int_add](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L469))

      5. 2 indirect reads:
         [RTTI check for int type](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L472-L473).
         ([CONVERT_TO_LONG](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L428))

      6. 2 indirect reads:
         [extract int value](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L472-L473).

      7. 1 unsigned long add:
         [the actual addition](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L475)
         (again).

      8. 1
         [overflow check](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L476)
         (again).

      9. 1 global read:
         [read PyLong_Type number method table](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L478).

      10. 1 indirect read:
          [read long addition method](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L478).

      11. 1 doubly-indirect call:
          [go to long addition](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L478).
          ([long_add](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L2518))

      12. [Convert ints to longs](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L2522):
          ([CONVERT_BINOP macro](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L1174))

          1. 2 indirect reads:
             [RTTI check for int type](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L1154).

          2. 2 indirect reads:
             [extract int value](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L1155)
             (third time).
             ([PyInt_AS_LONG](https://github.com/Garciat/cpython/blob/74f49ab28b91d3c23524356230feb2724ee9b23f/Include/intobject.h#L52))

          3. [Allocate temporary long objects](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L129):
             (in
             [PyLong_FromLong](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L101))

             1. Quite extensive, not going into detail.

      13. 1 object allocation:
          [for addition result](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L2445).

          1. Quite extensive, not going into detail.

      14. 4* indirect reads &amp; writes:
          [arbitrary-precision addition](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L2446-L2458).

      15. 2 indirect decrements:
          [refcount for temporary longs](https://github.com/Garciat/cpython/blob/445844993b68f102241a600636b0d69394db1c7b/Objects/longobject.c#L2539-L2540).
          ([Py_DECREF](https://github.com/Garciat/cpython/blob/e2eacc02bcc9f8977f5f3cea6243f236c508b772/Include/object.h#L771))

      16. 2 indirect function calls: object deallocation.
          ([_Py_Dealloc](https://github.com/Garciat/cpython/blob/e2eacc02bcc9f8977f5f3cea6243f236c508b772/Include/object.h#L762))

          1. [Quite extensive, not going into detail.](https://github.com/Garciat/cpython/blob/1edd2f6241df29eb2ae67c3ad9fa3872670d47e9/Objects/obmalloc.c#L994)

8. 2 indirect decrements:
   [refcount for popped stack values](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1490-L1492).
   ([Py_DECREF](https://github.com/Garciat/cpython/blob/e2eacc02bcc9f8977f5f3cea6243f236c508b772/Include/object.h#L771))

9. (Possible) 2 indirect function calls: object deallocation.
   ([_Py_Dealloc](https://github.com/Garciat/cpython/blob/e2eacc02bcc9f8977f5f3cea6243f236c508b772/Include/object.h#L762))

   1. [(Returns int to free list)](https://github.com/Garciat/cpython/blob/994f04dbf576f4ebafb9de2bc6821e15cb0de0ea/Objects/intobject.c#L132)

10. 1 (hot) indirect write:
    [set top of evaluation stack](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L1493).
    ([SET_TOP macro](https://github.com/Garciat/cpython/blob/05469fa1c05acf55bdca05db21822ecdd7f6487a/Python/ceval.c#L925))
