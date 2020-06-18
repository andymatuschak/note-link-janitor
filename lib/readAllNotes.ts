import * as fs from "fs";
import * as MDAST from "mdast";
import * as path from "path";
import * as remark from "remark";
import * as find from "unist-util-find";

import getNoteLinks, { NoteLinkEntry } from "./getNoteLinks";
import processor from "./processor";

const missingTitleSentinel = { type: "missingTitle" } as const;

const headingFinder = processor().use(() => tree =>
  find(tree, { type: "heading", depth: 1 }) || missingTitleSentinel
);
interface Note {
  title: string;
  links: NoteLinkEntry[];
  noteContents: string;
  parseTree: MDAST.Root;
}

async function readNote(notePath: string): Promise<Note> {
  const noteContents = await fs.promises.readFile(notePath, {
    encoding: "utf-8"
  });

  const parseTree = processor.parse(noteContents) as MDAST.Root;
  const headingNode = await headingFinder.run(parseTree);
  if (headingNode.type === "missingTitle") {
    throw new Error(`${notePath} has no title`);
  }
  const title = remark()
    .stringify({
      type: "root",
      children: (headingNode as MDAST.Heading).children
    })
    .trimEnd();

  return { title, links: getNoteLinks(parseTree), parseTree, noteContents };
}

export default async function readAllNotes(
  noteFolderPath: string
): Promise<{ [key: string]: Note }> {
  const noteDirectoryEntries = await fs.promises.readdir(noteFolderPath, {
    withFileTypes: true
  });
  const notePaths = noteDirectoryEntries
    .filter(entry => entry.isFile() && !entry.name.startsWith(".") && entry.name.endsWith(".md"))
    .map(entry => path.join(noteFolderPath, entry.name));

  const noteEntries = await Promise.all(
    notePaths.map(async notePath => [notePath, await readNote(notePath)])
  );
  return Object.fromEntries(noteEntries);
}
