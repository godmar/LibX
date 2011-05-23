var ocache;
var suite = libx.testing.createUnitTestSuite("Tests for schedulers",
    function () {
        return 0;
    });

function startScheduler(scheduler) {
    scheduler.defaultUpdateInterval = 2 * 1000;
    scheduler.initialRetryInterval = 2 * 1000;
    scheduler.maxRandDelay = 2 * 1000;
    scheduler.scheduleUpdates();
}

suite.addUnitTest("Test config scheduler",
    function () {
        var self = this;

        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";

        var configUrl = resourceUrl + "config.xml";
        configScheduler = new libx.cache.ConfigScheduler(configUrl);
        startScheduler(configScheduler);

        this.WAIT(5);

        var files = [
            "tests/resources/schedulers/config.xml",
            "tests/resources/schedulers/config_file2.js"
        ];
        libx.log.write("");
        files.forEach(function (file) {
            libx.log.write("Touched file: " + file);
            exec("touch " + file);
        });

        this.WAIT(5);
        configScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

suite.addUnitTest("Test hash scheduler",
    function () {
        var self = this;

        var resourceUrl = this.baseUrl + "tests/resources/schedulers/";

        var hashUrl = resourceUrl + "updates.json";
        hashScheduler = new libx.cache.HashScheduler(hashUrl);
        hashScheduler.bootstrapBase = resourceUrl;
        exec("tests/resources/schedulers/updatehash1.sh");
        exec("tests/resources/schedulers/genhash.pl");
        startScheduler(hashScheduler);

        this.WAIT(5);

        libx.log.write("\nChanged file2");
        exec("tests/resources/schedulers/updatehash2.sh");
        exec("tests/resources/schedulers/genhash.pl");

        this.WAIT(5);
        hashScheduler.stopScheduling();
    },
    {
        timeout: 30
    });

suite.addUnitTest("Test package scheduler",
    function () {
        var self = this;
        load("../base/bootstrapped/global/shared/libapp/atomparser.js");

        var resourceUrl = this.baseUrl + "tests/resources/schedulers/libapps/";

        var packageUrl = resourceUrl + "package";
        packageScheduler = new libx.cache.PackageScheduler(packageUrl);
        startScheduler(packageScheduler);

        this.WAIT(5);

        exec("touch tests/resources/schedulers/libapps/alt2/index.xml");
        libx.log.write("\nChanged alt2 feed");

        this.WAIT(5);
        packageScheduler.stopScheduling();
    },
    {
        timeout: 30
    });
