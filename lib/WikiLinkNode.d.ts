import * as UNIST from "unist";

export interface WikiLinkNode extends UNIST.Node {
  value: string;
  data: {
    alias: string;
    permalink: string;
  };
}
