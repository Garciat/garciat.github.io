---
layout:     post
title:      "Tree traversal order"
date:       2017-07-05
redirect_from:
  - /2017/07/05/tree-order/
---

(Referring to [this leetcode problem](https://leetcode.com/problems/binary-tree-postorder-traversal/))

My first solution was, of course, recursive:

```cpp
class Solution {
public:
    vector<int> postorderTraversal(TreeNode* root) {
        vector<int> ans;
        traverse(ans, root);
        return ans;
    }

    void traverse(vector<int>& ans, TreeNode* node) {
        if (!node) return;          // *
        traverse(ans, node->left);  // *
        traverse(ans, node->right); // *
        ans.push_back(node->val);   // *
    }
};
```

However, the problem suggests that the reader try an iterative solution instead.

While doing that, I tried to keep the essential parts (marked with `*`) of the algorithm identical, while only modeling the recursion with a stack:

```cpp
// Pattern: discriminated union
struct Action {
    enum Tag { TRAVERSE, SHOW };

    Tag tag;
    union {
        TreeNode *node;
        int value;
    };

    Action(TreeNode *node)
        : tag{TRAVERSE}, node{node}
    {}

    Action(int value)
        : tag{SHOW}, value{value}
    {}
};

class Solution {
public:
    vector<int> postorderTraversal(TreeNode* root) {
        vector<int> ans;

        stack<Action> actions;
        actions.push(Action{root});

        while (!actions.empty()) {
            auto action = actions.top();
            actions.pop();

            stack<Action> tmp;

            switch (action.tag) {
            case Action::SHOW:
                ans.push_back(action.value);
                break;
            case Action::TRAVERSE:
                auto node = action.node;
                if (!node) continue;           // *
                tmp.push(Action{node->left});  // *
                tmp.push(Action{node->right}); // *
                tmp.push(Action{node->val});   // **
                break;
            }

            while (!tmp.empty())
                actions.push(tmp.top()), tmp.pop();
        }

        return ans;
    }
};
```

Note that I didn't do the following:

```cpp
actions.push(Action{node->left});  // *
actions.push(Action{node->right}); // *
ans.push_back(node->val)           // **
```

The problem with doing that is that it doesn't accurately model our initial recursive form because the `push_back` statement, if placed somewhere else, would not be "deferred" in relation to the traversal steps.

What's also nice about this approach is that, just like in the recursive form, we can trivially do pre-order and in-order traversals:

```cpp
// pre-order
if (!node) continue;               // *
actions.push(Action{node->val});   // **
actions.push(Action{node->left});  // *
actions.push(Action{node->right}); // *

// in-order
if (!node) continue;               // *
actions.push(Action{node->left});  // *
actions.push(Action{node->val});   // **
actions.push(Action{node->right}); // *
```

Contrast that with some community solutions (e.g. [this most voted one](https://discuss.leetcode.com/topic/30632/preorder-inorder-and-postorder-iteratively-summarization)), which completely distort the underlying algorithm.

(Note: from this point on, I'm just playing around.)

Now, if we extract the traversal algorithm into its own function like so:

```cpp
template <typename F>
void traverse(F&& f, TreeNode *node) {
    if (!node) return;      // *
    f(Action{node->left});  // *
    f(Action{node->right}); // *
    f(Action{node->val});   // **
}
```

Then, we can reuse it with either a recursive driver:

```cpp
vector<int> recursively(TreeNode* root) {
    vector<int> ans;
    recursively_driver(ans, Action{root});
    return ans;
}

void recursively_driver(vector<int>& ans, Action action) {
    switch (action.tag) {
    case Action::SHOW:
        ans.push_back(action.value);
        break;
    case Action::TRAVERSE:
        traverse([&ans] (Action a) { recursively_driver(ans, a); }, action.node);
        break;
    }
}
```

or an iterative driver:

```cpp
vector<int> iteratively(TreeNode* root) {
    vector<int> ans;

    stack<Action> actions;
    actions.push(Action{root});

    while (!actions.empty()) {
        auto action = actions.top();
        actions.pop();

        stack<Action> tmp;

        switch (action.tag) {
        case Action::SHOW:
            ans.push_back(action.value);
            break;
        case Action::TRAVERSE:
            traverse([&tmp] (Action a) { tmp.push(a); }, action.node);
            break;
        }

        while (!tmp.empty())
            actions.push(tmp.top()), tmp.pop();
    }

    return ans;
}
```
