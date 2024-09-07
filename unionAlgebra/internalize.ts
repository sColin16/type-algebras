import * as Internal from "./internal";
import * as External from "./external";
import { NodeType } from "./common";
import { Set } from "immutable";

export const internalize = (t: External.TreeType): Internal.TreeType => {
  switch (t.type) {
    case NodeType.L:
      return internalizeL(t)
    case NodeType.A:
      return internalizeA(t)
    case NodeType.B:
      return internalizeB(t)
    case NodeType.Union:
      return internalizeUnion(t)
    case NodeType.Mu:
      return internalizeMu(t)
    case NodeType.Var:
      return internalizeVar(t)
  }
}

const internalizeRec = (t: External.RecBody): Internal.RecBody => {
  switch (t.type) {
    case NodeType.L:
      return internalizeL(t)
    case NodeType.A:
      return internalizeA(t)
    case NodeType.B:
      return internalizeB(t)
    case NodeType.Union:
      return internalizeUnionRec(t)
    case NodeType.Mu:
      return internalizeMu(t)
  }
}

const internalizeL = (t: External.LNode): Internal.LNode => Internal.l(t.num);

const internalizeA = (t: External.ANode): Internal.ANode =>
  Internal.a(internalize(t.child));

const internalizeB = (t: External.BNode): Internal.BNode =>
  Internal.b(internalize(t.childA), internalize(t.childB));

const internalizeUnion = (t: External.UnionNode): Internal.UnionNode => {
  const [internalA, internalB] = [internalize(t.childA), internalize(t.childB)];
  const children = extractUnion(internalA).union(extractUnion(internalB));

  return Internal.union(children);
};

const internalizeUnionRec = (
  t: External.UnionNodeRec
): Internal.UnionNodeRec => {
  const [internalA, internalB] = [
    internalizeRec(t.childA),
    internalizeRec(t.childB),
  ];
  const children = extractUnionRec(internalA).union(extractUnionRec(internalB));

  return Internal.unionRec(children);
};

export const internalizeMu = (t: External.MuNode): Internal.MuNode =>
  Internal.mu(internalizeRec(t.child));

const internalizeVar = (t: External.VarNode): Internal.VarNode =>
  Internal.Var(t.num);

export const extractUnion = (t: Internal.TreeType) => {
  const tJson = t.toJSON();

  switch (tJson.type) {
    case NodeType.Union:
      return tJson.children;

    default:
      // Type assertion safe because we check for union nodes above
      return Set.of(t as Exclude<Internal.TreeType, Internal.UnionNode>);
  }
};

const extractUnionRec = (t: Internal.RecBody) => {
  const tJson = t.toJSON();

  switch (tJson.type) {
    case NodeType.Union:
      return tJson.children;

    default:
      return Set.of(t as Exclude<Internal.RecBody, Internal.UnionNodeRec>);
  }
};
