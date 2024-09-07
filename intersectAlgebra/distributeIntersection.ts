import { NodeType } from './common';
import { flattenInter } from './flatten';
import * as Internal from './internal'
import { Set } from 'immutable'

/**
 * Distribute intersection over a set of nodes, returning a nested set that represents
 * an equivalent union of intersection nodes
 *
 * This is a "strong" normalization function in that it places the type completely in
 * a normal form, and so should not be used in cases where it's necessary to perform
 * recursive variable loop checks
 *
 * @throws Error if the input set is empty
 * @throws Error if the input set contains only a single union node
 */
export const distributeIntersection = (
  nodes: Set<Internal.InterChild>
): Set<Set<Internal.TreeForm>> => {
  if (nodes.size === 0) {
    throw Error("Cannot distribute intersection across an empty set of nodes");
  } else if (nodes.size === 1) {
    const node = nodes.first()!

    if (node.toJSON().type === NodeType.Union) {
      // TODO: should I consider handling this case anyways?
      throw Error("Invariant failed: input set contained a single union element")
    }

    // Base case: a single tree form node in the intersection
    return Set.of(nodes as Set<Exclude<Internal.InterChild, Internal.UnionNode>>)
  }

  // Base case: no union nodes to distribute
  if (!nodes.some(node => node.toJSON().type === NodeType.Union)) {
    return Set.of(nodes as Set<Exclude<Internal.InterChild, Internal.UnionNode>>)
  }

  // Preconditions are satisified: we have at least two elements, at least one union element
  const distributeStep = distributeIntersectionStep(nodes)

  // Preconditions for this function are met because returned sets cannot be empty or contain
  // single-element sets that only include union
  return distributeStep.flatMap(distributeIntersection)
}

/**
 * Performs a single recursive step in distributing intersection through one of
 * the union nodes in the input set, returning a nested set representing the union
 * of intersections of nodes.
 *
 * This is a "weak" normalization function in that it doesn't transform directly
 * in a final normal form, but only takes a step towards a normal form
 *
 * In future version of this function, we may need to return information about
 * an recursive variables unfolded within this functions
 *
 * Note that intersection sets returned could return single L/A/B nodes in some cases.
 * But if they contain a union node, they should always contain at least two nodes
 *
 * TODO: I'm fairly certain that I can do below safely with step-wise operations
 * and I like that because it gives some better structure to the types.
 * But then again, maybe we couldn't assert the TreeForm types
 *
 * Note that I believe we want to avoid performing stronger normalization to turn this
 * into the appropriate nodes for union/intersection so that we can use this to evaluate
 * if intersections are equivalent to the bottom type and check for recursive loops.
 * But maybe we could transform to the stronger versions of the nodes? That would be nice
 *
 * @throws Error if there is no union node in the input set
 * @throws Error if there are not at least two nodes in the element set
 */
const distributeIntersectionStep  = (
  types: Set<Internal.InterChild>
): Set<Set<Internal.InterChild>> => {
  if (types.size < 2) {
    throw Error("Cannot distribute intersection with less than 2 elements");
  }

  const unionElt = types.find(
    (type) => type.toJSON().type === NodeType.Union
  ) as Internal.UnionNode | undefined;

  if (unionElt === undefined) {
    throw Error("Cannot distribute intersection through nodes without a union node")
  }

  // We assert to include the union child type so we can add them below
  const typesNoUnionElt = types.remove(unionElt) as Set<
    Internal.InterChild | Internal.UnionChild
  >;

  const newIntersections = unionElt
    .toJSON()
    .children
    .map((unionEltChild) => {
      const intersect = typesNoUnionElt.add(unionEltChild);

      return flattenInter(intersect);
    });

  // NOTE this set could contain a single element (e.g. if the elements in the union are also in the intersection)
  // NOTE the sets in this set could contain a single L/A/B element (e.g. one other element other than union that is identical to an element in the union)
  // NOTE that the sets in this cannot contain a single union node, because the only way we can add union elements to typesNoUnionElt is via flattening an intersection,
  // and assuming we require two structurally unique elements, we should always end up with at least two unique elements after flattening
  return newIntersections
}
