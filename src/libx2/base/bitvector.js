(function () {

/** @private */
function checkIndex(vector, index) {
    if (index < 0 || index >= vector.length)
        throw new Error("array index out of bounds: " + index + "(" + vector.length + ")");
}

/**
 * @class
 */
libx.utils.collections.BitVector = libx.core.Class.create(
    /** @lends libx.utils.collections.BitVector.prototype */{
    initialize : function () {
        this.vector = [];
    },
    set : function (index, value) {
        checkIndex(this.vector, index);
        this.vector[index] = value;
        return this;
    },
    get : function (index) {
        checkIndex(this.vector, index);
        return this.vector[index];
    },
    add : function (value) {
        this.vector.push(value);
    },
    size : function () {
        return this.vector.length;
    },
    /**
     * Clone this bitvector.
     */
    clone : function () {
        var bv = new libx.utils.collections.BitVector();
        bv.vector = this.vector.concat();
        return bv;
    }
});

}) ();
