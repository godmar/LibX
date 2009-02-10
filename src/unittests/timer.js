// test libx.utils.timer
//
libx.utils.timer.setTimeout(function () {
    println("one shot");
}, 500);

libx.utils.timer.setInterval(function () {
    println("periodic");
}, 500);

println("sleeping");
java.lang.Thread.sleep(3000);
println("done");
