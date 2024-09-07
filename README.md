# Type Algebra

This repository contains prototypes of various set-theoretic type algebras.
The goal is to build up to a set-theoretic type algebra for lambda calculus,
to form the basis of a simply-typed lambda calculus with a set-theoretic type system

## Algebras
- Union Algebra: Tree nodes, recursion nodes, and union nodes
- Intersect Algebra: Tree nodes, type nodes, union nodes, and intersection nodes

## Node Types
### Tree Nodes
These nodes describe the underlying trees that the types describe
- L: nullary nodes that can be provided a label to differentiate them
- A: unary nodes that accept a single child node
- B: binary nodes that accept two child nodes

### Type Nodes
- Bottom: Represents a type that is not inhabited by any trees
- Top: Represents a type that is inhabited by all trees

### Recursion Nodes
- Mu: Represents the greatest-fixed point of a "type function" to enable recursive types
- Var: Indicates points of recursion within recursive types

### Set-Theoretic Nodes
- Union: Represents the set-theoretic union of two types
- Inter: Represents the set-theoretic intersection of two types
- Sub: Represents the set-theoretic subtraction of two types
