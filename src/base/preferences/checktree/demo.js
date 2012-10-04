$(document).ready(function(){
	$("ul.checktree").checkTree({
		/*
		// You can add callbacks to the expand, collapse, check, uncheck, and  halfcheck
		// events of the tree. The element you use as the argument is the LI element of
		// the object that fired the event.
		onExpand: function(el) {
			console.log("expanded ", el.find("label:first").text());
		},
		onCollapse: function(el) {
			console.log("collapsed ", el.find("label:first").text());
		},
		onCheck: function(el) {
			console.log("checked ", el.find("label:first").text());
		},
		onUnCheck: function(el) {
			console.log("un checked ", el.find("label:first").text());
		},
		onHalfCheck: function(el) {
			console.log("half checked ", el.find("label:first").text());
		}*/
		/*
		// You can set the labelAction variable to either "check" or "expand" 
		// to change what happens when you click on the label item.
		// The default is expand, which expands the tree. Check will toggle
		// the checked state of the items.
		labelAction: "expand"
		*/
		/*
		// You can also change what happens when you hover over a label (over and out)
		onLabelHoverOver: function(el) { alert("You hovered over " + el.text()); },
		onLabelHoverOut: function(el) { alert("You hovered out of " + el.text()); }
		*/
	});
});
