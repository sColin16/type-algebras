import { NodeType } from "./common";
import * as Internal from "./internal";
import { Set } from "immutable";

/** Flattens a set of nodes along intersections to remove intersection nodes */
export const flattenInter = <T extends Internal.TreeType>(t: Set<T>) =>
  t.flatMap(flattenInterElt);

/** Flattens a set of nodes along unions to remove union nodes */
export const flattenUnion = <T extends Internal.TreeType>(t: Set<T>) =>
  t.flatMap(flattenUnionElt)

const flattenInterElt = <T extends Internal.TreeType>(
  t: T
): Set<Internal.InterChild | Exclude<T, Internal.InterNode>> => {
  const tJson = t.toJSON();

  if (tJson.type === NodeType.Inter) {
    return tJson.children;
  }

  return Set.of(t as Exclude<T, Internal.InterNode>);
};

const flattenUnionElt = <T extends Internal.TreeType>(
  t: T
): Set<Internal.UnionChild | Exclude<T, Internal.UnionNode>> => {
  const tJson = t.toJSON()

  if (tJson.type === NodeType.Union) {
    return tJson.children
  }

  return Set.of(t as Exclude<T, Internal.UnionNode>)
}
