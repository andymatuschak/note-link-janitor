import * as MDAST from "mdast";
import * as UNIST from "unist";
import * as visitParents from "unist-util-visit-parents";

import getBacklinksBlock from "./getBacklinksBlock";
import { WikiLinkNode } from "./WikiLinkNode";

const blockTypes = [
  "paragraph",
  "heading",
  "thematicBreak",
  "blockquote",
  "list",
  "table",
  "html",
  "code"
];

function isBlockContent(node: MDAST.Content): node is MDAST.BlockContent {
  return blockTypes.includes(node.type);
}

export interface NoteLinkEntry {
  targetTitle: string;
  context: MDAST.BlockContent | null;
}

export default function getNoteLinks(tree: MDAST.Root): NoteLinkEntry[] {
  // Strip out the backlinks section
  const backlinksInfo = getBacklinksBlock(tree);
  let searchedChildren: UNIST.Node[];
  if (backlinksInfo.isPresent) {
    searchedChildren = tree.children
      .slice(
        0,
        tree.children.findIndex(n => n === backlinksInfo.start)
      )
      .concat(
        tree.children.slice(
          backlinksInfo.until
            ? tree.children.findIndex(n => n === backlinksInfo.until)
            : tree.children.length
        )
      );
  } else {
    searchedChildren = tree.children;
  }
  const links: NoteLinkEntry[] = [];
  visitParents<WikiLinkNode>(
    { ...tree, children: searchedChildren } as MDAST.Parent,
    "wikiLink",
    (node: WikiLinkNode, ancestors: MDAST.Content[]) => {
      const closestBlockLevelAncestor = ancestors.reduceRight<MDAST.BlockContent | null>(
        (result, needle) => result ?? (isBlockContent(needle) ? needle : null),
        null
      );
      links.push({
        targetTitle: ((node as unknown) as WikiLinkNode).data.alias,
        context: closestBlockLevelAncestor
      });
      return true;
    }
  );
  return links;
}
