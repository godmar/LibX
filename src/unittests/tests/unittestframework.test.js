(function () {
    var suite = libx.testing.createUnitTestSuite("Internal Test Framework Tests",
        function () { return 10; }
    );

    suite.addUnitTest("testing the setup() function return feature",
        function (setup_return_value) {
            this.ASSERT_EQUAL(setup_return_value, 10);
        }
    );

    suite.addUnitTest("testing wait_for_condition statement (1)",
        function () {
            print("this test should fail, because the condition will not be met\n");
            this.WAIT_FOR_CONDITION(
                (function () { return false; })(), 2, true
            );
        }
    );

    suite.addUnitTest("testing wait_for_condition statement (2)",
        function () {
            this.print("this test should pass, because the condition should be met immediately\n");
            this.WAIT_FOR_CONDITION(
                (function () { return true; })(), 1
            );
        }
    );

    suite.addUnitTest("testing timeout interval and WAIT (1)",
        function () {
            this.print ("waiting 3 sec -- should timeout and fail\n");
            this.WAIT(3, true);
            this.print ("we didn't timeout.\n");
        },
        { timeout:    2 }
    );

    suite.addUnitTest("testing timeout interval and WAIT (2)",
        function () {
            this.print ("waiting 1 sec -- should not timeout\n");
            this.WAIT(1);
            this.print ("we didn't timeout.\n");
        },
        { timeout:    2 }
    );

    suite.addUnitTest("testing output validation",
        function () {
            libx.testing.record("hello\n");
            libx.testing.record("i'm testing the output validation feature");
            libx.testing.record("\n12345");
            this.ASSERT_OUTPUT_MATCHES(
                "unittestframework_outputtest.txt"
            );
        }
    );

    suite.addUnitTest("test assert statements",
        function () {
            this.ASSERT_TRUE(1);
            this.ASSERT_TRUE(1 == 1);

            this.ASSERT_FALSE(0);
            this.ASSERT_FALSE(2 + 2 == 5);

            this.ASSERT_EQUAL("abc", "abc");
            this.ASSERT_EQUAL(true, true);
            this.ASSERT_EQUAL(3.1415926535, 3.1415926535);

            this.ASSERT_NOT_EQUAL(3.1415926535, 3.141592653);
            this.ASSERT_NOT_EQUAL(true, false);

            this.ASSERT_IDENTICAL(3.1415926535, 3.1415926535);
            this.ASSERT_IDENTICAL("", "");

            this.ASSERT_NOT_IDENTICAL("", true);

            this.ASSERT_REGEXP_MATCHES(/(a+)(b+)/, "aabbb");
        }
    );
})();
