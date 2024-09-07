/**
 * Intermediate form of normalization where union and intersection are n-ary instead
 * of binary, with no other normalization in effect
 *
 * This approach lets us bubble bottom types while handling bottom types
 * in these n-ary operations, rather than having to do the logic twice
 *
 * It also means we can have multiple passes of normalization, which I think
 * may be necessary for recursive types and variable references
 */

import * as External from "./external";
import { NodeType } from "./common";

export type TreeType =
  | BottomNode
  | TopNode
  | LNode
  | ANode
  | BNode
  | UnionNode
  | InterNode;

// We retain bottom/top node to filter it out in another form
export type UnionChild =
  | BottomNode
  | TopNode
  | LNode
  | ANode
  | BNode
  | InterNode;

export type InterChild =
  | BottomNode
  | TopNode
  | LNode
  | ANode
  | BNode
  | UnionNode;

export type BottomNode = { type: NodeType.Bottom };
export type TopNode = { type: NodeType.Top };
export type LNode = { type: NodeType.L; num: number };
export type ANode = { type: NodeType.A; child: TreeType };

export type BNode = {
  type: NodeType.B;
  childA: TreeType;
  childB: TreeType;
};

// I am using Array over set here to decouple from full internal form
export type UnionNode = {
  type: NodeType.Union;

  /** Invariant: Guaranteed to have at least one element */
  children: Array<UnionChild>;
};

export type InterNode = {
  type: NodeType.Inter;

  /** Invariant: Guarnateed to have at least one element */
  children: Array<InterChild>
};

export const bottom = (): BottomNode => ({ type: NodeType.Bottom });
export const top = (): TopNode => ({ type: NodeType.Top });
export const l = (num: number): LNode => ({ type: NodeType.L, num });
export const a = (child: TreeType): ANode => ({ type: NodeType.A, child });

export const b = (childA: TreeType, childB: TreeType): BNode => ({
  type: NodeType.B,
  childA,
  childB,
});

export const union = (children: Array<UnionChild>): UnionNode => {
  // Having only a single element is handled in the next phase
  if (children.length === 0) {
    throw Error("n-ary form union must be non-empty");
  }

  return {
    type: NodeType.Union,
    children,
  };
};

export const inter = (children: Array<InterChild>): InterNode => {
  // Having only a single element is handled in the next phase
  if (children.length === 0) {
    throw Error("n-ary form union must be non-empty");
  }

  return {
    type: NodeType.Inter,
    children,
  };
};

export const convert = (t: External.TreeType) => {
  switch (t.type) {
    case NodeType.Bottom:
      return convertBottom(t);
    case NodeType.Top:
      return convertTop(t);
    case NodeType.L:
      return convertL(t);
    case NodeType.A:
      return convertA(t);
    case NodeType.B:
      return convertB(t);
    case NodeType.Union:
      return convertUnion(t);
    case NodeType.Inter:
      return convertInter(t);
  }
};

export const convertBottom = (t: External.BottomNode): BottomNode => bottom();
export const convertTop = (t: External.TopNode): TopNode => top();
export const convertL = (t: External.LNode): LNode => l(t.num);
export const convertA = (t: External.ANode): ANode => a(convert(t.child));

export const convertB = (t: External.BNode): BNode =>
  b(convert(t.childA), convert(t.childB));

export const convertUnion = (t: External.UnionNode): UnionNode =>
  union(flattenUnion(convert(t.childA), convert(t.childB)));

export const convertInter = (t: External.InterNode): InterNode =>
  inter(flattenInter(convert(t.childA), convert(t.childB)));

const flattenUnion = (childA: TreeType, childB: TreeType) => {
  const [childAUnion, childBUnion] = [
    flattenUnionBranch(childA),
    flattenUnionBranch(childB),
  ];

  return childAUnion.concat(childBUnion);
};

const flattenInter = (childA: TreeType, childB: TreeType) => {
  const [childAInter, childBInter] = [
    flattenInterBranch(childA),
    flattenInterBranch(childB),
  ];

  return childAInter.concat(childBInter);
};

const flattenUnionBranch = (branch: TreeType) => {
  if (branch.type === NodeType.Union) {
    return branch.children;
  }

  return [branch];
};

const flattenInterBranch = (branch: TreeType) => {
  if (branch.type === NodeType.Inter) {
    return branch.children;
  }

  return [branch];
};
