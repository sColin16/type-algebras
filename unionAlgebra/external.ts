import { NodeType } from "./common";

/** Types and functions meant to be used by end-users */

export type TreeType = LNode | ANode | BNode | UnionNode | MuNode | VarNode;

export type RecBody = LNode | ANode | BNode | UnionNodeRec | MuNode;

export type LNode = { type: NodeType.L; num: number };
export type ANode = { type: NodeType.A; child: TreeType };
export type BNode = { type: NodeType.B; childA: TreeType; childB: TreeType };
export type UnionNode = {
  type: NodeType.Union;
  childA: TreeType;
  childB: TreeType;
};
export type MuNode = { type: NodeType.Mu; child: RecBody };

export type UnionNodeRec = {
  type: NodeType.Union;
  childA: RecBody;
  childB: RecBody;
};

export type VarNode = { type: NodeType.Var; num: number };

export const l = (num: number): LNode => ({
  type: NodeType.L,
  num,
});

export const a = (child: TreeType): ANode => ({
  type: NodeType.A,
  child,
});

export const b = (childA: TreeType, childB: TreeType): BNode => ({
  type: NodeType.B,
  childA,
  childB,
});

export const mu = (child: RecBody): MuNode => ({
  type: NodeType.Mu,
  child,
});

export const Var = (num: number): VarNode => ({
  type: NodeType.Var,
  num,
});

const sharedUnion = <T>(childA: T, childB: T) => ({
  type: NodeType.Union as const,
  childA,
  childB,
});

export const union: (childA: TreeType, childB: TreeType) => UnionNode =
  sharedUnion;
export const unionRec: (childA: RecBody, childB: RecBody) => UnionNodeRec =
  sharedUnion;
