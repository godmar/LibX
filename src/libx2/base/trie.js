(function () {

/** @private Traverse trie and find node where value associated 
 * with a given word would be found.
 */
function findTrieNode(node, word) {
    for (var i = 0; node && i < word.length; i++)
        node = node[word.charAt(i)];

    return node;
}

function forall_dfs(node, visitor, parent, edgec) {
    visitor.visit (node, parent, edgec);
    for (var c in node) {
        if (c.length == 1) {
            forall_dfs(node[c], visitor, node, c);
        }
    }
}

/**
 * A Trie class.
 *
 * Support optional construction of Aho-Corasick matcher.
 *
 * @author Godmar Back
 *
 * @name libx.utils.collections.Trie
 * @class 
 */
var Trie = libx.utils.collections.Trie = libx.core.Class.create(
    /** @lends libx.utils.collections.Trie.prototype */{
    initialize : function () {
        this.root = { };
    },
    /** Insert a (word, value) pair into trie */
    put: function (word, value) {
        var node = this.root;
        for (var i = 0; i < word.length; i++) {
            var c = word.charAt(i);
            if (!(c in node))
                node[c] = { };
            node = node[c];
        }
        node.value = value;
    },
    /** Check if word is contained in trie */
    contains: function (word) {
        return 'value' in findTrieNode(this.root, word);
    },
    /** Retrieve value associated with a word from trie */
    get: function (word) {
        var node = findTrieNode(this.root, word);
        return node ? node.value : undefined;
    },
    /** Remove a value associated with a word from trie */
    remove: function (word) {
        var node = findTrieNode(this.root, word);
        if (node == undefined)
            return undefined;

        var oldvalue = node.value;
        delete node.value;
        return oldvalue;
    },
    /** Construct a matcher based on Aho/Corasick
     * See Aho, Alfred V.; Margaret J. Corasick (June 1975). 
     * "Efficient string matching: An aid to bibliographic search". 
     * Communications of the ACM 18 (6): 333-340. DOI:10.1145/360825.360855
     */
    constructAhoCorasickMatcher: function () {
        // prep: Clear 'fail', compute initial 'output'
        forall_dfs(this.root, {
            visit: function (node, parent, ch) { 
                delete node.fail; 
                node.output = { };
                if (parent) {
                    for (var output in parent.output) {
                        node.output[output + ch] = 1;
                        return;
                    }
                    node.output[ch] = 1;
                }
            }
        });

        // delete 'output' labels of strings that aren't in trie
        forall_dfs(this.root, {
            visit: function (node, parent, ch) { 
                if (!('value' in node))
                    delete node.output;
            }
        });

        // Algorithm (3)
        var queue = [];
        for (var a in this.root) {
            if (a.length > 1) continue;
            var s = this.root[a];
            queue.push(s);
            s.fail = this.root;
        }

        while (queue.length > 0) {
            var r = queue.shift();
            for (var a in r) {
                if (a.length > 1) continue;

                var s = r[a];
                queue.push(s);

                var state = r.fail;
                while (!(a in state) && state != this.root)
                    state = state.fail;

                s.fail = a in state ? state[a] : this.root;

                for (var m in s.fail.output)
                    s.output[m] = s.fail.output[m];
            } 
        }

        var self = this;
        return {
            /** Match this string */
            match: function (str) {
                var matches = [];
                var state = self.root;
                for (var i = 0; i < str.length; i++) {
                    var a = str.charAt(i);

                    // backtrack
                    while (!(a in state) && state != self.root)
                        state = state.fail;

                    if (a in state)
                        state = state[a];

                    if ('output' in state)
                        matches.push({ index: i, 
                                       matches: state.output, 
                                     });
                }
                return matches;
            }
        };
    }
});

}) ();
