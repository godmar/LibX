(function () {
    load("testing.js");

    libx.testing.createUnitTestSuite({ 
        name: "trie collection",
        setup: function () {
            load("../base/bootstrapped/global/shared/utils/collections/trie.js");
            load("../base/core/global/shared/utils/json.js");
            return 0;
        }
    });

    libx.testing.addUnitTest({
        suiteName:  "trie collection",
        funcName:   "test trie",
        testFunction: function () {
            var trie = new libx.utils.collections.Trie();
            trie.put("halleluja", 1);
            trie.put("halle", 2);
            trie.put("affe", 3);
            trie.put("afge", 4);

            libx.testing.methods.ASSERT_EQUAL(trie.get("halleluja"), 1);
            libx.testing.methods.ASSERT_UNDEFINED(trie.get("hallelu"));
            libx.testing.methods.ASSERT_EQUAL(trie.get("halle"), 2);
            libx.testing.methods.ASSERT_UNDEFINED(trie.get("hall"));
            libx.testing.methods.ASSERT_EQUAL(trie.get("affe"), 3);
            libx.testing.methods.ASSERT_EQUAL(trie.get("afge"), 4);
            libx.testing.methods.ASSERT_UNDEFINED(trie.remove("bbb"));
            libx.testing.methods.ASSERT_EQUAL(trie.remove("affe"), 3);
            libx.testing.methods.ASSERT_UNDEFINED(trie.remove("affe"));
            libx.testing.methods.ASSERT_FALSE(trie.contains("affe"));
            libx.testing.methods.ASSERT_TRUE(trie.contains("halleluja"));
        }
    });

    libx.testing.addUnitTest({
        suiteName:  "trie collection",
        funcName:   "test Aho-Corasick",
        testFunction: function () {
            var t2 = new libx.utils.collections.Trie();
            t2.put("he", 1);
            t2.put("she", 2);
            t2.put("his", 3);
            t2.put("hers", 4);
            var matcher = t2.constructAhoCorasickMatcher();

            var match = matcher.match("ushers");
            var expected = [{index:3, matches:{she:1, he:1}}, 
                            {index:5, matches:{hers:1}}];

            libx.testing.methods.ASSERT_EQUAL(
                libx.utils.json.stringify(match), 
                libx.utils.json.stringify(expected));
        }
    });
})();
