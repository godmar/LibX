$(document).ready ( function () {
	$('.myClasseList').treeview();
	$('a').each ( function ( i, elem ) {
		alert ( elem );
			$(elem).attr ( 'target', 'classFrame' );
		} );
} );
