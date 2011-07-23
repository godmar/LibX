var ocache;
var suite = libx.testing.createUnitTestSuite("Tests for object cache",
    function () {
        ocache = new libx.cache.ObjectCache(2000);
        /* nothing */
        return 0;
    });

suite.addUnitTest("Test object cache 1",
    function () {
        var self = this;

        var file1 = "tests/resources/file1.txt";
        function updateFile() {
            exec("touch " + file1);
        }
        var resourceUrl = this.baseUrl + "tests/resources/";
        var foundReferences = false;
        var numberOfCompletes = 0;

        var file1Request = {
            url: self.baseUrl + file1,
            success: function (content, metadata) {
                var m, r = /reference=(.*)$/mg;
                var deps = [];
                while (m = r.exec(content)) {
                    deps.push(m[1]);
                }
                foundReferences = deps.length == 2;
            },
            complete: function () {
                numberOfCompletes++;
            },
            error: function (status) {
                self.ASSERT_FALSE("Error status: " + status);
            }
        };
        ocache.get(file1Request);

        this.WAIT(3);
        updateFile();
        this.WAIT(3);

        this.ASSERT_TRUE(foundReferences, "Expected references");
        this.ASSERT_EQUAL(numberOfCompletes, 1, "Expected 1 complete");
    },
    {
        timeout: 30
    });
