(function () {
    load("testing.js"); // This is required
    libx.testing.createUnitTestSuite({
        name: "test framework", 
        setup: function () { return 10; }
    });

    libx.testing.addUnitTest({
        suiteName:  "test framework",
        funcName:   "testing the setup() function return feature",
        testFunction: function (setup_return_value) {
            libx.testing.methods.ASSERT_EQUAL(setup_return_value, 10);
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework",
        funcName:   "testing wait_for_condition statement (1)",
        testFunction: function () {
            print("this test should fail, because the condition will not be met\n");
            libx.testing.methods.WAIT_FOR_CONDITION(
                (function () { return false; })(), 2, true
            );
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework",
        funcName:   "testing wait_for_condition statement (2)",
        testFunction: function () {
            this.print("this test should pass, because the condition should be met immediately\n");
            libx.testing.methods.WAIT_FOR_CONDITION(
                (function () { return true; })(), 1
            );
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework", 
        funcName:   "testing timeout interval and WAIT (1)",
        timeout:    2,
        testFunction:       function () {
            this.print ("waiting 3 sec -- should timeout and fail\n");
            libx.testing.methods.WAIT(3, true);
            this.print ("we didn't timeout.\n");
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework", 
        funcName:   "testing timeout interval and WAIT (2)",
        timeout:    2,
        testFunction: function () {
            this.print ("waiting 1 sec -- should not timeout\n");
            libx.testing.methods.WAIT(1);
            this.print ("we didn't timeout.\n");
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework",
        funcName:   "testing output validation",
        testFunction: function () {
            libx.testing.record("hello\n");
            libx.testing.record("i'm testing the output validation feature");
            libx.testing.record("\n12345");
            libx.testing.methods.ASSERT_OUTPUT_MATCHES(
                "unittestframework_outputtest.txt"
            );
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "test framework",
        funcName:   "test assert statements",
        testFunction: function () {
            libx.testing.methods.ASSERT_TRUE(1);
            libx.testing.methods.ASSERT_TRUE(1 == 1);

            libx.testing.methods.ASSERT_FALSE(0);
            libx.testing.methods.ASSERT_FALSE(2 + 2 == 5);

            libx.testing.methods.ASSERT_EQUAL("abc", "abc");
            libx.testing.methods.ASSERT_EQUAL(true, true);
            libx.testing.methods.ASSERT_EQUAL(3.1415926535, 3.1415926535);

            libx.testing.methods.ASSERT_NOT_EQUAL(3.1415926535, 3.141592653);
            libx.testing.methods.ASSERT_NOT_EQUAL(true, false);

            libx.testing.methods.ASSERT_IDENTICAL(3.1415926535, 3.1415926535);
            libx.testing.methods.ASSERT_IDENTICAL("", "");

            libx.testing.methods.ASSERT_NOT_IDENTICAL("", true);

            libx.testing.methods.ASSERT_REGEXP_MATCHES(/(a+)(b+)/, "aabbb");
        }
    });
})();
