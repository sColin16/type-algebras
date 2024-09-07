import * as Internal from "./internal";
import { NodeType } from "./common";
import { Set } from "immutable";
import { flattenInter } from "./flatten";
import { distributeIntersection } from "./distributeIntersection";

/**
 * Determines if the intersection of the elements of the set are equivalent to the bottom type
 *
 * @throws Error if the input set is empty
 * @throws Error if the intersection of the input set is equivalent to the bottom type
 */
export const hasIntersectionInterChild = (types: Set<Internal.InterChild>) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );

    // We allow a single element because recursive calls unfolding unions could generate
    // sets of size one
  } else if (types.size === 1) {
    return true;
  }

  // With recursive types, we need to use the step-wise function to do loop detection
  const unionOfIntersections = distributeIntersection(types);

  return unionOfIntersections.some(hasIntersectionTree);
};

const hasIntersectionTree = (
  types: Set<Internal.TreeForm>
) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );

    // We allow a single element because we use the output of distributeIntersection
    // which can product unary intersection sets
  } else if (types.size === 1) {
    return true;
  }

  if (types.every((type) => type.toJSON().type === NodeType.L)) {
    return hasIntersectionL(types as Set<Internal.LNode>);
  } else if (types.every((type) => type.toJSON().type === NodeType.A)) {
    return hasIntersectionA(types as Set<Internal.ANode>);
  } else if (types.every((type) => type.toJSON().type === NodeType.B)) {
    return hasIntersectionB(types as Set<Internal.BNode>);
  }

  return false
};

const hasIntersectionL = (types: Set<Internal.LNode>) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );
  } else if (types.size === 1) {
    return true;
  }

  // If there is more than one label in the set, then they must be different
  // and there is no intersection
  return false;
};

const hasIntersectionA = (types: Set<Internal.ANode>) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );
  } else if (types.size === 1) {
    return true;
  }

  const children = types.map((node) => node.toJSON().child);

  return hasIntersectionTreeChild(children);
};

const hasIntersectionB = (types: Set<Internal.BNode>) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );
  } else if (types.size === 1) {
    return true;
  }

  const childrenA = types.map((node) => node.toJSON().childA);
  const childrenB = types.map((node) => node.toJSON().childB);

  return (
    hasIntersectionTreeChild(childrenA) && hasIntersectionTreeChild(childrenB)
  );
};

const hasIntersectionTreeChild = (types: Set<Internal.TreeChild>) => {
  if (types.size === 0) {
    throw Error(
      "Types list must have at least one element to check intersection"
    );
  }

  // Should still have at least one element in the set
  // const flattened = types.flatMap(flattenInterTreeChild);
  const flattened = flattenInter(types);

  const topFiltered = flattened.filter(
    (node) => node.toJSON().type !== NodeType.Top
  ) as Set<Exclude<Internal.TreeChild, Internal.InterNode | Internal.TopNode>>;

  // If set is now empty, it only contained top type, so intersection is non-empty
  if (topFiltered.size === 0) {
    return true;
  }

  return hasIntersectionInterChild(topFiltered);
};
