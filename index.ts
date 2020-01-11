#!/usr/bin/env node

import * as fs from "fs";
import * as graph from "pagerank.js";
import * as path from "path";

import createLinkMap from "./lib/createLinkMap";
import readAllNotes from "./lib/readAllNotes";
import updateBacklinks from "./lib/updateBacklinks";

(async () => {
  const baseNotePath = process.argv[2];
  if (!baseNotePath || baseNotePath === "--help") {
    console.log("Usage: note-link-janitor [NOTE_DIRECTORY]");
    return;
  }

  const notes = await readAllNotes(baseNotePath);
  const linkMap = createLinkMap(Object.values(notes));

  // Sort by PageRank
  for (const note of linkMap.keys()) {
    const entry = linkMap.get(note)!;
    for (const linkingNote of entry.keys()) {
      graph.link(linkingNote, note, 1.0);
    }
  }
  const noteRankings: { [key: string]: number } = {};
  graph.rank(0.85, 0.000001, function(node, rank) {
    noteRankings[node] = rank;
  });

  await Promise.all(
    Object.keys(notes).map(async notePath => {
      const backlinks = linkMap.get(notes[notePath].title);
      const newContents = updateBacklinks(
        notes[notePath].parseTree,
        notes[notePath].noteContents,
        backlinks
          ? [...backlinks.keys()]
              .map(sourceTitle => ({
                sourceTitle,
                context: backlinks.get(sourceTitle)!
              }))
              .sort(
                (
                  { sourceTitle: sourceTitleA },
                  { sourceTitle: sourceTitleB }
                ) =>
                  (noteRankings[sourceTitleB] || 0) -
                  (noteRankings[sourceTitleA] || 0)
              )
          : []
      );
      if (newContents !== notes[notePath].noteContents) {
        await fs.promises.writeFile(
          path.join(baseNotePath, path.basename(notePath)),
          newContents,
          { encoding: "utf-8" }
        );
      }
    })
  );
})();
