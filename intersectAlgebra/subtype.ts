import * as Internal from "./internal";
import * as External from "./external";
import * as ListUnion from "./listUnion";
import { internalize } from "./internalize";
import { Pair } from "../unionAlgebra/common";
import { NodeType } from "./common";
import { Set } from "immutable";
import { interToTreeForm, unionToTreeForm } from "./treeForm";
import { buildPartialOrder } from "../partialOrder";

export const isSubtype = (t1: External.TreeType, t2: External.TreeType) =>
  isSubtypeInternal(internalize(t1), internalize(t2));

export const partialOrder = buildPartialOrder(isSubtype);

const isSubtypeInternal = (t1: Internal.TreeType, t2: Internal.TreeType) =>
  isSubtypeRec(t1, t2, Set());

const isSubtypeRec = (
  t1: Internal.TreeType,
  t2: Internal.TreeType,
  hypotheses: Set<Pair<Internal.TreeType>>
): boolean => {
  const [t1Json, t2Json] = [t1.toJSON(), t2.toJSON()];

  switch (t1Json.type) {
    case NodeType.Bottom:
      return true;

    case NodeType.Top:
      switch (t2Json.type) {
        case NodeType.Top:
          return true;

        case NodeType.Bottom:
        case NodeType.L:
        case NodeType.A:
        case NodeType.B:
        case NodeType.Union:
        case NodeType.Inter:
          return false;
      }

    case NodeType.L:
      switch (t2Json.type) {
        case NodeType.Top:
          return true;

        case NodeType.Bottom:
        case NodeType.A:
        case NodeType.B:
          return false;

        case NodeType.L:
          return t1Json.num === t2Json.num;

        case NodeType.Union:
          return t2Json.children.some((child) =>
            isSubtypeRec(t1, child, hypotheses)
          );

        case NodeType.Inter:
          return isInterSubtype(t1, t2 as Internal.InterNode, hypotheses);
      }

    case NodeType.A:
      switch (t2Json.type) {
        case NodeType.Top:
          return true;

        case NodeType.Bottom:
        case NodeType.L:
        case NodeType.B:
          return false;

        case NodeType.A:
          return isSubtypeRec(t1Json.child, t2Json.child, hypotheses);

        case NodeType.Union:
          const aInternals = extractAInternals(t2 as Internal.UnionNode);
          return isSubtypeRec(t1Json.child, aInternals, hypotheses);

        case NodeType.Inter:
          return isInterSubtype(t1, t2 as Internal.InterNode, hypotheses);
      }
    case NodeType.B:
      switch (t2Json.type) {
        case NodeType.Top:
          return true;

        case NodeType.Bottom:
        case NodeType.L:
        case NodeType.A:
          return false;

        case NodeType.B:
          return (
            isSubtypeRec(t1Json.childA, t2Json.childA, hypotheses) &&
            isSubtypeRec(t1Json.childB, t2Json.childB, hypotheses)
          );

        case NodeType.Union:
          const bInternals = extractBInternals(t2 as Internal.UnionNode);

          return isBUnionSubtype(
            t1Json.childA,
            t1Json.childB,
            bInternals,
            hypotheses
          );

        case NodeType.Inter:
          return isInterSubtype(t1, t2 as Internal.InterNode, hypotheses);
      }

    case NodeType.Union:
      return t1Json.children.every((child) =>
        isSubtypeRec(child, t2, hypotheses)
      );

    case NodeType.Inter:
      // Inductive version would need to do loop check here, couldn't use strong normalization
      // This function could return an empty set, and ofUnionChildren will throw an error in that case
      // which we want because this type shouldn't be equivalent to the bottom type, I think...
      // I think even with inductive types, if this was equal to the bottom type, it should have been checked already
      const t1TreeForm = interToTreeForm(t1 as Internal.InterNode);
      const t1UnionForm = ListUnion.ofUnionChildren(t1TreeForm);

      return isSubtypeRec(t1UnionForm, t2, hypotheses);
  }
};

const isInterSubtype = (
  t1: Internal.TreeType,
  t2: Internal.InterNode,
  hypotheses: Set<Pair<Internal.TreeType>>
) => {
  return t2
    .toJSON()
    .children.every((child) => isSubtypeRec(t1, child, hypotheses));
};

const extractAInternals = (t: Internal.UnionNode) => {
  const unionTreeForm = unionToTreeForm(t);
  const aNodes = unionTreeForm.filter(
    (node) => node.toJSON().type === NodeType.A
  ) as Set<Internal.ANode>;
  const aInternals = aNodes.map((node) => node.toJSON().child);

  // aInternal could be empty, and this function accepts that fact
  return ListUnion.ofTreeChildren(aInternals);
};

const extractBInternals = (t: Internal.UnionNode) => {
  const unionTreeForm = unionToTreeForm(t);
  const bNodes = unionTreeForm.filter(
    (node) => node.toJSON().type === NodeType.B
  ) as Set<Internal.BNode>;
  const bInternals = bNodes.map(
    (node) => [node.toJSON().childA, node.toJSON().childB] as const
  );

  return bInternals;
};

// TODO: should I use pairs for the bInternals? I don't need to because I don't need to use them for loop detection
const isBUnionSubtype = (
  childA: Internal.TreeChild,
  childB: Internal.TreeChild,
  bInternals: Set<readonly [Internal.TreeChild, Internal.TreeChild]>,
  hypotheses: Set<Pair<Internal.TreeType>>
) => {
  if (bInternals.size === 0) {
    return false;
  }

  const pairCombos = buildPairCombos(bInternals);

  return pairCombos.every(
    ([c1, c2]) =>
      isSubtypeRec(childA, ListUnion.ofTreeChildren(c1), hypotheses) ||
      isSubtypeRec(childB, ListUnion.ofTreeChildren(c2), hypotheses)
  );
};

const buildPairCombos = (
  pairs: Set<readonly [Internal.TreeChild, Internal.TreeChild]>
): Set<[Set<Internal.TreeChild>, Set<Internal.TreeChild>]> => {
  if (pairs.size === 0) {
    // TODO: throw an exception here instead?
    return Set();
  } else if (pairs.size === 1) {
    const pair = pairs.first()!;

    return Set.of([Set.of(pair[0]), Set()], [Set(), Set.of(pair[1])]);
  }

  const pair = pairs.first()!;
  const restCombos = buildPairCombos(pairs.slice(1));

  return restCombos.flatMap(([c1, c2]) => [
    [c1.add(pair[0]), c2],
    [c1, c2.add(pair[1])],
  ]);
};
