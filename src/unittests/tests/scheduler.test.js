var ocache;
var configLoads = 0;
var suite = libx.testing.createUnitTestSuite("Tests for schedulers",
    function () {
        libx.loadConfig = function () {
            configLoads++;
        };
        resourcePath = "tests/resources/schedulers/";
        return 0;
    });

//TODO: test individually hosted libapps
function startScheduler(scheduler) {
    scheduler.updateInterval = 2 * 1000;
    scheduler.initialRetryInterval = 1 * 1000;
    scheduler.maxRandDelay = 0;
    scheduler.scheduleUpdates();
}

function getModifiedDates(resourceUrl, files) {
    var lastModified = [];
    files.forEach(function (file) {
        // since we use localstorage for the testing framework, this is
        // guaranteed to be synchronous
        libx.cache.defaultObjectCache.getMetadata({
            url: resourceUrl + file,
            success: function (metadata) {
                var date = new Date(metadata.lastModified).getTime();
                lastModified.push(date);
            }
        });
    });
    return lastModified;
}

suite.addUnitTest("Test config scheduler",
    function () {
        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";
        var configUrl = resourceUrl + "config.xml";
        var files = ["config.xml", "config_file1.js", "config_file2.js"];

        exec("touch " + resourcePath + files[1]);
        exec("touch " + resourcePath + files[2]);
        configScheduler = new libx.cache.ConfigScheduler(configUrl);
        this.ASSERT_EQUAL(configLoads, 0);
        startScheduler(configScheduler);

        this.WAIT(3);

        this.ASSERT_EQUAL(configLoads, 1);
        var beforeUpdates = getModifiedDates(resourceUrl, files);
        exec("touch " + resourcePath + files[0]);
        exec("touch " + resourcePath + files[2]);

        this.WAIT(3);

        this.ASSERT_EQUAL(configLoads, 2);
        var afterUpdates = getModifiedDates(resourceUrl, files);
        this.ASSERT_TRUE(beforeUpdates[0] < afterUpdates[0]);
        this.ASSERT_EQUAL(beforeUpdates[1], afterUpdates[1]);
        this.ASSERT_TRUE(beforeUpdates[2] < afterUpdates[2]);
        configScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

suite.addUnitTest("Test hash scheduler",
    function () {
        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";
        var hashUrl = resourceUrl + "updates.json";
        var files = ["updates.json", "hash_file1.js", "hash_file2.js"];

        function writeToFile(index, str) {
            var fileWriter = new FileWriter(resourcePath + files[index]);
            fileWriter.write(str);
            fileWriter.close();
        }

        var schedulersUrl = libx.locale.getBootstrapURL('schedulers/');
        libx.locale.getBootstrapURL = function (relPath) {
            return schedulersUrl + relPath;
        };

        hashScheduler = new libx.cache.HashScheduler(hashUrl);
        writeToFile(1, "before");
        writeToFile(2, "before");
        exec("tests/resources/schedulers/genhash.pl");
        startScheduler(hashScheduler);

        this.WAIT(3);

        var beforeUpdates = getModifiedDates(resourceUrl, files);
        writeToFile(2, "after");
        exec("tests/resources/schedulers/genhash.pl");

        this.WAIT(3);

        var afterUpdates = getModifiedDates(resourceUrl, files);
        this.ASSERT_TRUE(beforeUpdates[0] < afterUpdates[0]);
        this.ASSERT_EQUAL(beforeUpdates[1], afterUpdates[1]);
        this.ASSERT_TRUE(beforeUpdates[2] < afterUpdates[2]);
        hashScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

suite.addUnitTest("Test package scheduler",
    function () {
        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";
        var packageUrl = resourceUrl + "libapps/package";
        var files = ["libapps/", "libapps/alt1/", "libapps/alt2/"];

        load(this.basePath + "bootstrapped/global/shared/libapp/atomparser.js");
        packageScheduler = new libx.cache.PackageScheduler(packageUrl);
        startScheduler(packageScheduler);

        this.WAIT(3);

        var beforeUpdates = getModifiedDates(resourceUrl, files);
        exec("touch " + resourcePath + files[2] + "index.xml");

        this.WAIT(3);

        var afterUpdates = getModifiedDates(resourceUrl, files);
        this.ASSERT_EQUAL(beforeUpdates[0], afterUpdates[0]);
        this.ASSERT_TRUE(beforeUpdates[1] < afterUpdates[1]);
        this.ASSERT_EQUAL(beforeUpdates[2], afterUpdates[2]);
        packageScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

suite.addUnitTest("Test missing files",
    function () {
        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";
        var configUrl = resourceUrl + "invalid_config.xml";
        var files = ["invalid_config.xml", "missing_file1.js", "config_file2.js"];

        configScheduler = new libx.cache.ConfigScheduler(configUrl);
        startScheduler(configScheduler);

        this.WAIT(10);

        configScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

