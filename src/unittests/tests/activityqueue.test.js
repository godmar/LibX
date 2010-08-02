// test activity queue
//

var suite = libx.testing.createUnitTestSuite("Tests for activity queue",
    function () {
        /* nothing */
        return 0;
    });

suite.addUnitTest("Test activity queue",
    function () {
        var self = this;

        // Helper class
        var Printer = libx.core.Class.create({
            initialize : function (what) { 
                this.what = what; 
            },
            onready: function(x, y) {
                self.log(this.what + " made ready at #" + x + y);
            }
        });

        var p = [ new Printer("A"), new Printer("B"), new Printer("C"), new Printer("D") ];

        test([0, 1, 2, 3]);
        test([3, 2, 1, 0]);
        test([3, 0, 2, 1]);

        function test(order) {
            var queue = new libx.utils.collections.ActivityQueue();

            for (var i = 0; i < p.length; i++)
                queue.scheduleLast(p[i]);

            self.log("making tasks ready in order: ");
            for (var i = 0; i < order.length; i++)
                self.log(p[order[i]].what + " ");
            self.log("\n");

            for (var i = 0; i < order.length; i++)
                p[order[i]].markReady(i, "\n");

            self.log("\n");
        }
        this.ASSERT_OUTPUT_MATCHES();
    }
);

/*
var queue = new libx.utils.collections.ActivityQueue();
var i = 0;
var MAX = 3;
var Printer1 = new libx.core.Class.create(Printer, {
    onready: function(a, b) {
        this.parent(a, b);
        if (i++ < MAX) {
            queue.scheduleFirst(this);
        }
    }
});

println("testing scheduleFirst(), should show " + (MAX+1) + "xA B");
var p1 = new Printer1("A");
queue.scheduleLast(p1);
var p2 = new Printer1("B");
queue.scheduleLast(p2);

while (i < 2)
    p1.markReady(" -1- ", " ");

while (i <= MAX)
    queue.markReady(p1, " -2- ", " ");

p2.markReady("", "");
println("");
*/
