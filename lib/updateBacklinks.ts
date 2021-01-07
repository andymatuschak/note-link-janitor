import * as MDAST from "mdast";
import * as UNIST from "unist";
import * as is from "unist-util-is";

import getBacklinksBlock from "./getBacklinksBlock";
import processor from "./processor";

export interface BacklinkEntry {
  sourceTitle: string;
  context: MDAST.BlockContent[];
}

function ensureSingleNewlineAtEnd(contents: string): string {
  return contents.trimEnd() + "\n";
}  

export default function updateBacklinks(
  tree: MDAST.Root,
  noteContents: string,
  backlinks: BacklinkEntry[]
): string {
  let insertionOffset: number;
  let oldEndOffset: number = -1;

  const backlinksInfo = getBacklinksBlock(tree);
  if (backlinksInfo.isPresent) {
    insertionOffset = backlinksInfo.start.position!.start.offset!;
    oldEndOffset = backlinksInfo.until
      ? backlinksInfo.until.position!.start.offset!
      : noteContents.length;
  } else {
    insertionOffset = backlinksInfo.insertionPoint
      ? backlinksInfo.insertionPoint.position!.start.offset!
      : noteContents.length;
  }

  if (oldEndOffset === -1) {
    oldEndOffset = insertionOffset;
  }

  let backlinksString = "";
  if (backlinks.length > 0) {
    const backlinkNodes: MDAST.ListItem[] = backlinks.map(entry => ({
      type: "listItem",
      spread: false,
      children: [
        {
          type: "paragraph",
          children: [
            ({
              type: "wikiLink",
              value: entry.sourceTitle,
              data: { alias: entry.sourceTitle }
            } as unknown) as MDAST.PhrasingContent
          ]
        },
        {
          type: "list",
          ordered: false,
          spread: false,
          children: entry.context.map(block => ({
            type: "listItem",
            spread: false,
            children: [block]
          }))
        }
      ]
    }));
    const backlinkContainer = {
      type: "root",
      children: [
        {
          type: "list",
          ordered: false,
          spread: false,
          children: backlinkNodes
        }
      ]
    };
    backlinksString = `\n## Backlinks\n${backlinks
      .map(
        entry =>
          `* [[${entry.sourceTitle}]]\n${entry.context
            .map(
              block => `\t* ${processor.stringify(block).replace(/\n.+/, "")}\n`
            )
            .join("")}`
      )
      .join("")}`;
  }

  const newNoteContents =
    ensureSingleNewlineAtEnd(noteContents.slice(0, insertionOffset)) +
    backlinksString +
    noteContents.slice(oldEndOffset);

  return newNoteContents;
}
