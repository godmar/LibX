(function () {

/** @private */
function checkIndex(vector, index) {
    if (index < 0 || index >= vector.length)
        throw new Error("array index out of bounds: " + index + "(" + vector.length + ")");
}

/**
 * A Vector class.
 *
 * Vector wraps an array and performs bounds checks for indices.
 * Also supports clone.
 *
 * @name libx.utils.collections.Vector
 * @class 
 */
var Vector = libx.utils.collections.Vector = libx.core.Class.create(
    /** @lends libx.utils.collections.Vector.prototype */{
    initialize : function () {
        this.vector = [];
    },
    /** Set an element (must be within bounds) */
    set : function (index, value) {
        checkIndex(this.vector, index);
        this.vector[index] = value;
        return this;
    },
    /** Get an element */
    get : function (index) {
        checkIndex(this.vector, index);
        return this.vector[index];
    },
    /** Add an element to the end of the vector */
    add : function (value) {
        this.vector.push(value);
    },
    /** Get current size. */
    size : function () {
        return this.vector.length;
    },
    /** Get number of elements that are not false. */
    count : function () {
        var s = 0;
        for (var i = 0; i < this.vector.length; i++)
            if (this.vector[i])
                s++;
        return s;
    },
    /**
     * Clone this vector.
     */
    clone : function () {
        var bv = new Vector();
        bv.vector = this.vector.concat();
        return bv;
    }
});

}) ();
