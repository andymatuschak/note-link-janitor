import * as RemarkParse from "remark-parse";
import * as RemarkStringify from "remark-stringify";
import * as RemarkWikiLink from "remark-wiki-link";

import unified = require("unified");

// TODO adopt the more general parser in incremental-thinking

function allLinksHaveTitles() {
  const Compiler = this.Compiler;
  const visitors = Compiler.prototype.visitors;
  const original = visitors.link;

  visitors.link = function(linkNode) {
    return original.bind(this)({
      ...linkNode,
      title: linkNode.title || ""
    });
  };
}

const processor = unified()
  .use(RemarkParse as any, { commonmark: true, pedantic: true }) // type decl doesn't have options
  .use(RemarkStringify, {
    bullet: "*",
    emphasis: "*",
    listItemIndent: "1",
    rule: "-",
    ruleSpaces: false
  })
  .use(allLinksHaveTitles)
  .use(RemarkWikiLink);

export default processor;
