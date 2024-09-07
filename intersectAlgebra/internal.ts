import { NodeType } from "./common";
import { Record, Set } from "immutable";

export type TreeType =
  | BottomNode
  | TopNode
  | LNode
  | ANode
  | BNode
  | UnionNode
  | InterNode;

export type UnionChild = LNode | ANode | BNode | InterNode;
export type InterChild = LNode | ANode | BNode | UnionNode;
export type TreeChild = TopNode | LNode | ANode | BNode | UnionNode | InterNode;

/** Represents the primary tree nodes for L/A/B nodes */
export type TreeForm = LNode | ANode | BNode;

export type BottomNode = Record<BottomNodeBody>;
export type TopNode = Record<TopNodeBody>;
export type LNode = Record<LNodeBody>;
export type ANode = Record<ANodeBody>;
export type BNode = Record<BNodeBody>;
export type UnionNode = Record<UnionNodeBody>;
export type InterNode = Record<InterNodeBody>;

export type BottomNodeBody = { type: NodeType.Bottom };
export type TopNodeBody = { type: NodeType.Top };
export type LNodeBody = { type: NodeType.L; num: number };
export type ANodeBody = { type: NodeType.A; child: TreeChild };

export type BNodeBody = {
  type: NodeType.B;
  childA: TreeChild;
  childB: TreeChild;
};

export type UnionNodeBody = {
  type: NodeType.Union;

  /**
   * Invariant: Guaranteed to have at least two (structurally unique) elements.
   * Note that the elements may be algebraically equivalent despite being strucutrally distinct
   */
  children: Set<UnionChild>;
};

export type InterNodeBody = {
  type: NodeType.Inter;

  /**
   * Invariant: Guarnateed to have at least two (structurally unique) elements
   * Note that the elements may be algebraically equivalent depsite being structurally distinct
   */
  children: Set<InterChild>;
};

const bottomRecord = Record<BottomNodeBody>({ type: NodeType.Bottom });
const topRecord = Record<TopNodeBody>({ type: NodeType.Top });
const lRecord = Record<LNodeBody>({ type: NodeType.L, num: 0 });
const aRecord = Record<ANodeBody>({ type: NodeType.A, child: lRecord() });
const bRecord = Record<BNodeBody>({
  type: NodeType.B,
  childA: lRecord(),
  childB: lRecord(),
});
const unionRecord = Record<UnionNodeBody>({
  type: NodeType.Union,
  children: Set(),
});
const interRecord = Record<InterNodeBody>({
  type: NodeType.Inter,
  children: Set(),
});

export const bottom = (): BottomNode => bottomRecord();
export const top = (): TopNode => topRecord();
export const l = (num: number): LNode => lRecord({ num });
export const a = (child: TreeChild): ANode => aRecord({ child });
export const b = (childA: TreeChild, childB: TreeChild): BNode =>
  bRecord({ childA, childB });

export const union = (children: Set<UnionChild>): UnionNode => {
  if (children.size < 2) {
    throw Error("Union requires at least two (structurally unique) children");
  }

  return unionRecord({ children });
};

export const inter = (children: Set<InterChild>): InterNode => {
  if (children.size < 2) {
    throw Error(
      "Intersection requries at least two (structurally unique) children"
    );
  }

  return interRecord({ children });
};
