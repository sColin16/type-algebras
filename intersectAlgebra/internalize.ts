import * as External from "./external";
import * as Internal from "./internal";
import * as NAryForm from "./naryForm";
import { NodeType } from "./common";
import { Set } from "immutable";
import * as ListUnion from "./listUnion";
import * as ListInter from "./listInter";

export const internalize = (t: External.TreeType): Internal.TreeType =>
  internalizeNAry(NAryForm.convert(t))

export const internalizeNAry = (t: NAryForm.TreeType): Internal.TreeType => {
  switch (t.type) {
    case NodeType.Bottom:
      return internalizeBottom(t);
    case NodeType.Top:
      return internalizeTop(t);
    case NodeType.L:
      return internalizeL(t);
    case NodeType.A:
      return internalizeA(t);
    case NodeType.B:
      return internalizeB(t);
    case NodeType.Union:
      return internalizeUnion(t);
    case NodeType.Inter:
      return internalizeInter(t);
  }
};

const internalizeBottom = (t: NAryForm.BottomNode): Internal.BottomNode =>
  Internal.bottom();

const internalizeTop = (t: NAryForm.TopNode): Internal.TopNode =>
  Internal.top();

const internalizeL = (t: NAryForm.LNode): Internal.LNode => Internal.l(t.num);

const internalizeA = (
  t: NAryForm.ANode
): Internal.ANode | Internal.BottomNode => {
  const childInternal = internalizeNAry(t.child);

  if (childInternal.toJSON().type === NodeType.Bottom) {
    return Internal.bottom();
  }

  return Internal.a(
    childInternal as Exclude<Internal.TreeType, Internal.BottomNode>
  );
};

const internalizeB = (
  t: NAryForm.BNode
): Internal.BNode | Internal.BottomNode => {
  const [childAInternal, childBInternal] = [
    internalizeNAry(t.childA),
    internalizeNAry(t.childB),
  ];

  if (
    childAInternal.toJSON().type === NodeType.Bottom ||
    childBInternal.toJSON().type === NodeType.Bottom
  ) {
    return Internal.bottom();
  }

  return Internal.b(
    childAInternal as Exclude<Internal.TreeType, Internal.BottomNode>,
    childBInternal as Exclude<Internal.TreeType, Internal.BottomNode>
  );
};

const internalizeUnion = (t: NAryForm.UnionNode): Internal.TreeType => {
  const childrenSet = Set(t.children);

  // We don't use special internalizeUnionChild because that would return full TreeType
  // with nested union coming from intersection normalization
  const internalChildren = childrenSet.map((child) => internalizeNAry(child));

  return ListUnion.ofTrees(internalChildren);
};

const internalizeInter = (t: NAryForm.InterNode): Internal.TreeType => {
  const childrenSet = Set(t.children);

  const internalChildren = childrenSet.map((child) => internalizeNAry(child));

  return ListInter.ofTrees(internalChildren);
};
