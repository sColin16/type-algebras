import { Record, Set } from "immutable";
import { NodeType } from "./common";

export type TreeType = LNode | ANode | BNode | UnionNode | MuNode | VarNode;

export type RecBody = LNode | ANode | BNode | UnionNodeRec | MuNode;

type LNodeBody = { type: NodeType.L; num: number };
type ANodeBody = { type: NodeType.A; child: TreeType };
type BNodeBody = { type: NodeType.B; childA: TreeType; childB: TreeType };
export type UnionNodeBody = { type: NodeType.Union; children: Set<UnionChild> };
type UnionNodeRecBody = {
  type: NodeType.Union;
  children: Set<UnionChildRec>;
};
type MuNodeBody = { type: NodeType.Mu; child: RecBody };
type VarNodeBody = { type: NodeType.Var; num: number };

export type LNode2 = Map<keyof LNodeBody, LNodeBody[keyof LNodeBody]>

export type LNode = Record<LNodeBody>;
export type ANode = Record<ANodeBody>;
export type BNode = Record<BNodeBody>;
export type UnionNode = Record<UnionNodeBody>;
export type UnionNodeRec = Record<UnionNodeRecBody>;
export type MuNode = Record<MuNodeBody>;
export type VarNode = Record<VarNodeBody>;

export type UnionChild = LNode | ANode | BNode | MuNode | VarNode;
export type UnionChildRec = LNode | ANode | BNode | MuNode;

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
const unionRecRecord = Record<UnionNodeRecBody>({
  type: NodeType.Union,
  children: Set(),
});
const muRecord = Record<MuNodeBody>({ type: NodeType.Mu, child: lRecord() });
const varRecord = Record<VarNodeBody>({ type: NodeType.Var, num: 0 });

export const l = (num: number) =>
  lRecord({
    num,
  });

export const a = (child: TreeType): ANode => aRecord({ child });
export const b = (childA: TreeType, childB: TreeType): BNode =>
  bRecord({ childA, childB });
export const union = (children: Set<UnionChild>): UnionNode =>
  unionRecord({ children });
export const unionRec = (children: Set<UnionChildRec>): UnionNodeRec =>
  unionRecRecord({ children });
export const mu = (child: RecBody): MuNode => muRecord({ child });
export const Var = (num: number): VarNode => varRecord({ num });

export const buildMap = <Arg>(
  varMap: (varNum: number, depth: number, arg: Arg) => VarNode | MuNode,
  argMap: (arg: Arg) => Arg
) => {
  const mapL = (t: LNodeBody, depth: number, arg: Arg): LNode => l(t.num);
  const mapA = (t: ANodeBody, depth: number, arg: Arg): ANode =>
    a(mapTreeType(t.child, depth, arg));
  const mapB = (t: BNodeBody, depth: number, arg: Arg): BNode =>
    b(mapTreeType(t.childA, depth, arg), mapTreeType(t.childB, depth, arg));
  const mapUnion = (t: UnionNodeBody, depth: number, arg: Arg): UnionNode =>
    union(Set(t.children.map((child) => mapUnionChild(child, depth, arg))));
  const mapUnionRec = (
    t: UnionNodeRecBody,
    depth: number,
    arg: Arg
  ): UnionNodeRec =>
    unionRec(
      Set(t.children.map((child) => mapUnionChildRec(child, depth, arg)))
    );
  const mapMu = (t: MuNodeBody, depth: number, arg: Arg): MuNode =>
    mu(mapRecBody(t.child, depth + 1, argMap(arg)));
  const mapVar = (t: VarNodeBody, depth: number, arg: Arg): VarNode | MuNode =>
    varMap(t.num, depth, arg);

  const mapTreeType = (t: TreeType, depth: number, arg: Arg): TreeType => {
    const tJson = t.toJSON();

    switch (tJson.type) {
      case NodeType.L:
        return mapL(tJson, depth, arg);
      case NodeType.A:
        return mapA(tJson, depth, arg);
      case NodeType.B:
        return mapB(tJson, depth, arg);
      case NodeType.Union:
        return mapUnion(tJson, depth, arg);
      case NodeType.Mu:
        return mapMu(tJson, depth, arg);
      case NodeType.Var:
        return mapVar(tJson, depth, arg);
    }
  };

  const mapRecBody = (t: RecBody, depth: number, arg: Arg): RecBody => {
    const tJson = t.toJSON();

    switch (tJson.type) {
      case NodeType.L:
        return mapL(tJson, depth, arg);
      case NodeType.A:
        return mapA(tJson, depth, arg);
      case NodeType.B:
        return mapB(tJson, depth, arg);
      case NodeType.Union:
        return mapUnionRec(tJson, depth, arg);
      case NodeType.Mu:
        return mapMu(tJson, depth, arg);
    }
  };

  const mapUnionChild = (
    t: UnionChild,
    depth: number,
    arg: Arg
  ): UnionChild => {
    const tJson = t.toJSON();

    switch (tJson.type) {
      case NodeType.L:
        return mapL(tJson, depth, arg);
      case NodeType.A:
        return mapA(tJson, depth, arg);
      case NodeType.B:
        return mapB(tJson, depth, arg);
      case NodeType.Mu:
        return mapMu(tJson, depth, arg);
      case NodeType.Var:
        return mapVar(tJson, depth, arg);
    }
  };

  const mapUnionChildRec = (
    t: UnionChildRec,
    depth: number,
    arg: Arg
  ): UnionChildRec => {
    const tJson = t.toJSON();

    switch (tJson.type) {
      case NodeType.L:
        return mapL(tJson, depth, arg);
      case NodeType.A:
        return mapA(tJson, depth, arg);
      case NodeType.B:
        return mapB(tJson, depth, arg);
      case NodeType.Mu:
        return mapMu(tJson, depth, arg);
    }
  };

  return {
    l: (t: LNodeBody, arg: Arg) => mapL(t, 0, arg),
    a: (t: ANodeBody, arg: Arg) => mapA(t, 0, arg),
    b: (t: BNodeBody, arg: Arg) => mapB(t, 0, arg),
    union: (t: UnionNodeBody, arg: Arg) => mapUnion(t, 0, arg),
    unionRec: (t: UnionNodeRecBody, arg: Arg) => mapUnionRec(t, 0, arg),
    mu: (t: MuNodeBody, arg: Arg) => mapMu(t, 0, arg),
    var: (t: VarNodeBody, arg: Arg) => mapVar(t, 0, arg),
    treeType: (t: TreeType, arg: Arg) => mapTreeType(t, 0, arg),
    recBody: (t: RecBody, arg: Arg) => mapRecBody(t, 0, arg),
    unionChild: (t: UnionChild, arg: Arg) => mapUnionChild(t, 0, arg),
    unionChildRec: (t: UnionChildRec, arg: Arg) => mapUnionChildRec(t, 0, arg),
  };
};

export const shift = buildMap(
  (varNum: number, cutoff: number, amount: number) =>
    varNum >= cutoff ? Var(varNum + amount) : Var(varNum),
  (amount: number) => amount
);

export const shiftUp = {
  l: (t: LNodeBody) => shift.l(t, 1),
  a: (t: ANodeBody) => shift.a(t, 1),
  b: (t: BNodeBody) => shift.b(t, 1),
  union: (t: UnionNodeBody) => shift.union(t, 1),
  unionRec: (t: UnionNodeRecBody) => shift.unionRec(t, 1),
  mu: (t: MuNodeBody) => shift.mu(t, 1),
  Var: (t: VarNodeBody) => shift.var(t, 1),
  treeType: (t: TreeType) => shift.treeType(t, 1),
  recBody: (t: RecBody) => shift.recBody(t, 1),
  unionChild: (t: UnionChild) => shift.unionChild(t, 1),
  unionChildRec: (t: UnionChildRec) => shift.unionChildRec(t, 1),
};

export const shiftDown = {
  l: (t: LNodeBody) => shift.l(t, -1),
  a: (t: ANodeBody) => shift.a(t, -1),
  b: (t: BNodeBody) => shift.b(t, -1),
  union: (t: UnionNodeBody) => shift.union(t, -1),
  unionRec: (t: UnionNodeRecBody) => shift.unionRec(t, -1),
  mu: (t: MuNodeBody) => shift.mu(t, -1),
  Var: (t: VarNodeBody) => shift.var(t, -1),
  treeType: (t: TreeType) => shift.treeType(t, -1),
  recBody: (t: RecBody) => shift.recBody(t, -1),
  unionChild: (t: UnionChild) => shift.unionChild(t, -1),
  unionChildRec: (t: UnionChildRec) => shift.unionChildRec(t, -1),
};

export const substitute = buildMap(
  (varNum: number, depth: number, withType: MuNode) =>
    varNum === depth ? withType : Var(varNum),
  (withType: MuNode) => shiftUp.mu(withType.toJSON())
);

// TODO: consider accept the MuNode body instead
export const unfold = (t: MuNode) => {
  const tJson = t.toJSON();

  return shiftDown.recBody(substitute.recBody(tJson.child, shiftUp.mu(tJson)));
};

