(function () {
    var suite = libx.testing.createUnitTestSuite("Tests for trie collection class",
        function () {
            load("../base/bootstrapped/global/shared/utils/collections/trie.js");
            load("../base/core/global/shared/utils/json.js");
            return 0;
        });

    suite.addUnitTest("Test Trie",
        function () {
            var trie = new libx.utils.collections.Trie();
            trie.put("halleluja", 1);
            trie.put("halle", 2);
            trie.put("affe", 3);
            trie.put("afge", 4);

            this.ASSERT_EQUAL(trie.get("halleluja"), 1);
            this.ASSERT_UNDEFINED(trie.get("hallelu"));
            this.ASSERT_EQUAL(trie.get("halle"), 2);
            this.ASSERT_UNDEFINED(trie.get("hall"));
            this.ASSERT_EQUAL(trie.get("affe"), 3);
            this.ASSERT_EQUAL(trie.get("afge"), 4);
            this.ASSERT_UNDEFINED(trie.remove("bbb"));
            this.ASSERT_EQUAL(trie.remove("affe"), 3);
            this.ASSERT_UNDEFINED(trie.remove("affe"));
            this.ASSERT_FALSE(trie.contains("affe"));
            this.ASSERT_TRUE(trie.contains("halleluja"));
        });

    suite.addUnitTest("Test Aho-Corasick",
        function () {
            var t2 = new libx.utils.collections.Trie();
            t2.put("he", 1);
            t2.put("she", 2);
            t2.put("his", 3);
            t2.put("hers", 4);
            var matcher = t2.constructAhoCorasickMatcher();

            var match = matcher.match("ushers");
            var expected = [{index:3, matches:{she:1, he:1}}, 
                            {index:5, matches:{hers:1}}];

            this.ASSERT_EQUAL(
                libx.utils.json.stringify(match), 
                libx.utils.json.stringify(expected));
        });
})();
