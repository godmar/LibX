load("../libx2/base/tuplespace.js");

space = new libx.libapp.TupleSpace();

tuple = {
    keyword: "hi",
    type: "X"
};

Take = libx.core.Class.create({
    initialize: function (p) { this.priority = p; },
    count: 1,
    template: { keyword: space.WILDCARD },
    ontake: function (tuple) {
        println("Take #" + (this.count++) + ": pri=" 
                + this.priority + " " + libx.utils.types.dumpObject(tuple));
    }
});

println("Write 1");
space.write(tuple);
space.take(new Take(1));
space.take(new Take(2));
space.take(new Take(1));
println("Write 2");
space.write(tuple);
println("Write 3");
space.write(tuple);

