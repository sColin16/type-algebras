import * as Internal from "./internal";
import { NodeType } from "./common";
import { Set } from "immutable";
import { flattenUnion } from "./flatten";

/**
 * Returns the appropriate node based on the union of the provided types
 * @throws Error if input set is empty
 */
export const ofTrees = (types: Set<Internal.TreeType>) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create union");
  }

  const flattened = flattenUnion(types);

  return ofFlatTrees(flattened);
};

const ofFlatTrees = (
  types: Set<Exclude<Internal.TreeType, Internal.UnionNode>>
) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create union");
  }

  // If the union contains a top types, it is equivalent to the top type
  if (types.has(Internal.top())) {
    return Internal.top();
  }

  return ofFlatListNoTop(
    types as Set<
      Exclude<Internal.TreeType, Internal.UnionNode | Internal.TopNode>
    >
  );
};

const ofFlatListNoTop = (
  types: Set<Exclude<Internal.TreeType, Internal.UnionNode | Internal.TopNode>>
) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create union");
  }

  const bottomFiltered = types.filter(
    (type) => type.toJSON().type !== NodeType.Bottom
  ) as Set<
    Exclude<
      Internal.TreeType,
      Internal.UnionNode | Internal.TopNode | Internal.BottomNode
    >
  >;

  // If filtering out bottom is empty now, it must have only contained the bottom type
  if (bottomFiltered.size === 0) {
    return Internal.bottom();
  }

  return ofUnionChildren(bottomFiltered);
};

export const ofUnionChildren = (types: Set<Internal.UnionChild>) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create union");
  } else if (types.size === 1) {
    return types.first() as Internal.UnionChild;
  }

  // With subtraction, we need to detect top types here

  return Internal.union(types);
};

/**
 * Returns the appropriate node based on the union of the provided types.
 * Does allow the input set to be empty, because this is used in contexts
 * where an empty set indicates the bottom type
 */
export const ofTreeChildren = (
  types: Set<Internal.TreeChild>
) => {
  const flattened = flattenUnion(types)

  // If the union contains a top types, it is equivalent to the top type
  if (flattened.has(Internal.top())) {
    return Internal.top();
  }

  const typesNoTop = flattened as Set<Exclude<Internal.TreeChild, Internal.UnionNode | Internal.TopNode>>

  // We must do the empty check because ofUnionChildren requires that the input set is non-empty
  if (typesNoTop.size === 0) {
    return Internal.bottom()
  }

  return ofUnionChildren(typesNoTop)
}
