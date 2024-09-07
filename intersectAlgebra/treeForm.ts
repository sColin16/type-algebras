import { NodeType } from "./common";
import { distributeIntersection } from "./distributeIntersection";
import * as Internal from "./internal";
import { Set } from "immutable";
import * as ListInter from "./listInter";

/**
 * Converts a union node into an equivalent set of TreeForm (L/A/B) nodes, if unioned together
 *
 * This is a "strong" normalization function in that we always complete the full
 * transformation because it used on the RHS of subtyping and so we don't need
 * to track recursive variable loops
 */
export const unionToTreeForm = (
  t: Internal.UnionNode
): Set<Internal.TreeForm> => {
  const children = t.toJSON().children;

  return children.flatMap((child) => unionToTreeFormElt(child));
};

/**
 * Converts an intersection node into the an equivalent set of TreeForm (L/A/B) nodes, if unioned together
 *
 * This is a "strong" normalization function in that we always complete the full transformation
 * because we use this on the RHS of subtyping so we don't need to track
 * recursive variable loops
 *
 * Note that this function may return an empty set
 */
export const interToTreeForm = (
  t: Internal.InterNode
): Set<Internal.TreeForm> => {
  const children = t.toJSON().children;

  // We can continue "strong" normalization functions here
  const treeChildrenIntersections = distributeIntersection(children);
  const treeChildren = treeChildrenIntersections.map(treeFormInterToTreeForm);
  const treeChildrenNoBottom = treeChildren.filter(child => child.toJSON().type !== NodeType.Bottom) as Set<Internal.TreeForm>

  return treeChildrenNoBottom
};

const unionToTreeFormElt = (
  child: Internal.UnionChild
): Set<Internal.TreeForm> => {
  const childJson = child.toJSON();

  switch (childJson.type) {
    case NodeType.Inter:
      return interToTreeForm(child as Internal.InterNode);

    case NodeType.L:
    case NodeType.A:
    case NodeType.B:
      return Set.of(child as Exclude<Internal.UnionChild, Internal.InterNode>);
  }
};

// TODO: we can't throw errors here because some of these could be bottom
// types that end up in the union, that still has an intersection
/**
 * Returns the equivalent tree form mode for the intersection of the tree form nodes
 *
 * @throws Error if the input set is empty
 */
const treeFormInterToTreeForm = (
  nodes: Set<Internal.TreeForm>
): Internal.TreeForm | Internal.BottomNode => {
  if (nodes.size === 0) {
    throw Error(
      "Tree form intersection cannot be determined from empty intersection"
    );
  }

  if (nodes.every((node) => node.toJSON().type === NodeType.L)) {
    return lNodeInterToTreeForm(nodes as Set<Internal.LNode>);
  } else if (nodes.every((type) => type.toJSON().type === NodeType.A)) {
    return aNodeInterToTreeForm(nodes as Set<Internal.ANode>);
  } else if (nodes.every((type) => type.toJSON().type === NodeType.B)) {
    return bNodeInterToTreeForm(nodes as Set<Internal.BNode>);
  }

  return Internal.bottom();
};

const lNodeInterToTreeForm = (
  nodes: Set<Internal.LNode>
): Internal.LNode | Internal.BottomNode => {
  if (nodes.size === 0) {
    throw Error(
      "L Node intersection cannot be determined from empty intersection"
    );
  } else if (nodes.size === 1) {
    return nodes.first()!;
  }

  // If there is more than one element, then the intersection is equal to the bottom type
  return Internal.bottom();
};

const aNodeInterToTreeForm = (
  nodes: Set<Internal.ANode>
): Internal.ANode | Internal.BottomNode => {
  if (nodes.size === 0) {
    throw Error(
      "A node intersection cannot be determined from empty intersection"
    );
  }

  const nestedChildren = nodes.map((node) => node.toJSON().child);
  const intersectedNode = ListInter.ofTreeChildren(nestedChildren);

  if (intersectedNode.toJSON().type === NodeType.Bottom) {
    return Internal.bottom();
  }

  return Internal.a(intersectedNode as Internal.TreeForm);
};

const bNodeInterToTreeForm = (
  nodes: Set<Internal.BNode>
): Internal.BNode | Internal.BottomNode => {
  if (nodes.size === 0) {
    throw Error(
      "B node intersection cannot be determined from empty intersection"
    );
  }

  const nestedChildrenA = nodes.map((node) => node.toJSON().childA);
  const nestedChildrenB = nodes.map((node) => node.toJSON().childB);

  const intersectedNodeA = ListInter.ofTreeChildren(nestedChildrenA);
  const intersectedNodeB = ListInter.ofTreeChildren(nestedChildrenB);

  if (
    intersectedNodeA.toJSON().type === NodeType.Bottom ||
    intersectedNodeB.toJSON().type === NodeType.Bottom
  ) {
    return Internal.bottom();
  }

  return Internal.b(
    intersectedNodeA as Internal.TreeForm,
    intersectedNodeB as Internal.TreeForm
  );
};
