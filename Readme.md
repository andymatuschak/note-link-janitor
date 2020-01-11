# note-link-janitor

This script reads in a folder of Markdown files, notes all the [[wiki-style links]] between them, then adds a special "backlinks" section which lists passages which reference a given file.

For example, this text might get added to `Sample note.md`:

```
## Backlinks
* [[Something that links here]]
    * The block of text in the referencing note which contains the link to [[Sample note]].
    * Another block in that same note which links to [[Sample note]].
* [[A different note that links here]]
    * This is a paragraph from another note which links to [[Sample note]].
```

The script is idempotent; on subsequent runs, _it will update that backlinks section in-place_.

The backlinks section will be initially inserted at the end of the file. If there happens to be a HTML-style `<!-- -->` block at the end of your note, the backlinks will be inserted before that block.

## Assumptions/warnings

1. Links are formatted `[[like this]]`.
2. Note titles are inferred from filenames. That is: if a file named `Note A.md` contains the text `[[Note B]]`, then a backlink to `Note A` will be added to the file named `Note B.md`. No special handling is yet present for special characters in filenames.
3. All `.md` files are siblings; the script does not currently recursively traverse subtrees (though that would be a simple modification if you need it; see `lib/readAllNotes.ts`)
4. The backlinks "section" is defined as the AST span between `## Backlinks` and the next heading tag (or `<!-- -->` tag). Any text you might add to this section will be clobbered. Don't append text after the backlinks list without a heading in between! (I like to leave my backlinks list at the end of the file)

### This is FYI-style open source

This is FYI-style open source. I'm sharing it for interested parties, but without any stewardship commitment. Assume that my default response to issues and pull requests will by to ignore or close them without comment. If you do something interesting with this, though, [please let me know](mailto:andy@andymatuschak.org).

## Usage

To install a published release, run:

```
yarn global add @andymatuschak/note-link-janitor
```

Then to run it (note that it will modify your `.md` files _in-place_; you may want to make a backup!):

```
note-link-janitor path/to/folder/containing/md/files
```

That will run it once; you'll need to create a cron job or a launch daemon to run it regularly.

It's built to run against Node >=12, so you may need to upgrade or swap your runtime version.

## Building a local copy

```
yarn install
yarn run build
```

## Future work

In the future, I intend to expand this project to monitor for broken links, orphans, and other interesting hypertext-y predicates.
