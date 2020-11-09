import * as MDAST from "mdast";
import * as UNIST from "unist";
import * as is from "unist-util-is";

// Hacky type predicate here.
function isClosingMatterNode(node: UNIST.Node): node is UNIST.Node {
  return "value" in node && (node as MDAST.HTML).value.startsWith("<!--");
}

export default function getBacklinksBlock(
  tree: MDAST.Root
):
  | {
      isPresent: true;
      start: UNIST.Node;
      until: UNIST.Node | null;
    }
  | {
      isPresent: false;
      insertionPoint: UNIST.Node | null;
    } {
  const existingBacklinksNodeIndex = tree.children.findIndex(
    (node: UNIST.Node): node is MDAST.Heading =>
      is(node, {
        type: "heading",
        depth: 2
      }) && is((node as MDAST.Heading).children[0], { value: "Backlinks" })
  );
  if (existingBacklinksNodeIndex === -1) {
    const insertionPoint =
      tree.children.slice().reverse().find(node => is(node, isClosingMatterNode)) || null;
    return {
      isPresent: false,
      insertionPoint
    };
  } else {
    const followingNode =
      tree.children
        .slice(existingBacklinksNodeIndex + 1)
        .find(node => is(node, [{ type: "heading" }, isClosingMatterNode])) ||
      null;
    return {
      isPresent: true,
      start: tree.children[existingBacklinksNodeIndex],
      until: followingNode
    };
  }
}
