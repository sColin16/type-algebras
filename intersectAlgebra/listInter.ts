import * as Internal from "./internal";
import { Set } from "immutable";
import { NodeType } from "./common";
import { hasIntersectionInterChild } from "./hasIntersection";
import { flattenInter } from "./flatten";

/**
 * Returns the appropriate node based on the intersection of the provided types
 * @throws Error if input set is empty
 */
export const ofTrees = (types: Set<Internal.TreeType>) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create intersection");
  }

  const flattened = flattenInter(types);

  return ofFlatTrees(flattened);
};

const ofFlatTrees = (
  types: Set<Exclude<Internal.TreeType, Internal.InterNode>>
) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create intersection");
  }

  // If the intersection contains a bottom type, it is equivalent to the bottom type
  if (types.has(Internal.bottom())) {
    return Internal.bottom();
  }

  return ofFlatTreeNoBottom(
    types as Set<
      Exclude<Internal.TreeType, Internal.InterNode | Internal.BottomNode>
    >
  );
};

const ofFlatTreeNoBottom = (
  types: Set<
    Exclude<Internal.TreeType, Internal.InterNode | Internal.BottomNode>
  >
) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create intersection");
  }

  const topFiltered = types.filter(
    (type) => type.toJSON().type !== NodeType.Top
  ) as Set<
    Exclude<
      Internal.TreeType,
      Internal.InterNode | Internal.BottomNode | Internal.TopNode
    >
  >;

  if (topFiltered.size === 0) {
    return Internal.top();
  }

  return ofInterChildren(topFiltered);
};

const ofInterChildren = (types: Set<Internal.InterChild>) => {
  if (types.size === 0) {
    throw Error("Types list must be non-empty to create intersection");
  } else if (types.size === 1) {
    return types.first() as Internal.InterChild;
  } else if (hasIntersectionInterChild(types)) {
    return Internal.inter(types);
  }

  return Internal.bottom();
};

/**
 * @throws Error if the input set is empty
 */
export const ofTreeChildren = (nodes: Set<Internal.TreeChild>) => {
  if (nodes.size === 0) {
    throw Error("Cannot build list intersection from empty input set");
  }

  const flattened = flattenInter(nodes);

  // We do check intersections because this intersection could be part of a union
  // whose intersections are not the bottom type
  return ofFlatTreeNoBottom(flattened);
};
