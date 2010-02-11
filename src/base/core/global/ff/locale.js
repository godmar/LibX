
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */
libx.locale.bd.StringBundle = libx.core.Class.create ( 
/** @lends libx.locale.bd.StringBundle */ {

	initialize : function ( filename ) {
		var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]  
	            .getService(Components.interfaces.nsIStringBundleService);
		this.bundle = stringBundleService.createBundle(filename);
	},
	/**
	 *	Returns a string with specified name
	 *	@param {String} name of property
	 *	@param {String[]} additional arguments
	 *	@return {String} Formatted property
	 */
	getFormattedString : function ( name, args ) {
		return this.bundle.formatStringFromName ( name, args, args.length );
	},
	/**
	 *	Returns a formatted property string
	 *	@param {String} name of property
	 *	@return {String} property
	 */
	getString : function ( name ) {
		return this.bundle.GetStringFromName ( name );
	}
} );
