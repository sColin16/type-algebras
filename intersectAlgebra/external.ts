import { NodeType } from "./common";

export type TreeType =
  | BottomNode
  | TopNode
  | LNode
  | ANode
  | BNode
  | UnionNode
  | InterNode;

// I'm on the fence whether I should apply this constraint to the external types,
// of to just handle it via internalization and computation of bottom type expressions
export type TreeChild = TopNode | LNode | ANode | BNode | UnionNode | InterNode;

export type BottomNode = { type: NodeType.Bottom };
export type TopNode = { type: NodeType.Top };
export type LNode = { type: NodeType.L; num: number };
export type ANode = { type: NodeType.A; child: TreeType };
export type BNode = { type: NodeType.B; childA: TreeType; childB: TreeType };
export type UnionNode = {
  type: NodeType.Union;
  childA: TreeType;
  childB: TreeType;
};
export type InterNode = {
  type: NodeType.Inter;
  childA: TreeType;
  childB: TreeType;
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
export const union = (childA: TreeType, childB: TreeType): UnionNode => ({
  type: NodeType.Union,
  childA,
  childB,
});
export const inter = (childA: TreeType, childB: TreeType): InterNode => ({
  type: NodeType.Inter,
  childA,
  childB,
});
