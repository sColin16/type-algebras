import * as Internal from "./internal";
import * as External from "./external";
import { Set } from "immutable";
import { NodeType, Pair, pair } from "./common";
import { extractUnion, internalize } from "./internalize";
import { buildPartialOrder } from "../partialOrder";

export const isSubtype = (t1: External.TreeType, t2: External.TreeType) =>
  isSubtypeInternal(internalize(t1), internalize(t2));

const isSubtypeInternal = (t1: Internal.TreeType, t2: Internal.TreeType) =>
  isSubtypeRec(t1, t2, Set());

const isSubtypeRec = (
  t1: Internal.TreeType,
  t2: Internal.TreeType,
  hypotheses: Set<Pair<Internal.TreeType>>
): boolean => {
  const [t1Json, t2Json] = [t1.toJSON(), t2.toJSON()];

  switch (t1Json.type) {
    case NodeType.L:
      switch (t2Json.type) {
        case NodeType.L:
          return t1Json.num === t2Json.num;

        case NodeType.A:
        case NodeType.B:
          return false;

        case NodeType.Union:
          return t2Json.children.some((child) =>
            isSubtypeRec(t1, child, hypotheses)
          );

        case NodeType.Mu:
          return isMuSubtype(t1, t2 as Internal.MuNode, hypotheses);

        case NodeType.Var:
          // TODO: Create a specific error of this type
          throw Error("Unbound recursive variable");
      }

    case NodeType.A:
      switch (t2Json.type) {
        case NodeType.A:
          return isSubtypeRec(t1Json.child, t2Json.child, hypotheses);

        case NodeType.L:
        case NodeType.B:
          return false;

        case NodeType.Union:
          const aInternals = extractAInternals(t2);
          return isListSubtype(t1Json.child, aInternals, hypotheses);

        case NodeType.Mu:
          return isMuSubtype(t1, t2 as Internal.MuNode, hypotheses);

        case NodeType.Var:
          throw new Error("Unbound recursive variable");
      }

    case NodeType.B:
      switch (t2Json.type) {
        case NodeType.L:
        case NodeType.A:
          return false;

        case NodeType.B:
          return (
            isSubtypeRec(t1Json.childA, t2Json.childA, hypotheses) &&
            isSubtypeRec(t1Json.childB, t2Json.childB, hypotheses)
          );

        case NodeType.Union:
          const bInternals = extractBInternals(t2);
          return isBSubtype(
            t1Json.childA,
            t1Json.childB,
            bInternals,
            hypotheses
          );

        case NodeType.Mu:
          return isMuSubtype(t1, t2 as Internal.MuNode, hypotheses);

        case NodeType.Var:
          throw new Error("Unbound recursive variable");
      }

    case NodeType.Union:
      return t1Json.children.every((child) =>
        isSubtypeRec(child, t2, hypotheses)
      );

    case NodeType.Mu:
      switch (t2Json.type) {
        case NodeType.L:
        case NodeType.A:
        case NodeType.B:
        case NodeType.Union: {
          if (hypotheses.has(pair(t1, t2))) {
            return true;
          }

          const newHypotheses = hypotheses.add(pair(t1, t2));
          return isSubtypeRec(
            Internal.unfold(t1 as Internal.MuNode) as Internal.TreeType,
            t2,
            newHypotheses
          );
        }

        case NodeType.Mu: {
          if (hypotheses.has(pair(t1, t2))) {
            return true;
          }

          const newHypotheses = hypotheses.add(pair(t1, t2));
          // Internal.RecBody isn't a subtype of Internal.TreeType beacuse Records don't subtype like that
          return isSubtypeRec(
            t1,
            Internal.unfold(t2 as Internal.MuNode) as Internal.TreeType,
            newHypotheses
          );
        }

        case NodeType.Var:
          throw Error("Unbound recursive variable");
      }

    case NodeType.Var:
      throw new Error("Unbound recursive variable");
  }
};

const isMuSubtype = (
  t1: Internal.TreeType,
  t2: Internal.MuNode,
  hypotheses: Set<Pair<Internal.TreeType>>
) => {
  return isSubtypeRec(t1, Internal.unfold(t2) as Internal.TreeType, hypotheses);
};

const extractAInternals = (t: Internal.TreeType): Array<Internal.TreeType> => {
  const tJson = t.toJSON();

  switch (tJson.type) {
    case NodeType.L:
    case NodeType.B:
      return [];
    case NodeType.A:
      return [tJson.child];
    case NodeType.Union:
      return tJson.children.flatMap(extractAInternals).toArray();
    case NodeType.Mu:
      return extractAInternals(
        Internal.unfold(t as Internal.MuNode) as Internal.TreeType
      );
    case NodeType.Var:
      throw Error("Unbound recursive variable");
  }
};

const extractBInternals = (
  t: Internal.TreeType
): Array<[Internal.TreeType, Internal.TreeType]> => {
  const tJson = t.toJSON();

  switch (tJson.type) {
    case NodeType.L:
    case NodeType.A:
      return [];
    case NodeType.B:
      return [[tJson.childA, tJson.childB]];
    case NodeType.Union:
      return tJson.children.flatMap(extractBInternals).toArray();
    case NodeType.Mu:
      return extractBInternals(
        Internal.unfold(t as Internal.MuNode) as Internal.TreeType
      );
    case NodeType.Var:
      throw Error("Unbound recursive variable");
  }
};

const isListSubtype = (
  t: Internal.TreeType,
  list: Array<Internal.TreeType>,
  hypotheses: Set<Pair<Internal.TreeType>>
) => {
  if (list.length === 0) {
    return false;
  }

  return isSubtypeRec(t, listUnion(list), hypotheses);
};

const isBSubtype = (
  t1: Internal.TreeType,
  t2: Internal.TreeType,
  list: Array<[Internal.TreeType, Internal.TreeType]>,
  hypotheses: Set<Pair<Internal.TreeType>>
) => {
  if (list.length === 0) {
    return false;
  }

  const pairCombos = buildPairCombos(list);

  return pairCombos.every(
    ([c1, c2]) =>
      isListSubtype(t1, c1, hypotheses) || isListSubtype(t2, c2, hypotheses)
  );
};

export const listUnion = (
  types: Array<Internal.TreeType>
): Internal.TreeType => {
  if (types.length === 0) {
    throw Error("Attempted to build union from empty list");
  } else if (types.length === 1) {
    return types[0];
  }

  return Internal.union(Set.union(types.map(extractUnion)));
};

const buildPairCombos = (
  pairs: Array<[Internal.TreeType, Internal.TreeType]>
): Array<[Array<Internal.TreeType>, Array<Internal.TreeType>]> => {
  if (pairs.length === 0) {
    return [];
  } else if (pairs.length === 1) {
    const pair = pairs[0];

    return [
      [[pair[0]], []],
      [[], [pair[1]]],
    ];
  }

  const pair = pairs[0];
  const restCombos = buildPairCombos(pairs.slice(1));

  return restCombos.flatMap(([c1, c2]) => [
    [c1.concat(pair[0]), c2],
    [c1, c2.concat(pair[1])],
  ]);
};

export const partialOrder = buildPartialOrder(isSubtype);
