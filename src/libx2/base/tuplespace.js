/*
 * Tuplespace implementation
 *
 * based on Tobias Wieschnowsky's implementation
 */

(function () {

/** @private */
function sortByPriority( a, b )
{
    return b.priority - a.priority;
}

/** @private */
var WILDCARD = { toString: function () { return "*WILDCARD*"; } };

/** @private */
function match ( template, tuple )
{
    for ( var p in template )
    {
        if ( !tuple.hasOwnProperty(p)) {
            return false;
        }
        if ( template[p] === WILDCARD )
            continue;
        if ( tuple[p] != template[p] )
            return false;
    }
    return true;
}

/**
 * @class
 *
 * Standard TupleSpace implementation.
 */
libx.libapp.TupleSpace = libx.core.Class.create(
    /** @lends libx.libapp.TupleSpace.prototype */{
    initialize : function () {
        this.tupleList = new Array();
        this.pending = new Array();
    },

    /**
     * WILDCARD
     */
    WILDCARD: WILDCARD,

    /**
     * Place a tuple into tuple space, executing any pending takes.
     *
     * @param {Object} tuple
     */
    write : function ( tuple )
    {
        for ( var i = 0; i < this.pending.length; i++ )
        {
            var p = this.pending[i];
            if ( match( p.template, tuple ) )
            {
                this.pending.splice( p, 1 );
                p.ontake( tuple );
                return;
            }
        }
        this.tupleList.push( tuple );
    },

    /**
     * Take a tuple from space, if one is present.
     * If not, record the take as pending.
     *
     * When the tuple is taken, ontake is called.
     *
     * @param {Object} takerequest.template
     * @param {Function} takerequest.ontake
     * @param {int} takerequest.priority (optional), defaults to 100
     */
    take : function ( takerequest )
    {
        for ( var i = 0; i < this.tupleList.length; i++ ) {
            var tuple = this.tupleList[i];
            if ( match(takerequest.template, tuple)) {
                this.tupleList.splice( i, 1 );
                takerequest.ontake(tuple);
                return;
            }
        }
        if ( takerequest.priority === undefined )
        {
            takerequest.priority = 100;
        }
        this.pending.push( takerequest );
        this.pending.sort( sortByPriority );
    },

    /**
     * Attempt to read a matching tuple based on a template.
     *
     * @param {Object} tuple if a matching tuple is present, null otherwise
     */
    read : function( template )
    {
        for ( var i = 0; i < this.tupleList.length; i++ ) {
            var tuple = this.tupleList[i];
            if ( match(template, tuple)) {
                return tuple;
            }
        }
        return null; 
    }
});

}) ();

