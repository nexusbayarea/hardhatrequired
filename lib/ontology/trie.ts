/**
 * Aho-Corasick trie for O(N) multi-pattern string matching.
 * Handles 5,000+ patterns with no linear scan bottleneck.
 *
 * Build once, search many times. Each search is O(textLength + numMatches).
 */

export interface TrieNode {
  children: Map<string, TrieNode>;
  failure: TrieNode | null;
  output: string[];
}

export class AhoCorasickTrie {
  private root: TrieNode;
  private built = false;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return { children: new Map(), failure: null, output: [] };
  }

  add(pattern: string): void {
    this.built = false;
    let node = this.root;
    for (const char of pattern.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }
    node.output.push(pattern);
  }

  build(): void {
    const queue: TrieNode[] = [];
    this.root.failure = null;

    for (const child of this.root.children.values()) {
      child.failure = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const [char, child] of current.children) {
        queue.push(child);
        let failure = current.failure;
        while (failure !== null && !failure.children.has(char)) {
          failure = failure.failure;
        }
        child.failure = failure !== null ? failure.children.get(char)! : this.root;
        child.output.push(...child.failure.output);
      }
    }

    this.built = true;
  }

  search(text: string): string[] {
    if (!this.built) this.build();
    const matches: string[] = [];
    let node = this.root;
    const lower = text.toLowerCase();

    for (const char of lower) {
      while (node !== this.root && !node.children.has(char)) {
        node = node.failure!;
      }
      if (node.children.has(char)) {
        node = node.children.get(char)!;
      } else {
        node = this.root;
      }
      if (node.output.length > 0) {
        matches.push(...node.output);
      }
    }

    return matches;
  }

  static compile(patterns: string[]): AhoCorasickTrie {
    const trie = new AhoCorasickTrie();
    for (const p of patterns) trie.add(p);
    trie.build();
    return trie;
  }
}
