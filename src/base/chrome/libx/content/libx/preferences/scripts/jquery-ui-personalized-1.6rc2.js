/*
 * jQuery UI 1.6rc2

 *
 * Copyright (c) 2008 Paul Bakaus (ui.jquery.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
;(function($) {

/** jQuery core modifications and additions **/

var _remove = $.fn.remove;
$.fn.remove = function() {
	$("*", this).add(this).triggerHandler("remove");
	return _remove.apply(this, arguments );
};

function isVisible(element) {
	function checkStyles(element) {
		var style = element.style;
		return (style.display != 'none' && style.visibility != 'hidden');
	}
	
	var visible = checkStyles(element);
	
	(visible && $.each($.dir(element, 'parentNode'), function() {
		return (visible = checkStyles(this));
	}));
	
	return visible;
}

$.extend($.expr[':'], {
	data: function(a, i, m) {
		return $.data(a, m[3]);
	},
	
	// TODO: add support for object, area
	tabbable: function(a, i, m) {
		var nodeName = a.nodeName.toLowerCase();
		
		return (
			// in tab order
			a.tabIndex >= 0 &&
			
			( // filter node types that participate in the tab order
				
				// anchor tag
				('a' == nodeName && a.href) ||
				
				// enabled form element
				(/input|select|textarea|button/.test(nodeName) &&
					'hidden' != a.type && !a.disabled)
			) &&
			
			// visible on page
			isVisible(a)
		);
	}
});

$.keyCode = {
	BACKSPACE: 8,
	CAPS_LOCK: 20,
	COMMA: 188,
	CONTROL: 17,
	DELETE: 46,
	DOWN: 40,
	END: 35,
	ENTER: 13,
	ESCAPE: 27,
	HOME: 36,
	INSERT: 45,
	LEFT: 37,
	NUMPAD_ADD: 107,
	NUMPAD_DECIMAL: 110,
	NUMPAD_DIVIDE: 111,
	NUMPAD_ENTER: 108,
	NUMPAD_MULTIPLY: 106,
	NUMPAD_SUBTRACT: 109,
	PAGE_DOWN: 34,
	PAGE_UP: 33,
	PERIOD: 190,
	RIGHT: 39,
	SHIFT: 16,
	SPACE: 32,
	TAB: 9,
	UP: 38
};

// $.widget is a factory to create jQuery plugins
// taking some boilerplate code out of the plugin code
// created by Scott González and Jörn Zaefferer
function getter(namespace, plugin, method, args) {
	function getMethods(type) {
		var methods = $[namespace][plugin][type] || [];
		return (typeof methods == 'string' ? methods.split(/,?\s+/) : methods);
	}
	
	var methods = getMethods('getter');
	if (args.length == 1 && typeof args[0] == 'string') {
		methods = methods.concat(getMethods('getterSetter'));
	}
	return ($.inArray(method, methods) != -1);
}

$.widget = function(name, prototype) {
	var namespace = name.split(".")[0];
	name = name.split(".")[1];
	
	// create plugin method
	$.fn[name] = function(options) {
		var isMethodCall = (typeof options == 'string'),
			args = Array.prototype.slice.call(arguments, 1);
		
		// prevent calls to internal methods
		if (isMethodCall && options.substring(0, 1) == '_') {
			return this;
		}
		
		// handle getter methods
		if (isMethodCall && getter(namespace, name, options, args)) {
			var instance = $.data(this[0], name);
			return (instance ? instance[options].apply(instance, args)
				: undefined);
		}
		
		// handle initialization and non-getter methods
		return this.each(function() {
			var instance = $.data(this, name);
			
			// constructor
			(!instance && !isMethodCall &&
				$.data(this, name, new $[namespace][name](this, options)));
			
			// method call
			(instance && isMethodCall && $.isFunction(instance[options]) &&
				instance[options].apply(instance, args));
		});
	};
	
	// create widget constructor
	$[namespace][name] = function(element, options) {
		var self = this;
		
		this.widgetName = name;
		this.widgetEventPrefix = $[namespace][name].eventPrefix || name;
		this.widgetBaseClass = namespace + '-' + name;
		
		this.options = $.extend({},
			$.widget.defaults,
			$[namespace][name].defaults,
			$.metadata && $.metadata.get(element)[name],
			options);
		
		this.element = $(element)
			.bind('setData.' + name, function(e, key, value) {
				return self._setData(key, value);
			})
			.bind('getData.' + name, function(e, key) {
				return self._getData(key);
			})
			.bind('remove', function() {
				return self.destroy();
			});
		
		this._init();
	};
	
	// add widget prototype
	$[namespace][name].prototype = $.extend({}, $.widget.prototype, prototype);
	
	// TODO: merge getter and getterSetter properties from widget prototype
	// and plugin prototype
	$[namespace][name].getterSetter = 'option';
};

$.widget.prototype = {
	_init: function() {},
	destroy: function() {
		this.element.removeData(this.widgetName);
	},
	
	option: function(key, value) {
		var options = key,
			self = this;
		
		if (typeof key == "string") {
			if (value === undefined) {
				return this._getData(key);
			}
			options = {};
			options[key] = value;
		}
		
		$.each(options, function(key, value) {
			self._setData(key, value);
		});
	},
	_getData: function(key) {
		return this.options[key];
	},
	_setData: function(key, value) {
		this.options[key] = value;
		
		if (key == 'disabled') {
			this.element[value ? 'addClass' : 'removeClass'](
				this.widgetBaseClass + '-disabled');
		}
	},
	
	enable: function() {
		this._setData('disabled', false);
	},
	disable: function() {
		this._setData('disabled', true);
	},
	
	_trigger: function(type, e, data) {
		var eventName = (type == this.widgetEventPrefix
			? type : this.widgetEventPrefix + type);
		e = e  || $.event.fix({ type: eventName, target: this.element[0] });
		return this.element.triggerHandler(eventName, [e, data], this.options[type]);
	}
};

$.widget.defaults = {
	disabled: false
};


/** jQuery UI core **/

$.ui = {
	plugin: {
		add: function(module, option, set) {
			var proto = $.ui[module].prototype;
			for(var i in set) {
				proto.plugins[i] = proto.plugins[i] || [];
				proto.plugins[i].push([option, set[i]]);
			}
		},
		call: function(instance, name, args) {
			var set = instance.plugins[name];
			if(!set) { return; }
			
			for (var i = 0; i < set.length; i++) {
				if (instance.options[set[i][0]]) {
					set[i][1].apply(instance.element, args);
				}
			}
		}	
	},
	cssCache: {},
	css: function(name) {
		if ($.ui.cssCache[name]) { return $.ui.cssCache[name]; }
		var tmp = $('<div class="ui-gen">').addClass(name).css({position:'absolute', top:'-5000px', left:'-5000px', display:'block'}).appendTo('body');
		
		//if (!$.browser.safari)
			//tmp.appendTo('body'); 
		
		//Opera and Safari set width and height to 0px instead of auto
		//Safari returns rgba(0,0,0,0) when bgcolor is not set
		$.ui.cssCache[name] = !!(
			(!(/auto|default/).test(tmp.css('cursor')) || (/^[1-9]/).test(tmp.css('height')) || (/^[1-9]/).test(tmp.css('width')) || 
			!(/none/).test(tmp.css('backgroundImage')) || !(/transparent|rgba\(0, 0, 0, 0\)/).test(tmp.css('backgroundColor')))
		);
		try { $('body').get(0).removeChild(tmp.get(0));	} catch(e){}
		return $.ui.cssCache[name];
	},
	disableSelection: function(el) {
		return $(el)
			.attr('unselectable', 'on')
			.css('MozUserSelect', 'none')
			.bind('selectstart.ui', function() { return false; });
	},
	enableSelection: function(el) {
		return $(el)
			.attr('unselectable', 'off')
			.css('MozUserSelect', '')
			.unbind('selectstart.ui');
	},
	hasScroll: function(e, a) {
		
		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ($(e).css('overflow') == 'hidden') { return false; }
		
		var scroll = (a && a == 'left') ? 'scrollLeft' : 'scrollTop',
			has = false;
		
		if (e[scroll] > 0) { return true; }
		
		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		e[scroll] = 1;
		has = (e[scroll] > 0);
		e[scroll] = 0;
		return has;
	}
};


/** Mouse Interaction Plugin **/

$.ui.mouse = {
	_mouseInit: function() {
		var self = this;
	
		this.element.bind('mousedown.'+this.widgetName, function(e) {
			return self._mouseDown(e);
		});
		
		// Prevent text selection in IE
		if ($.browser.msie) {
			this._mouseUnselectable = this.element.attr('unselectable');
			this.element.attr('unselectable', 'on');
		}
		
		this.started = false;
	},
	
	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind('.'+this.widgetName);
		
		// Restore text selection in IE
		($.browser.msie
			&& this.element.attr('unselectable', this._mouseUnselectable));
	},
	
	_mouseDown: function(e) {
		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(e));
		
		this._mouseDownEvent = e;
		
		var self = this,
			btnIsLeft = (e.which == 1),
			elIsCancel = (typeof this.options.cancel == "string" ? $(e.target).parents().add(e.target).filter(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(e)) {
			return true;
		}
		
		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				self.mouseDelayMet = true;
			}, this.options.delay);
		}
		
		if (this._mouseDistanceMet(e) && this._mouseDelayMet(e)) {
			this._mouseStarted = (this._mouseStart(e) !== false);
			if (!this._mouseStarted) {
				e.preventDefault();
				return true;
			}
		}
		
		// these delegates are required to keep context
		this._mouseMoveDelegate = function(e) {
			return self._mouseMove(e);
		};
		this._mouseUpDelegate = function(e) {
			return self._mouseUp(e);
		};
		$(document)
			.bind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.bind('mouseup.'+this.widgetName, this._mouseUpDelegate);
		
		return false;
	},
	
	_mouseMove: function(e) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.browser.msie && !e.button) {
			return this._mouseUp(e);
		}
		
		if (this._mouseStarted) {
			this._mouseDrag(e);
			return false;
		}
		
		if (this._mouseDistanceMet(e) && this._mouseDelayMet(e)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, e) !== false);
			(this._mouseStarted ? this._mouseDrag(e) : this._mouseUp(e));
		}
		
		return !this._mouseStarted;
	},
	
	_mouseUp: function(e) {
		$(document)
			.unbind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.unbind('mouseup.'+this.widgetName, this._mouseUpDelegate);
		
		if (this._mouseStarted) {
			this._mouseStarted = false;
			this._mouseStop(e);
		}
		
		return false;
	},
	
	_mouseDistanceMet: function(e) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - e.pageX),
				Math.abs(this._mouseDownEvent.pageY - e.pageY)
			) >= this.options.distance
		);
	},
	
	_mouseDelayMet: function(e) {
		return this.mouseDelayMet;
	},
	
	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(e) {},
	_mouseDrag: function(e) {},
	_mouseStop: function(e) {},
	_mouseCapture: function(e) { return true; }
};

$.ui.mouse.defaults = {
	cancel: null,
	distance: 1,
	delay: 0
};

})(jQuery);
/*
 * jQuery UI Draggable 1.6rc2

 *
 * Copyright (c) 2008 Paul Bakaus
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *	ui.core.js
 */
(function($) {

$.widget("ui.draggable", $.extend({}, $.ui.mouse, {
	
	getHandle: function(e) {

		var handle = !this.options.handle || !$(this.options.handle, this.element).length ? true : false;
		$(this.options.handle, this.element)
			.find("*")
			.andSelf()
			.each(function() {
				if(this == e.target) handle = true;
			});
		
		return handle;

	},
	
	createHelper: function() {

		var o = this.options;
		var helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [e])) : (o.helper == 'clone' ? this.element.clone() : this.element);
		
		if(!helper.parents('body').length)
			helper.appendTo((o.appendTo == 'parent' ? this.element[0].parentNode : o.appendTo));
			
		if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
			helper.css("position", "absolute");
			
		return helper;
		
	},
	
	
	_init: function() {
		
		if (this.options.helper == 'original' && !(/^(?:r|a|f)/).test(this.element.css("position")))
			this.element[0].style.position = 'relative';
		
		(this.options.cssNamespace && this.element.addClass(this.options.cssNamespace+"-draggable"));
		(this.options.disabled && this.element.addClass('ui-draggable-disabled'));
		
		this._mouseInit();
		
	},

	_mouseCapture: function(e) {

		var o = this.options;
		
		if (this.helper || o.disabled || $(e.target).is('.ui-resizable-handle'))
			return false;
			
		//Quit if we're not on a valid handle
		this.handle = this.getHandle(e);
		if (!this.handle)
			return false;
		
		return true;

	},

	_mouseStart: function(e) {
		
		var o = this.options;
		
		//Create and append the visible helper
		this.helper = this.createHelper();
		
		//If ddmanager is used for droppables, set the global draggable
		if($.ui.ddmanager)
			$.ui.ddmanager.current = this;
		
		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */
		
		this.margins = {																				//Cache the margins
			left: (parseInt(this.element.css("marginLeft"),10) || 0),
			top: (parseInt(this.element.css("marginTop"),10) || 0)
		};		
		
		this.cssPosition = this.helper.css("position");													//Store the helper's css position
		this.offset = this.element.offset();															//The element's absolute position on the page
		this.offset = {																					//Substract the margins from the element's absolute offset
			top: this.offset.top - this.margins.top,
			left: this.offset.left - this.margins.left
		};
		
		this.offset.click = {																			//Where the click happened, relative to the element
			left: e.pageX - this.offset.left,
			top: e.pageY - this.offset.top
		};

		//Calling this method cached the next parents that have scrollTop / scrollLeft attached
		this.cacheScrollParents();
		
		
		this.offsetParent = this.helper.offsetParent(); var po = this.offsetParent.offset();			//Get the offsetParent and cache its position
		if(this.offsetParent[0] == document.body && $.browser.mozilla) po = { top: 0, left: 0 };		//Ugly FF3 fix
		this.offset.parent = {																			//Store its position plus border
			top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"),10) || 0),
			left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"),10) || 0)
		};
		
		//This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
		if(this.cssPosition == "relative") {
			var p = this.element.position();
			this.offset.relative = {
				top: p.top - (parseInt(this.helper.css("top"),10) || 0) + this.scrollTopParent.scrollTop(),
				left: p.left - (parseInt(this.helper.css("left"),10) || 0) + this.scrollLeftParent.scrollLeft()
			};
		} else {
			this.offset.relative = { top: 0, left: 0 };
		}
		
		//Generate the original position
		this.originalPosition = this._generatePosition(e);
		
		//Cache the helper size
		this.cacheHelperProportions();
		
		//Adjust the mouse offset relative to the helper if 'cursorAt' is supplied
		if(o.cursorAt)
			this.adjustOffsetFromHelper(o.cursorAt);

		//Cache later used stuff
		$.extend(this, {
			PAGEY_INCLUDES_SCROLL: (this.cssPosition == "absolute" && (!this.scrollTopParent[0].tagName || (/(html|body)/i).test(this.scrollTopParent[0].tagName))),
			PAGEX_INCLUDES_SCROLL: (this.cssPosition == "absolute" && (!this.scrollLeftParent[0].tagName || (/(html|body)/i).test(this.scrollLeftParent[0].tagName))),
			OFFSET_PARENT_NOT_SCROLL_PARENT_Y: this.scrollTopParent[0] != this.offsetParent[0] && !(this.scrollTopParent[0] == document && (/(body|html)/i).test(this.offsetParent[0].tagName)),
			OFFSET_PARENT_NOT_SCROLL_PARENT_X: this.scrollLeftParent[0] != this.offsetParent[0] && !(this.scrollLeftParent[0] == document && (/(body|html)/i).test(this.offsetParent[0].tagName))
		});
		
		if(o.containment)
			this.setContainment();

		
		//Call plugins and callbacks
		this._propagate("start", e);
		
		//Recache the helper size
		this.cacheHelperProportions();
		
		//Prepare the droppable offsets
		if ($.ui.ddmanager && !o.dropBehaviour)
			$.ui.ddmanager.prepareOffsets(this, e);
		
		this.helper.addClass("ui-draggable-dragging");
		this._mouseDrag(e); //Execute the drag once - this causes the helper not to be visible before getting its correct position
		return true;
	},
	
	cacheScrollParents: function() {

		this.scrollTopParent = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-y'))) return el; el = el.parent(); } while (el[0].parentNode);
			return $(document);
		}(this.helper);
		this.scrollLeftParent = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-x'))) return el; el = el.parent(); } while (el[0].parentNode);
			return $(document);
		}(this.helper);

	},
	
	adjustOffsetFromHelper: function(obj) {
		if(obj.left != undefined) this.offset.click.left = obj.left + this.margins.left;
		if(obj.right != undefined) this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
		if(obj.top != undefined) this.offset.click.top = obj.top + this.margins.top;
		if(obj.bottom != undefined) this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
	},
	
	cacheHelperProportions: function() {
		this.helperProportions = {
			width: this.helper.outerWidth(),
			height: this.helper.outerHeight()
		};
	},
	
	setContainment: function() {

		var o = this.options;
		if(o.containment == 'parent') o.containment = this.helper[0].parentNode;
		if(o.containment == 'document' || o.containment == 'window') this.containment = [
			0 - this.offset.relative.left - this.offset.parent.left,
			0 - this.offset.relative.top - this.offset.parent.top,
			$(o.containment == 'document' ? document : window).width() - this.offset.relative.left - this.offset.parent.left - this.helperProportions.width - this.margins.left - (parseInt(this.element.css("marginRight"),10) || 0),
			($(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.offset.relative.top - this.offset.parent.top - this.helperProportions.height - this.margins.top - (parseInt(this.element.css("marginBottom"),10) || 0)
		];
		
		if(!(/^(document|window|parent)$/).test(o.containment)) {
			var ce = $(o.containment)[0];
			var co = $(o.containment).offset();
			var over = ($(ce).css("overflow") != 'hidden');
			
			this.containment = [
				co.left + (parseInt($(ce).css("borderLeftWidth"),10) || 0) - this.offset.relative.left - this.offset.parent.left,
				co.top + (parseInt($(ce).css("borderTopWidth"),10) || 0) - this.offset.relative.top - this.offset.parent.top,
				co.left+(over ? Math.max(ce.scrollWidth,ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"),10) || 0) - this.offset.relative.left - this.offset.parent.left - this.helperProportions.width - this.margins.left - (parseInt(this.element.css("marginRight"),10) || 0),
				co.top+(over ? Math.max(ce.scrollHeight,ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"),10) || 0) - this.offset.relative.top - this.offset.parent.top - this.helperProportions.height - this.margins.top - (parseInt(this.element.css("marginBottom"),10) || 0)
			];
		}

	},
	
	
	_convertPositionTo: function(d, pos) {

		if(!pos) pos = this.position;
		var mod = d == "absolute" ? 1 : -1;

		return {
			top: (
				pos.top																	// the calculated relative position
				+ this.offset.relative.top	* mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.top * mod											// The offsetParent's offset without borders (offset + border)
				- (this.cssPosition == "fixed" || this.PAGEY_INCLUDES_SCROLL || this.OFFSET_PARENT_NOT_SCROLL_PARENT_Y ? 0 : this.scrollTopParent.scrollTop()) * mod	// The offsetParent's scroll position, not if the element is fixed
				+ (this.cssPosition == "fixed" ? $(document).scrollTop() : 0) * mod
				+ this.margins.top * mod												//Add the margin (you don't want the margin counting in intersection methods)
			),
			left: (
				pos.left																// the calculated relative position
				+ this.offset.relative.left	* mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.left * mod											// The offsetParent's offset without borders (offset + border)
				- (this.cssPosition == "fixed" || this.PAGEX_INCLUDES_SCROLL || this.OFFSET_PARENT_NOT_SCROLL_PARENT_X ? 0 : this.scrollLeftParent.scrollLeft()) * mod	// The offsetParent's scroll position, not if the element is fixed
				+ (this.cssPosition == "fixed" ? $(document).scrollLeft() : 0) * mod
				+ this.margins.left * mod												//Add the margin (you don't want the margin counting in intersection methods)
			)
		};
	},
	_generatePosition: function(e) {

		var o = this.options;
		var position = {
			top: (
				e.pageY																	// The absolute mouse position
				- this.offset.click.top													// Click offset (relative to the element)
				- this.offset.relative.top												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.top												// The offsetParent's offset without borders (offset + border)
				+ (this.cssPosition == "fixed" || this.PAGEY_INCLUDES_SCROLL || this.OFFSET_PARENT_NOT_SCROLL_PARENT_Y ? 0 : this.scrollTopParent.scrollTop())	// The offsetParent's scroll position, not if the element is fixed
				- (this.cssPosition == "fixed" ? $(document).scrollTop() : 0)
			),
			left: (
				e.pageX																	// The absolute mouse position
				- this.offset.click.left												// Click offset (relative to the element)
				- this.offset.relative.left												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.left												// The offsetParent's offset without borders (offset + border)
				+ (this.cssPosition == "fixed" || this.PAGEX_INCLUDES_SCROLL || this.OFFSET_PARENT_NOT_SCROLL_PARENT_X ? 0 : this.scrollLeftParent.scrollLeft())	// The offsetParent's scroll position, not if the element is fixed
				- (this.cssPosition == "fixed" ? $(document).scrollLeft() : 0)
			)
		};
	
		if(!this.originalPosition) return position;										//If we are not dragging yet, we won't check for options
		
		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */
		if(this.containment) {
			if(position.left < this.containment[0]) position.left = this.containment[0];
			if(position.top < this.containment[1]) position.top = this.containment[1];
			if(position.left > this.containment[2]) position.left = this.containment[2];
			if(position.top > this.containment[3]) position.top = this.containment[3];
		}
		
		if(o.grid) {
			var top = this.originalPosition.top + Math.round((position.top - this.originalPosition.top) / o.grid[1]) * o.grid[1];
			position.top = this.containment ? (!(top < this.containment[1] || top > this.containment[3]) ? top : (!(top < this.containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;
			
			var left = this.originalPosition.left + Math.round((position.left - this.originalPosition.left) / o.grid[0]) * o.grid[0];
			position.left = this.containment ? (!(left < this.containment[0] || left > this.containment[2]) ? left : (!(left < this.containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
		}
		
		return position;
	},
	_mouseDrag: function(e) {
	
		//Compute the helpers position
		this.position = this._generatePosition(e);
		this.positionAbs = this._convertPositionTo("absolute");
		
		//Call plugins and callbacks and use the resulting position if something is returned		
		this.position = this._propagate("drag", e) || this.position;
	
		if(!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left+'px';
		if(!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top+'px';
		if($.ui.ddmanager) $.ui.ddmanager.drag(this, e);
		
		return false;
	},
	_mouseStop: function(e) {
		
		//If we are using droppables, inform the manager about the drop
		var dropped = false;
		if ($.ui.ddmanager && !this.options.dropBehaviour)
			var dropped = $.ui.ddmanager.drop(this, e);		
		
		if((this.options.revert == "invalid" && !dropped) || (this.options.revert == "valid" && dropped) || this.options.revert === true || ($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
			var self = this;
			$(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10) || 500, function() {
				self._propagate("stop", e);
				self._clear();
			});
		} else {
			this._propagate("stop", e);
			this._clear();
		}
		
		return false;
	},
	_clear: function() {
		this.helper.removeClass("ui-draggable-dragging");
		if(this.options.helper != 'original' && !this.cancelHelperRemoval) this.helper.remove();
		//if($.ui.ddmanager) $.ui.ddmanager.current = null;
		this.helper = null;
		this.cancelHelperRemoval = false;
	},
	
	// From now on bulk stuff - mainly helpers
	plugins: {},
	uiHash: function(e) {
		return {
			helper: this.helper,
			position: this.position,
			absolutePosition: this.positionAbs,
			options: this.options			
		};
	},
	_propagate: function(n,e) {
		$.ui.plugin.call(this, n, [e, this.uiHash()]);
		if(n == "drag") this.positionAbs = this._convertPositionTo("absolute"); //The absolute position has to be recalculated after plugins
		return this.element.triggerHandler(n == "drag" ? n : "drag"+n, [e, this.uiHash()], this.options[n]);
	},
	destroy: function() {
		if(!this.element.data('draggable')) return;
		this.element.removeData("draggable").unbind(".draggable").removeClass('ui-draggable ui-draggable-dragging ui-draggable-disabled');
		this._mouseDestroy();
	}
}));

$.extend($.ui.draggable, {
	defaults: {
		appendTo: "parent",
		axis: false,
		cancel: ":input",
		delay: 0,
		distance: 1,
		helper: "original",
		scope: "default",
		cssNamespace: "ui"
	}
});

$.ui.plugin.add("draggable", "cursor", {
	start: function(e, ui) {
		var t = $('body');
		if (t.css("cursor")) ui.options._cursor = t.css("cursor");
		t.css("cursor", ui.options.cursor);
	},
	stop: function(e, ui) {
		if (ui.options._cursor) $('body').css("cursor", ui.options._cursor);
	}
});

$.ui.plugin.add("draggable", "zIndex", {
	start: function(e, ui) {
		var t = $(ui.helper);
		if(t.css("zIndex")) ui.options._zIndex = t.css("zIndex");
		t.css('zIndex', ui.options.zIndex);
	},
	stop: function(e, ui) {
		if(ui.options._zIndex) $(ui.helper).css('zIndex', ui.options._zIndex);
	}
});

$.ui.plugin.add("draggable", "opacity", {
	start: function(e, ui) {
		var t = $(ui.helper);
		if(t.css("opacity")) ui.options._opacity = t.css("opacity");
		t.css('opacity', ui.options.opacity);
	},
	stop: function(e, ui) {
		if(ui.options._opacity) $(ui.helper).css('opacity', ui.options._opacity);
	}
});

$.ui.plugin.add("draggable", "iframeFix", {
	start: function(e, ui) {
		$(ui.options.iframeFix === true ? "iframe" : ui.options.iframeFix).each(function() {					
			$('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>')
			.css({
				width: this.offsetWidth+"px", height: this.offsetHeight+"px",
				position: "absolute", opacity: "0.001", zIndex: 1000
			})
			.css($(this).offset())
			.appendTo("body");
		});
	},
	stop: function(e, ui) {
		$("div.ui-draggable-iframeFix").each(function() { this.parentNode.removeChild(this); }); //Remove frame helpers	
	}
});



$.ui.plugin.add("draggable", "scroll", {
	start: function(e, ui) {
		var o = ui.options;
		var i = $(this).data("draggable");
		o.scrollSensitivity	= o.scrollSensitivity || 20;
		o.scrollSpeed		= o.scrollSpeed || 20;
		
		i.overflowY = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-y'))) return el; el = el.parent(); } while (el[0].parentNode);
			return $(document);
		}(this);
		i.overflowX = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-x'))) return el; el = el.parent(); } while (el[0].parentNode);
			return $(document);
		}(this);
		
		if(i.overflowY[0] != document && i.overflowY[0].tagName != 'HTML') i.overflowYOffset = i.overflowY.offset();
		if(i.overflowX[0] != document && i.overflowX[0].tagName != 'HTML') i.overflowXOffset = i.overflowX.offset();
		
	},
	drag: function(e, ui) {
		
		var o = ui.options, scrolled = false;
		var i = $(this).data("draggable");
		
		if(i.overflowY[0] != document && i.overflowY[0].tagName != 'HTML') {
			if((i.overflowYOffset.top + i.overflowY[0].offsetHeight) - e.pageY < o.scrollSensitivity)
				i.overflowY[0].scrollTop = scrolled = i.overflowY[0].scrollTop + o.scrollSpeed;
			if(e.pageY - i.overflowYOffset.top < o.scrollSensitivity)
				i.overflowY[0].scrollTop = scrolled = i.overflowY[0].scrollTop - o.scrollSpeed;
							
		} else {
			if(e.pageY - $(document).scrollTop() < o.scrollSensitivity)
				scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
			if($(window).height() - (e.pageY - $(document).scrollTop()) < o.scrollSensitivity)
				scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
		}
		
		if(i.overflowX[0] != document && i.overflowX[0].tagName != 'HTML') {
			if((i.overflowXOffset.left + i.overflowX[0].offsetWidth) - e.pageX < o.scrollSensitivity)
				i.overflowX[0].scrollLeft = scrolled = i.overflowX[0].scrollLeft + o.scrollSpeed;
			if(e.pageX - i.overflowXOffset.left < o.scrollSensitivity)
				i.overflowX[0].scrollLeft = scrolled = i.overflowX[0].scrollLeft - o.scrollSpeed;
		} else {
			if(e.pageX - $(document).scrollLeft() < o.scrollSensitivity)
				scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed);
			if($(window).width() - (e.pageX - $(document).scrollLeft()) < o.scrollSensitivity)
				scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed);
		}
		
		if(scrolled !== false)
			$.ui.ddmanager.prepareOffsets(i, e);
		
	}
});


$.ui.plugin.add("draggable", "snap", {
	start: function(e, ui) {
		
		var inst = $(this).data("draggable");
		inst.snapElements = [];

		$(ui.options.snap.constructor != String ? ( ui.options.snap.items || ':data(draggable)' ) : ui.options.snap).each(function() {
			var $t = $(this); var $o = $t.offset();
			if(this != inst.element[0]) inst.snapElements.push({
				item: this,
				width: $t.outerWidth(), height: $t.outerHeight(),
				top: $o.top, left: $o.left
			});
		});
		
	},
	drag: function(e, ui) {
	
		var inst = $(this).data("draggable");
		var d = ui.options.snapTolerance || 20;

		var x1 = ui.absolutePosition.left, x2 = x1 + inst.helperProportions.width,
			y1 = ui.absolutePosition.top, y2 = y1 + inst.helperProportions.height;
		
		for (var i = inst.snapElements.length - 1; i >= 0; i--){
			
			var l = inst.snapElements[i].left, r = l + inst.snapElements[i].width, 
				t = inst.snapElements[i].top, b = t + inst.snapElements[i].height;
		
			//Yes, I know, this is insane ;)
			if(!((l-d < x1 && x1 < r+d && t-d < y1 && y1 < b+d) || (l-d < x1 && x1 < r+d && t-d < y2 && y2 < b+d) || (l-d < x2 && x2 < r+d && t-d < y1 && y1 < b+d) || (l-d < x2 && x2 < r+d && t-d < y2 && y2 < b+d))) {
				if(inst.snapElements[i].snapping) (inst.options.snap.release && inst.options.snap.release.call(inst.element, null, $.extend(inst.uiHash(), { snapItem: inst.snapElements[i].item })));
				inst.snapElements[i].snapping = false;
				continue;
			}
		
			if(ui.options.snapMode != 'inner') {
				var ts = Math.abs(t - y2) <= d;
				var bs = Math.abs(b - y1) <= d;
				var ls = Math.abs(l - x2) <= d;
				var rs = Math.abs(r - x1) <= d;
				if(ts) ui.position.top = inst._convertPositionTo("relative", { top: t - inst.helperProportions.height, left: 0 }).top;
				if(bs) ui.position.top = inst._convertPositionTo("relative", { top: b, left: 0 }).top;
				if(ls) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l - inst.helperProportions.width }).left;
				if(rs) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r }).left;
			}
			
			var first = (ts || bs || ls || rs);
			
			if(ui.options.snapMode != 'outer') {
				var ts = Math.abs(t - y1) <= d;
				var bs = Math.abs(b - y2) <= d;
				var ls = Math.abs(l - x1) <= d;
				var rs = Math.abs(r - x2) <= d;
				if(ts) ui.position.top = inst._convertPositionTo("relative", { top: t, left: 0 }).top;
				if(bs) ui.position.top = inst._convertPositionTo("relative", { top: b - inst.helperProportions.height, left: 0 }).top;
				if(ls) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l }).left;
				if(rs) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r - inst.helperProportions.width }).left;
			}
			
			if(!inst.snapElements[i].snapping && (ts || bs || ls || rs || first))
				(inst.options.snap.snap && inst.options.snap.snap.call(inst.element, null, $.extend(inst.uiHash(), { snapItem: inst.snapElements[i].item })));
			inst.snapElements[i].snapping = (ts || bs || ls || rs || first);
			
		};

	}
});

$.ui.plugin.add("draggable", "connectToSortable", {
	start: function(e,ui) {
	
		var inst = $(this).data("draggable");
		inst.sortables = [];
		$(ui.options.connectToSortable).each(function() {
			if($.data(this, 'sortable')) {
				var sortable = $.data(this, 'sortable');
				inst.sortables.push({
					instance: sortable,
					shouldRevert: sortable.options.revert
				});
				sortable._refreshItems();	//Do a one-time refresh at start to refresh the containerCache	
				sortable._propagate("activate", e, inst);
			}
		});

	},
	stop: function(e,ui) {
		
		//If we are still over the sortable, we fake the stop event of the sortable, but also remove helper
		var inst = $(this).data("draggable");
		
		$.each(inst.sortables, function() {
			if(this.instance.isOver) {
				this.instance.isOver = 0;
				inst.cancelHelperRemoval = true; //Don't remove the helper in the draggable instance
				this.instance.cancelHelperRemoval = false; //Remove it in the sortable instance (so sortable plugins like revert still work)
				if(this.shouldRevert) this.instance.options.revert = true; //revert here
				this.instance._mouseStop(e);
				
				//Also propagate receive event, since the sortable is actually receiving a element
				this.instance.element.triggerHandler("sortreceive", [e, $.extend(this.instance.ui(), { sender: inst.element })], this.instance.options["receive"]);

				this.instance.options.helper = this.instance.options._helper;
			} else {
				this.instance._propagate("deactivate", e, inst);
			}

		});
		
	},
	drag: function(e,ui) {

		var inst = $(this).data("draggable"), self = this;
		
		var checkPos = function(o) {
				
			var l = o.left, r = l + o.width,
				t = o.top, b = t + o.height;

			return (l < (this.positionAbs.left + this.offset.click.left) && (this.positionAbs.left + this.offset.click.left) < r
					&& t < (this.positionAbs.top + this.offset.click.top) && (this.positionAbs.top + this.offset.click.top) < b);				
		};
		
		$.each(inst.sortables, function(i) {

			if(checkPos.call(inst, this.instance.containerCache)) {

				//If it intersects, we use a little isOver variable and set it once, so our move-in stuff gets fired only once
				if(!this.instance.isOver) {
					this.instance.isOver = 1;

					//Now we fake the start of dragging for the sortable instance,
					//by cloning the list group item, appending it to the sortable and using it as inst.currentItem
					//We can then fire the start event of the sortable with our passed browser event, and our own helper (so it doesn't create a new one)
					this.instance.currentItem = $(self).clone().appendTo(this.instance.element).data("sortable-item", true);
					this.instance.options._helper = this.instance.options.helper; //Store helper option to later restore it
					this.instance.options.helper = function() { return ui.helper[0]; };
				
					e.target = this.instance.currentItem[0];
					this.instance._mouseCapture(e, true);
					this.instance._mouseStart(e, true, true);

					//Because the browser event is way off the new appended portlet, we modify a couple of variables to reflect the changes
					this.instance.offset.click.top = inst.offset.click.top;
					this.instance.offset.click.left = inst.offset.click.left;
					this.instance.offset.parent.left -= inst.offset.parent.left - this.instance.offset.parent.left;
					this.instance.offset.parent.top -= inst.offset.parent.top - this.instance.offset.parent.top;
					
					inst._propagate("toSortable", e);
				
				}
				
				//Provided we did all the previous steps, we can fire the drag event of the sortable on every draggable drag, when it intersects with the sortable
				if(this.instance.currentItem) this.instance._mouseDrag(e);
				
			} else {
				
				//If it doesn't intersect with the sortable, and it intersected before,
				//we fake the drag stop of the sortable, but make sure it doesn't remove the helper by using cancelHelperRemoval
				if(this.instance.isOver) {
					this.instance.isOver = 0;
					this.instance.cancelHelperRemoval = true;
					this.instance.options.revert = false; //No revert here
					this.instance._mouseStop(e, true);
					this.instance.options.helper = this.instance.options._helper;
					
					//Now we remove our currentItem, the list group clone again, and the placeholder, and animate the helper back to it's original size
					this.instance.currentItem.remove();
					if(this.instance.placeholder) this.instance.placeholder.remove();
					
					inst._propagate("fromSortable", e);
				}
				
			};

		});

	}
});

$.ui.plugin.add("draggable", "stack", {
	start: function(e,ui) {
		var group = $.makeArray($(ui.options.stack.group)).sort(function(a,b) {
			return (parseInt($(a).css("zIndex"),10) || ui.options.stack.min) - (parseInt($(b).css("zIndex"),10) || ui.options.stack.min);
		});
		
		$(group).each(function(i) {
			this.style.zIndex = ui.options.stack.min + i;
		});
		
		this[0].style.zIndex = ui.options.stack.min + group.length;
	}
});

})(jQuery);
/*
 * jQuery UI Resizable 1.6rc2

 *
 * Copyright (c) 2008 Paul Bakaus
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * http://docs.jquery.com/UI/Resizables
 *
 * Depends:
 *	ui.core.js
 */
(function($) {

$.widget("ui.resizable", $.extend({}, $.ui.mouse, {
	_init: function() {

		var self = this, o = this.options;

		var elpos = this.element.css('position');
		
		this.originalElement = this.element;
		
		// simulate .ui-resizable { position: relative; }
		this.element.addClass("ui-resizable").css({ position: /static/.test(elpos) ? 'relative' : elpos });
		
		$.extend(o, {
			_aspectRatio: !!(o.aspectRatio),
			helper: o.helper || o.ghost || o.animate ? o.helper || 'proxy' : null,
			knobHandles: o.knobHandles === true ? 'ui-resizable-knob-handle' : o.knobHandles
		});
		
		//Default Theme
		var aBorder = '1px solid #DEDEDE';
		
		o.defaultTheme = {
			'ui-resizable': { display: 'block' },
			'ui-resizable-handle': { position: 'absolute', background: '#F2F2F2', fontSize: '0.1px' },
			'ui-resizable-n': { cursor: 'n-resize', height: '4px', left: '0px', right: '0px', borderTop: aBorder },
			'ui-resizable-s': { cursor: 's-resize', height: '4px', left: '0px', right: '0px', borderBottom: aBorder },
			'ui-resizable-e': { cursor: 'e-resize', width: '4px', top: '0px', bottom: '0px', borderRight: aBorder },
			'ui-resizable-w': { cursor: 'w-resize', width: '4px', top: '0px', bottom: '0px', borderLeft: aBorder },
			'ui-resizable-se': { cursor: 'se-resize', width: '4px', height: '4px', borderRight: aBorder, borderBottom: aBorder },
			'ui-resizable-sw': { cursor: 'sw-resize', width: '4px', height: '4px', borderBottom: aBorder, borderLeft: aBorder },
			'ui-resizable-ne': { cursor: 'ne-resize', width: '4px', height: '4px', borderRight: aBorder, borderTop: aBorder },
			'ui-resizable-nw': { cursor: 'nw-resize', width: '4px', height: '4px', borderLeft: aBorder, borderTop: aBorder }
		};
		
		o.knobTheme = {
			'ui-resizable-handle': { background: '#F2F2F2', border: '1px solid #808080', height: '8px', width: '8px' },
			'ui-resizable-n': { cursor: 'n-resize', top: '0px', left: '45%' },
			'ui-resizable-s': { cursor: 's-resize', bottom: '0px', left: '45%' },
			'ui-resizable-e': { cursor: 'e-resize', right: '0px', top: '45%' },
			'ui-resizable-w': { cursor: 'w-resize', left: '0px', top: '45%' },
			'ui-resizable-se': { cursor: 'se-resize', right: '0px', bottom: '0px' },
			'ui-resizable-sw': { cursor: 'sw-resize', left: '0px', bottom: '0px' },
			'ui-resizable-nw': { cursor: 'nw-resize', left: '0px', top: '0px' },
			'ui-resizable-ne': { cursor: 'ne-resize', right: '0px', top: '0px' }
		};
		
		o._nodeName = this.element[0].nodeName;
		
		//Wrap the element if it cannot hold child nodes
		if(o._nodeName.match(/canvas|textarea|input|select|button|img/i)) {
			var el = this.element;
			
			//Opera fixing relative position
			if (/relative/.test(el.css('position')) && $.browser.opera)
				el.css({ position: 'relative', top: 'auto', left: 'auto' });
			
			//Create a wrapper element and set the wrapper to the new current internal element
			el.wrap(
				$('<div class="ui-wrapper"	style="overflow: hidden;"></div>').css( {
					position: el.css('position'),
					width: el.outerWidth(),
					height: el.outerHeight(),
					top: el.css('top'),
					left: el.css('left')
				})
			);
			
			var oel = this.element; this.element = this.element.parent();
			
			// store instance on wrapper
			this.element.data('resizable', this); 
			
			//Move margins to the wrapper
			this.element.css({ marginLeft: oel.css("marginLeft"), marginTop: oel.css("marginTop"),
				marginRight: oel.css("marginRight"), marginBottom: oel.css("marginBottom")
			});
			
			oel.css({ marginLeft: 0, marginTop: 0, marginRight: 0, marginBottom: 0});
			
			//Prevent Safari textarea resize
			if ($.browser.safari && o.preventDefault) oel.css('resize', 'none');
			
			o.proportionallyResize = oel.css({ position: 'static', zoom: 1, display: 'block' });
			
			// avoid IE jump
			this.element.css({ margin: oel.css('margin') });
			
			// fix handlers offset
			this._proportionallyResize();
		}
		
		if(!o.handles) o.handles = !$('.ui-resizable-handle', this.element).length ? "e,s,se" : { n: '.ui-resizable-n', e: '.ui-resizable-e', s: '.ui-resizable-s', w: '.ui-resizable-w', se: '.ui-resizable-se', sw: '.ui-resizable-sw', ne: '.ui-resizable-ne', nw: '.ui-resizable-nw' };
		if(o.handles.constructor == String) {
			
			o.zIndex = o.zIndex || 1000;
			
			if(o.handles == 'all') o.handles = 'n,e,s,w,se,sw,ne,nw';
			
			var n = o.handles.split(","); o.handles = {};
			
			// insertions are applied when don't have theme loaded
			var insertionsDefault = {
				handle: 'position: absolute; display: none; overflow:hidden;',
				n: 'top: 0pt; width:100%;',
				e: 'right: 0pt; height:100%;',
				s: 'bottom: 0pt; width:100%;',
				w: 'left: 0pt; height:100%;',
				se: 'bottom: 0pt; right: 0px;',
				sw: 'bottom: 0pt; left: 0px;',
				ne: 'top: 0pt; right: 0px;',
				nw: 'top: 0pt; left: 0px;'
			};
			
			for(var i = 0; i < n.length; i++) {
				var handle = $.trim(n[i]), dt = o.defaultTheme, hname = 'ui-resizable-'+handle, loadDefault = !$.ui.css(hname) && !o.knobHandles, userKnobClass = $.ui.css('ui-resizable-knob-handle'), 
							allDefTheme = $.extend(dt[hname], dt['ui-resizable-handle']), allKnobTheme = $.extend(o.knobTheme[hname], !userKnobClass ? o.knobTheme['ui-resizable-handle'] : {});
				
				// increase zIndex of sw, se, ne, nw axis
				var applyZIndex = /sw|se|ne|nw/.test(handle) ? { zIndex: ++o.zIndex } : {};
				
				var defCss = (loadDefault ? insertionsDefault[handle] : ''), 
					axis = $(['<div class="ui-resizable-handle ', hname, '" style="', defCss, insertionsDefault.handle, '"></div>'].join('')).css( applyZIndex );
				o.handles[handle] = '.ui-resizable-'+handle;
				
				this.element.append(
					//Theme detection, if not loaded, load o.defaultTheme
					axis.css( loadDefault ? allDefTheme : {} )
						// Load the knobHandle css, fix width, height, top, left...
						.css( o.knobHandles ? allKnobTheme : {} ).addClass(o.knobHandles ? 'ui-resizable-knob-handle' : '').addClass(o.knobHandles)
				);
			}
			
			if (o.knobHandles) this.element.addClass('ui-resizable-knob').css( !$.ui.css('ui-resizable-knob') ? { /*border: '1px #fff dashed'*/ } : {} );
		}
		
		this._renderAxis = function(target) {
			target = target || this.element;
			
			for(var i in o.handles) {
				if(o.handles[i].constructor == String) 
					o.handles[i] = $(o.handles[i], this.element).show();
				
				if (o.transparent)
					o.handles[i].css({opacity:0});
				
				//Apply pad to wrapper element, needed to fix axis position (textarea, inputs, scrolls)
				if (this.element.is('.ui-wrapper') && 
					o._nodeName.match(/textarea|input|select|button/i)) {
					
					var axis = $(o.handles[i], this.element), padWrapper = 0;
					
					//Checking the correct pad and border
					padWrapper = /sw|ne|nw|se|n|s/.test(i) ? axis.outerHeight() : axis.outerWidth();
					
					//The padding type i have to apply...
					var padPos = [ 'padding', 
						/ne|nw|n/.test(i) ? 'Top' :
						/se|sw|s/.test(i) ? 'Bottom' : 
						/^e$/.test(i) ? 'Right' : 'Left' ].join(""); 
					
					if (!o.transparent)
						target.css(padPos, padWrapper);
					
					this._proportionallyResize();
				}
				if(!$(o.handles[i]).length) continue;
			}
		};
		
		this._renderAxis(this.element);
		o._handles = $('.ui-resizable-handle', self.element);
		
		if (o.disableSelection)
			o._handles.each(function(i, e) { $.ui.disableSelection(e); });
		
		//Matching axis name
		o._handles.mouseover(function() {
			if (!o.resizing) {
				if (this.className) 
					var axis = this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i);
				//Axis, default = se
				self.axis = o.axis = axis && axis[1] ? axis[1] : 'se';
			}
		});
		
		//If we want to auto hide the elements
		if (o.autoHide) {
			o._handles.hide();
			$(self.element).addClass("ui-resizable-autohide").hover(function() {
				$(this).removeClass("ui-resizable-autohide");
				o._handles.show();
			},
			function(){
				if (!o.resizing) {
					$(this).addClass("ui-resizable-autohide");
					o._handles.hide();
				}
			});
		}
		
		this._mouseInit();
	},
	plugins: {},
	ui: function() {
		return {
			originalElement: this.originalElement,
			element: this.element,
			helper: this.helper,
			position: this.position,
			size: this.size,
			options: this.options,
			originalSize: this.originalSize,
			originalPosition: this.originalPosition
		};
	},
	_propagate: function(n,e) {
		$.ui.plugin.call(this, n, [e, this.ui()]);
		if (n != "resize") this.element.triggerHandler(["resize", n].join(""), [e, this.ui()], this.options[n]);
	},
	destroy: function() {
		var el = this.element, wrapped = el.children(".ui-resizable").get(0);
		
		this._mouseDestroy();
		
		var _destroy = function(exp) {
			$(exp).removeClass("ui-resizable ui-resizable-disabled")
				.removeData("resizable").unbind(".resizable").find('.ui-resizable-handle').remove();
		};
		
		_destroy(el);
		
		if (el.is('.ui-wrapper') && wrapped) {
			el.parent().append(
				$(wrapped).css({
					position: el.css('position'),
					width: el.outerWidth(),
					height: el.outerHeight(),
					top: el.css('top'),
					left: el.css('left')
				})
			).end().remove();
			
			_destroy(wrapped);
		}
	},
	
	_mouseCapture: function(e) {
		
		if(this.options.disabled) return false;
		
		var handle = false;
		for(var i in this.options.handles) {
			if($(this.options.handles[i])[0] == e.target) handle = true;
		}
		if (!handle) return false;
		
		return true;
		
	},
	
	_mouseStart: function(e) {
		
		var o = this.options, iniPos = this.element.position(), el = this.element, 
			num = function(v) { return parseInt(v, 10) || 0; }, ie6 = $.browser.msie && $.browser.version < 7;
		o.resizing = true;
		o.documentScroll = { top: $(document).scrollTop(), left: $(document).scrollLeft() };
		
		// bugfix #1749
		if (el.is('.ui-draggable') || (/absolute/).test(el.css('position'))) {
			
			// sOffset decides if document scrollOffset will be added to the top/left of the resizable element
			var sOffset = $.browser.msie && !o.containment && (/absolute/).test(el.css('position')) && !(/relative/).test(el.parent().css('position'));
			var dscrollt = sOffset ? o.documentScroll.top : 0, dscrolll = sOffset ? o.documentScroll.left : 0;
			
			el.css({ position: 'absolute', top: (iniPos.top + dscrollt), left: (iniPos.left + dscrolll) });
		}
		
		//Opera fixing relative position
		if ($.browser.opera && /relative/.test(el.css('position')))
			el.css({ position: 'relative', top: 'auto', left: 'auto' });
		
		this._renderProxy();
		
		var curleft = num(this.helper.css('left')), curtop = num(this.helper.css('top'));
		
		if (o.containment) {
			curleft += $(o.containment).scrollLeft()||0;
			curtop += $(o.containment).scrollTop()||0;
		}
		
		//Store needed variables
		this.offset = this.helper.offset();
		this.position = { left: curleft, top: curtop };
		this.size = o.helper || ie6 ? { width: el.outerWidth(), height: el.outerHeight() } : { width: el.width(), height: el.height() };
		this.originalSize = o.helper || ie6 ? { width: el.outerWidth(), height: el.outerHeight() } : { width: el.width(), height: el.height() };
		this.originalPosition = { left: curleft, top: curtop };
		this.sizeDiff = { width: el.outerWidth() - el.width(), height: el.outerHeight() - el.height() };
		this.originalMousePosition = { left: e.pageX, top: e.pageY };
		
		//Aspect Ratio
		o.aspectRatio = (typeof o.aspectRatio == 'number') ? o.aspectRatio : ((this.originalSize.width / this.originalSize.height)||1);
		
		if (o.preserveCursor)
			$('body').css('cursor', this.axis + '-resize');
			
		this._propagate("start", e);
		return true;
	},
	_mouseDrag: function(e) {
		
		//Increase performance, avoid regex
		var el = this.helper, o = this.options, props = {},
			self = this, smp = this.originalMousePosition, a = this.axis;
		
		var dx = (e.pageX-smp.left)||0, dy = (e.pageY-smp.top)||0;
		var trigger = this._change[a];
		if (!trigger) return false;
		
		// Calculate the attrs that will be change
		var data = trigger.apply(this, [e, dx, dy]), ie6 = $.browser.msie && $.browser.version < 7, csdif = this.sizeDiff;
		
		if (o._aspectRatio || e.shiftKey)
			data = this._updateRatio(data, e);
		
		data = this._respectSize(data, e);
		
		// plugins callbacks need to be called first
		this._propagate("resize", e);
		
		el.css({
			top: this.position.top + "px", left: this.position.left + "px", 
			width: this.size.width + "px", height: this.size.height + "px"
		});
		
		if (!o.helper && o.proportionallyResize)
			this._proportionallyResize();
		
		this._updateCache(data);
		
		// calling the user callback at the end
		this.element.triggerHandler("resize", [e, this.ui()], this.options["resize"]);
		
		return false;
	},
	_mouseStop: function(e) {
		
		this.options.resizing = false;
		var o = this.options, num = function(v) { return parseInt(v, 10) || 0; }, self = this;
		
		if(o.helper) {
			var pr = o.proportionallyResize, ista = pr && (/textarea/i).test(pr.get(0).nodeName), 
						soffseth = ista && $.ui.hasScroll(pr.get(0), 'left') /* TODO - jump height */ ? 0 : self.sizeDiff.height,
							soffsetw = ista ? 0 : self.sizeDiff.width;
			
			var s = { width: (self.size.width - soffsetw), height: (self.size.height - soffseth) },
				left = (parseInt(self.element.css('left'), 10) + (self.position.left - self.originalPosition.left)) || null, 
				top = (parseInt(self.element.css('top'), 10) + (self.position.top - self.originalPosition.top)) || null;
			
			if (!o.animate)
				this.element.css($.extend(s, { top: top, left: left }));
			
			if (o.helper && !o.animate) this._proportionallyResize();
		}
		
		if (o.preserveCursor)
			$('body').css('cursor', 'auto');
		
		this._propagate("stop", e);
		
		if (o.helper) this.helper.remove();
		
		return false;
	},
	_updateCache: function(data) {
		var o = this.options;
		this.offset = this.helper.offset();
		if (data.left) this.position.left = data.left;
		if (data.top) this.position.top = data.top;
		if (data.height) this.size.height = data.height;
		if (data.width) this.size.width = data.width;
	},
	_updateRatio: function(data, e) {
		
		var o = this.options, cpos = this.position, csize = this.size, a = this.axis;
		
		if (data.height) data.width = (csize.height * o.aspectRatio);
		else if (data.width) data.height = (csize.width / o.aspectRatio);
		
		if (a == 'sw') {
			data.left = cpos.left + (csize.width - data.width);
			data.top = null;
		}
		if (a == 'nw') { 
			data.top = cpos.top + (csize.height - data.height);
			data.left = cpos.left + (csize.width - data.width);
		}
		
		return data;
	},
	_respectSize: function(data, e) {
		
		var el = this.helper, o = this.options, pRatio = o._aspectRatio || e.shiftKey, a = this.axis, 
				ismaxw = data.width && o.maxWidth && o.maxWidth < data.width, ismaxh = data.height && o.maxHeight && o.maxHeight < data.height,
					isminw = data.width && o.minWidth && o.minWidth > data.width, isminh = data.height && o.minHeight && o.minHeight > data.height;
		
		if (isminw) data.width = o.minWidth;
		if (isminh) data.height = o.minHeight;
		if (ismaxw) data.width = o.maxWidth;
		if (ismaxh) data.height = o.maxHeight;
		
		var dw = this.originalPosition.left + this.originalSize.width, dh = this.position.top + this.size.height;
		var cw = /sw|nw|w/.test(a), ch = /nw|ne|n/.test(a);
		
		if (isminw && cw) data.left = dw - o.minWidth;
		if (ismaxw && cw) data.left = dw - o.maxWidth;
		if (isminh && ch)	data.top = dh - o.minHeight;
		if (ismaxh && ch)	data.top = dh - o.maxHeight;
		
		// fixing jump error on top/left - bug #2330
		var isNotwh = !data.width && !data.height;
		if (isNotwh && !data.left && data.top) data.top = null;
		else if (isNotwh && !data.top && data.left) data.left = null;
		
		return data;
	},
	_proportionallyResize: function() {
		var o = this.options;
		if (!o.proportionallyResize) return;
		var prel = o.proportionallyResize, el = this.helper || this.element;
		
		if (!o.borderDif) {
			var b = [prel.css('borderTopWidth'), prel.css('borderRightWidth'), prel.css('borderBottomWidth'), prel.css('borderLeftWidth')],
				p = [prel.css('paddingTop'), prel.css('paddingRight'), prel.css('paddingBottom'), prel.css('paddingLeft')];
			
			o.borderDif = $.map(b, function(v, i) {
				var border = parseInt(v,10)||0, padding = parseInt(p[i],10)||0;
				return border + padding; 
			});
		}
		prel.css({
			height: (el.height() - o.borderDif[0] - o.borderDif[2]) + "px",
			width: (el.width() - o.borderDif[1] - o.borderDif[3]) + "px"
		});
	},
	_renderProxy: function() {
		var el = this.element, o = this.options;
		this.elementOffset = el.offset();
		
		if(o.helper) {
			this.helper = this.helper || $('<div style="overflow:hidden;"></div>');
			
			// fix ie6 offset
			var ie6 = $.browser.msie && $.browser.version < 7, ie6offset = (ie6 ? 1 : 0),
			pxyoffset = ( ie6 ? 2 : -1 );
			
			this.helper.addClass(o.helper).css({
				width: el.outerWidth() + pxyoffset,
				height: el.outerHeight() + pxyoffset,
				position: 'absolute',
				left: this.elementOffset.left - ie6offset +'px',
				top: this.elementOffset.top - ie6offset +'px',
				zIndex: ++o.zIndex
			});
			
			this.helper.appendTo("body");
			
			if (o.disableSelection)
				$.ui.disableSelection(this.helper.get(0));
			
		} else {
			this.helper = el; 
		}
	},
	_change: {
		e: function(e, dx, dy) {
			return { width: this.originalSize.width + dx };
		},
		w: function(e, dx, dy) {
			var o = this.options, cs = this.originalSize, sp = this.originalPosition;
			return { left: sp.left + dx, width: cs.width - dx };
		},
		n: function(e, dx, dy) {
			var o = this.options, cs = this.originalSize, sp = this.originalPosition;
			return { top: sp.top + dy, height: cs.height - dy };
		},
		s: function(e, dx, dy) {
			return { height: this.originalSize.height + dy };
		},
		se: function(e, dx, dy) {
			return $.extend(this._change.s.apply(this, arguments), this._change.e.apply(this, [e, dx, dy]));
		},
		sw: function(e, dx, dy) {
			return $.extend(this._change.s.apply(this, arguments), this._change.w.apply(this, [e, dx, dy]));
		},
		ne: function(e, dx, dy) {
			return $.extend(this._change.n.apply(this, arguments), this._change.e.apply(this, [e, dx, dy]));
		},
		nw: function(e, dx, dy) {
			return $.extend(this._change.n.apply(this, arguments), this._change.w.apply(this, [e, dx, dy]));
		}
	}
}));

$.extend($.ui.resizable, {
	defaults: {
		cancel: ":input",
		distance: 1,
		delay: 0,
		preventDefault: true,
		transparent: false,
		minWidth: 10,
		minHeight: 10,
		aspectRatio: false,
		disableSelection: true,
		preserveCursor: true,
		autoHide: false,
		knobHandles: false
	}
});

/*
 * Resizable Extensions
 */

$.ui.plugin.add("resizable", "containment", {
	
	start: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable"), el = self.element;
		var oc = o.containment,	ce = (oc instanceof $) ? oc.get(0) : (/parent/.test(oc)) ? el.parent().get(0) : oc;
		if (!ce) return;
		
		self.containerElement = $(ce);
		
		if (/document/.test(oc) || oc == document) {
			self.containerOffset = { left: 0, top: 0 };
			self.containerPosition = { left: 0, top: 0 };
			
			self.parentData = { 
				element: $(document), left: 0, top: 0, 
				width: $(document).width(), height: $(document).height() || document.body.parentNode.scrollHeight
			};
		}
		
				
		// i'm a node, so compute top, left, right, bottom
		else{
			self.containerOffset = $(ce).offset();
			self.containerPosition = $(ce).position();
			self.containerSize = { height: $(ce).innerHeight(), width: $(ce).innerWidth() };
		
			var co = self.containerOffset, ch = self.containerSize.height,	cw = self.containerSize.width, 
						width = ($.ui.hasScroll(ce, "left") ? ce.scrollWidth : cw ), height = ($.ui.hasScroll(ce) ? ce.scrollHeight : ch);
		
			self.parentData = { 
				element: ce, left: co.left, top: co.top, width: width, height: height
			};
		}
	},
	
	resize: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable"), 
				ps = self.containerSize, co = self.containerOffset, cs = self.size, cp = self.position,
				pRatio = o._aspectRatio || e.shiftKey, cop = { top:0, left:0 }, ce = self.containerElement;
		
		if (ce[0] != document && /static/.test(ce.css('position')))
			cop = self.containerPosition;
		
		if (cp.left < (o.helper ? co.left : cop.left)) {
			self.size.width = self.size.width + (o.helper ? (self.position.left - co.left) : (self.position.left - cop.left));
			if (pRatio) self.size.height = self.size.width / o.aspectRatio;
			self.position.left = o.helper ? co.left : cop.left;
		}
		
		if (cp.top < (o.helper ? co.top : 0)) {
			self.size.height = self.size.height + (o.helper ? (self.position.top - co.top) : self.position.top);
			if (pRatio) self.size.width = self.size.height * o.aspectRatio;
			self.position.top = o.helper ? co.top : 0;
		}
		
		var woset = (o.helper ? self.offset.left - co.left : (self.position.left - cop.left)) + self.sizeDiff.width, 
					hoset = (o.helper ? self.offset.top - co.top : self.position.top) + self.sizeDiff.height;
		
		if (woset + self.size.width >= self.parentData.width) {
			self.size.width = self.parentData.width - woset;
			if (pRatio) self.size.height = self.size.width / o.aspectRatio;
		}
		
		if (hoset + self.size.height >= self.parentData.height) {
			self.size.height = self.parentData.height - hoset;
			if (pRatio) self.size.width = self.size.height * o.aspectRatio;
		}
	},
	
	stop: function(e, ui){
		var o = ui.options, self = $(this).data("resizable"), cp = self.position,
				co = self.containerOffset, cop = self.containerPosition, ce = self.containerElement;
		
		var helper = $(self.helper), ho = helper.offset(), w = helper.innerWidth(), h = helper.innerHeight();
		
		
		if (o.helper && !o.animate && /relative/.test(ce.css('position')))
			$(this).css({ left: (ho.left - co.left), top: (ho.top - co.top), width: w, height: h });
		
		if (o.helper && !o.animate && /static/.test(ce.css('position')))
			$(this).css({ left: cop.left + (ho.left - co.left), top: cop.top + (ho.top - co.top), width: w, height: h });
		
	}
});

$.ui.plugin.add("resizable", "grid", {
	
	resize: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable"), cs = self.size, os = self.originalSize, op = self.originalPosition, a = self.axis, ratio = o._aspectRatio || e.shiftKey;
		o.grid = typeof o.grid == "number" ? [o.grid, o.grid] : o.grid;
		var ox = Math.round((cs.width - os.width) / (o.grid[0]||1)) * (o.grid[0]||1), oy = Math.round((cs.height - os.height) / (o.grid[1]||1)) * (o.grid[1]||1);
		
		if (/^(se|s|e)$/.test(a)) {
			self.size.width = os.width + ox;
			self.size.height = os.height + oy;
		}
		else if (/^(ne)$/.test(a)) {
			self.size.width = os.width + ox;
			self.size.height = os.height + oy;
			self.position.top = op.top - oy;
		}
		else if (/^(sw)$/.test(a)) {
			self.size.width = os.width + ox;
			self.size.height = os.height + oy;
			self.position.left = op.left - ox;
		}
		else {
			self.size.width = os.width + ox;
			self.size.height = os.height + oy;
			self.position.top = op.top - oy;
			self.position.left = op.left - ox;
		}
	}
	
});

$.ui.plugin.add("resizable", "animate", {
	
	stop: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable");
		
		var pr = o.proportionallyResize, ista = pr && (/textarea/i).test(pr.get(0).nodeName), 
						soffseth = ista && $.ui.hasScroll(pr.get(0), 'left') /* TODO - jump height */ ? 0 : self.sizeDiff.height,
							soffsetw = ista ? 0 : self.sizeDiff.width;
		
		var style = { width: (self.size.width - soffsetw), height: (self.size.height - soffseth) },
					left = (parseInt(self.element.css('left'), 10) + (self.position.left - self.originalPosition.left)) || null, 
						top = (parseInt(self.element.css('top'), 10) + (self.position.top - self.originalPosition.top)) || null; 
		
		self.element.animate(
			$.extend(style, top && left ? { top: top, left: left } : {}), { 
				duration: o.animateDuration || "slow", easing: o.animateEasing || "swing", 
				step: function() {
					
					var data = {
						width: parseInt(self.element.css('width'), 10),
						height: parseInt(self.element.css('height'), 10),
						top: parseInt(self.element.css('top'), 10),
						left: parseInt(self.element.css('left'), 10)
					};
					
					if (pr) pr.css({ width: data.width, height: data.height });
					
					// propagating resize, and updating values for each animation step
					self._updateCache(data);
					self._propagate("animate", e);
					
				}
			}
		);
	}
	
});

$.ui.plugin.add("resizable", "ghost", {
	
	start: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable"), pr = o.proportionallyResize, cs = self.size;
		
		if (!pr) self.ghost = self.element.clone();
		else self.ghost = pr.clone();
		
		self.ghost.css(
			{ opacity: .25, display: 'block', position: 'relative', height: cs.height, width: cs.width, margin: 0, left: 0, top: 0 }
		)
		.addClass('ui-resizable-ghost').addClass(typeof o.ghost == 'string' ? o.ghost : '');
		
		self.ghost.appendTo(self.helper);
		
	},
	
	resize: function(e, ui){
		var o = ui.options, self = $(this).data("resizable"), pr = o.proportionallyResize;
		
		if (self.ghost) self.ghost.css({ position: 'relative', height: self.size.height, width: self.size.width });
		
	},
	
	stop: function(e, ui){
		var o = ui.options, self = $(this).data("resizable"), pr = o.proportionallyResize;
		if (self.ghost && self.helper) self.helper.get(0).removeChild(self.ghost.get(0));
	}
	
});

$.ui.plugin.add("resizable", "alsoResize", {
	
	start: function(e, ui) {
		var o = ui.options, self = $(this).data("resizable"), 
		
		_store = function(exp) {
			$(exp).each(function() {
				$(this).data("resizable-alsoresize", {
					width: parseInt($(this).width(), 10), height: parseInt($(this).height(), 10),
					left: parseInt($(this).css('left'), 10), top: parseInt($(this).css('top'), 10)
				});
			});
		};
		
		if (typeof(o.alsoResize) == 'object') {
			if (o.alsoResize.length) { o.alsoResize = o.alsoResize[0];	_store(o.alsoResize); }
			else { $.each(o.alsoResize, function(exp, c) { _store(exp); }); }
		}else{
			_store(o.alsoResize);
		} 
	},
	
	resize: function(e, ui){
		var o = ui.options, self = $(this).data("resizable"), os = self.originalSize, op = self.originalPosition;
		
		var delta = { 
			height: (self.size.height - os.height) || 0, width: (self.size.width - os.width) || 0,
			top: (self.position.top - op.top) || 0, left: (self.position.left - op.left) || 0
		},
		
		_alsoResize = function(exp, c) {
			$(exp).each(function() {
				var start = $(this).data("resizable-alsoresize"), style = {}, css = c && c.length ? c : ['width', 'height', 'top', 'left'];
				
				$.each(css || ['width', 'height', 'top', 'left'], function(i, prop) {
					var sum = (start[prop]||0) + (delta[prop]||0);
					if (sum && sum >= 0)
						style[prop] = sum || null;
				});
				$(this).css(style);
			});
		};
		
		if (typeof(o.alsoResize) == 'object') {
			$.each(o.alsoResize, function(exp, c) { _alsoResize(exp, c); });
		}else{
			_alsoResize(o.alsoResize);
		}
	},
	
	stop: function(e, ui){
		$(this).removeData("resizable-alsoresize-start");
	}
});

})(jQuery);
/*
 * jQuery UI Tabs 1.6rc2

 *
 * Copyright (c) 2007, 2008 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Tabs
 *
 * Depends:
 *	ui.core.js
 */
(function($) {

$.widget("ui.tabs", {
	_init: function() {
		this.options.event += '.tabs'; // namespace event
		
		// create tabs
		this._tabify(true);
	},
	_setData: function(key, value) {
		if ((/^selected/).test(key))
			this.select(value);
		else {
			this.options[key] = value;
			this._tabify();
		}
	},
	length: function() {
		return this.$tabs.length;
	},
	_tabId: function(a) {
		return a.title && a.title.replace(/\s/g, '_').replace(/[^A-Za-z0-9\-_:\.]/g, '')
			|| this.options.idPrefix + $.data(a);
	},
	ui: function(tab, panel) {
		return {
			options: this.options,
			tab: tab,
			panel: panel,
			index: this.$tabs.index(tab)
		};
	},
	_tabify: function(init) {

		this.$lis = $('li:has(a[href])', this.element);
		this.$tabs = this.$lis.map(function() { return $('a', this)[0]; });
		this.$panels = $([]);

		var self = this, o = this.options;

		this.$tabs.each(function(i, a) {
			// inline tab
			if (a.hash && a.hash.replace('#', '')) // Safari 2 reports '#' for an empty hash
				self.$panels = self.$panels.add(a.hash);
			// remote tab
			else if ($(a).attr('href') != '#') { // prevent loading the page itself if href is just "#"
				$.data(a, 'href.tabs', a.href); // required for restore on destroy
				$.data(a, 'load.tabs', a.href); // mutable
				var id = self._tabId(a);
				a.href = '#' + id;
				var $panel = $('#' + id);
				if (!$panel.length) {
					$panel = $(o.panelTemplate).attr('id', id).addClass(o.panelClass)
						.insertAfter( self.$panels[i - 1] || self.element );
					$panel.data('destroy.tabs', true);
				}
				self.$panels = self.$panels.add( $panel );
			}
			// invalid tab href
			else
				o.disabled.push(i + 1);
		});

		// initialization from scratch
		if (init) {

			// attach necessary classes for styling if not present
			this.element.addClass(o.navClass);
			this.$panels.each(function() {
				var $this = $(this);
				$this.addClass(o.panelClass);
			});

			// Selected tab
			// use "selected" option or try to retrieve:
			// 1. from fragment identifier in url
			// 2. from cookie
			// 3. from selected class attribute on <li>
			if (o.selected === undefined) {
				if (location.hash) {
					this.$tabs.each(function(i, a) {
						if (a.hash == location.hash) {
							o.selected = i;
							// prevent page scroll to fragment
							if ($.browser.msie || $.browser.opera) { // && !o.remote
								var $toShow = $(location.hash), toShowId = $toShow.attr('id');
								$toShow.attr('id', '');
								setTimeout(function() {
									$toShow.attr('id', toShowId); // restore id
								}, 500);
							}
							scrollTo(0, 0);
							return false; // break
						}
					});
				}
				else if (o.cookie) {
					var index = parseInt($.cookie('ui-tabs-' + $.data(self.element[0])), 10);
					if (index && self.$tabs[index])
						o.selected = index;
				}
				else if (self.$lis.filter('.' + o.selectedClass).length)
					o.selected = self.$lis.index( self.$lis.filter('.' + o.selectedClass)[0] );
			}
			o.selected = o.selected === null || o.selected !== undefined ? o.selected : 0; // first tab selected by default

			// Take disabling tabs via class attribute from HTML
			// into account and update option properly.
			// A selected tab cannot become disabled.
			o.disabled = $.unique(o.disabled.concat(
				$.map(this.$lis.filter('.' + o.disabledClass),
					function(n, i) { return self.$lis.index(n); } )
			)).sort();
			if ($.inArray(o.selected, o.disabled) != -1)
				o.disabled.splice($.inArray(o.selected, o.disabled), 1);
			
			// highlight selected tab
			this.$panels.addClass(o.hideClass);
			this.$lis.removeClass(o.selectedClass);
			if (o.selected !== null) {
				this.$panels.eq(o.selected).show().removeClass(o.hideClass); // use show and remove class to show in any case no matter how it has been hidden before
				this.$lis.eq(o.selected).addClass(o.selectedClass);
				
				// seems to be expected behavior that the show callback is fired
				var onShow = function() {
					self._trigger('show', null,
						self.ui(self.$tabs[o.selected], self.$panels[o.selected]));
				};

				// load if remote tab
				if ($.data(this.$tabs[o.selected], 'load.tabs'))
					this.load(o.selected, onShow);
				// just trigger show event
				else
					onShow();
			}
			
			// clean up to avoid memory leaks in certain versions of IE 6
			$(window).bind('unload', function() {
				self.$tabs.unbind('.tabs');
				self.$lis = self.$tabs = self.$panels = null;
			});

		}
		// update selected after add/remove
		else
			o.selected = this.$lis.index( this.$lis.filter('.' + o.selectedClass)[0] );

		// set or update cookie after init and add/remove respectively
		if (o.cookie)
			$.cookie('ui-tabs-' + $.data(self.element[0]), o.selected, o.cookie);
		
		// disable tabs
		for (var i = 0, li; li = this.$lis[i]; i++)
			$(li)[$.inArray(i, o.disabled) != -1 && !$(li).hasClass(o.selectedClass) ? 'addClass' : 'removeClass'](o.disabledClass);

		// reset cache if switching from cached to not cached
		if (o.cache === false)
			this.$tabs.removeData('cache.tabs');
		
		// set up animations
		var hideFx, showFx, baseFx = { 'min-width': 0, duration: 1 }, baseDuration = 'normal';
		if (o.fx && o.fx.constructor == Array)
			hideFx = o.fx[0] || baseFx, showFx = o.fx[1] || baseFx;
		else
			hideFx = showFx = o.fx || baseFx;

		// reset some styles to maintain print style sheets etc.
		var resetCSS = { display: '', overflow: '', height: '' };
		if (!$.browser.msie) // not in IE to prevent ClearType font issue
			resetCSS.opacity = '';

		// Hide a tab, animation prevents browser scrolling to fragment,
		// $show is optional.
		function hideTab(clicked, $hide, $show) {
			$hide.animate(hideFx, hideFx.duration || baseDuration, function() { //
				$hide.addClass(o.hideClass).css(resetCSS); // maintain flexible height and accessibility in print etc.
				if ($.browser.msie && hideFx.opacity)
					$hide[0].style.filter = '';
				if ($show)
					showTab(clicked, $show, $hide);
			});
		}

		// Show a tab, animation prevents browser scrolling to fragment,
		// $hide is optional.
		function showTab(clicked, $show, $hide) {
			if (showFx === baseFx)
				$show.css('display', 'block'); // prevent occasionally occuring flicker in Firefox cause by gap between showing and hiding the tab panels
			$show.animate(showFx, showFx.duration || baseDuration, function() {
				$show.removeClass(o.hideClass).css(resetCSS); // maintain flexible height and accessibility in print etc.
				if ($.browser.msie && showFx.opacity)
					$show[0].style.filter = '';

				// callback
				self._trigger('show', null, self.ui(clicked, $show[0]));
			});
		}

		// switch a tab
		function switchTab(clicked, $li, $hide, $show) {
			/*if (o.bookmarkable && trueClick) { // add to history only if true click occured, not a triggered click
				$.ajaxHistory.update(clicked.hash);
			}*/
			$li.addClass(o.selectedClass)
				.siblings().removeClass(o.selectedClass);
			hideTab(clicked, $hide, $show);
		}

		// attach tab event handler, unbind to avoid duplicates from former tabifying...
		this.$tabs.unbind('.tabs').bind(o.event, function() {

			//var trueClick = e.clientX; // add to history only if true click occured, not a triggered click
			var $li = $(this).parents('li:eq(0)'),
				$hide = self.$panels.filter(':visible'),
				$show = $(this.hash);

			// If tab is already selected and not unselectable or tab disabled or 
			// or is already loading or click callback returns false stop here.
			// Check if click handler returns false last so that it is not executed
			// for a disabled or loading tab!
			if (($li.hasClass(o.selectedClass) && !o.unselect)
				|| $li.hasClass(o.disabledClass) 
				|| $(this).hasClass(o.loadingClass)
				|| self._trigger('select', null, self.ui(this, $show[0])) === false
				) {
				this.blur();
				return false;
			}

			self.options.selected = self.$tabs.index(this);

			// if tab may be closed
			if (o.unselect) {
				if ($li.hasClass(o.selectedClass)) {
					self.options.selected = null;
					$li.removeClass(o.selectedClass);
					self.$panels.stop();
					hideTab(this, $hide);
					this.blur();
					return false;
				} else if (!$hide.length) {
					self.$panels.stop();
					var a = this;
					self.load(self.$tabs.index(this), function() {
						$li.addClass(o.selectedClass).addClass(o.unselectClass);
						showTab(a, $show);
					});
					this.blur();
					return false;
				}
			}

			if (o.cookie)
				$.cookie('ui-tabs-' + $.data(self.element[0]), self.options.selected, o.cookie);

			// stop possibly running animations
			self.$panels.stop();

			// show new tab
			if ($show.length) {

				// prevent scrollbar scrolling to 0 and than back in IE7, happens only if bookmarking/history is enabled
				/*if ($.browser.msie && o.bookmarkable) {
					var showId = this.hash.replace('#', '');
					$show.attr('id', '');
					setTimeout(function() {
						$show.attr('id', showId); // restore id
					}, 0);
				}*/

				var a = this;
				self.load(self.$tabs.index(this), $hide.length ? 
					function() {
						switchTab(a, $li, $hide, $show);
					} :
					function() {
						$li.addClass(o.selectedClass);
						showTab(a, $show);
					}
				);

				// Set scrollbar to saved position - need to use timeout with 0 to prevent browser scroll to target of hash
				/*var scrollX = window.pageXOffset || document.documentElement && document.documentElement.scrollLeft || document.body.scrollLeft || 0;
				var scrollY = window.pageYOffset || document.documentElement && document.documentElement.scrollTop || document.body.scrollTop || 0;
				setTimeout(function() {
					scrollTo(scrollX, scrollY);
				}, 0);*/

			} else
				throw 'jQuery UI Tabs: Mismatching fragment identifier.';

			// Prevent IE from keeping other link focussed when using the back button
			// and remove dotted border from clicked link. This is controlled in modern
			// browsers via CSS, also blur removes focus from address bar in Firefox
			// which can become a usability and annoying problem with tabsRotate.
			if ($.browser.msie)
				this.blur();

			//return o.bookmarkable && !!trueClick; // convert trueClick == undefined to Boolean required in IE
			return false;

		});

		// disable click if event is configured to something else
		if (!(/^click/).test(o.event))
			this.$tabs.bind('click.tabs', function() { return false; });

	},
	add: function(url, label, index) {
		if (index == undefined) 
			index = this.$tabs.length; // append by default

		var o = this.options;
		var $li = $(o.tabTemplate.replace(/#\{href\}/g, url).replace(/#\{label\}/g, label));
		$li.data('destroy.tabs', true);

		var id = url.indexOf('#') == 0 ? url.replace('#', '') : this._tabId( $('a:first-child', $li)[0] );

		// try to find an existing element before creating a new one
		var $panel = $('#' + id);
		if (!$panel.length) {
			$panel = $(o.panelTemplate).attr('id', id)
				.addClass(o.hideClass)
				.data('destroy.tabs', true);
		}
		$panel.addClass(o.panelClass);
		if (index >= this.$lis.length) {
			$li.appendTo(this.element);
			$panel.appendTo(this.element[0].parentNode);
		} else {
			$li.insertBefore(this.$lis[index]);
			$panel.insertBefore(this.$panels[index]);
		}
		
		o.disabled = $.map(o.disabled,
			function(n, i) { return n >= index ? ++n : n });
			
		this._tabify();

		if (this.$tabs.length == 1) {
			$li.addClass(o.selectedClass);
			$panel.removeClass(o.hideClass);
			var href = $.data(this.$tabs[0], 'load.tabs');
			if (href)
				this.load(index, href);
		}

		// callback
		this._trigger('add', null, this.ui(this.$tabs[index], this.$panels[index]));
	},
	remove: function(index) {
		var o = this.options, $li = this.$lis.eq(index).remove(),
			$panel = this.$panels.eq(index).remove();

		// If selected tab was removed focus tab to the right or
		// in case the last tab was removed the tab to the left.
		if ($li.hasClass(o.selectedClass) && this.$tabs.length > 1)
			this.select(index + (index + 1 < this.$tabs.length ? 1 : -1));

		o.disabled = $.map($.grep(o.disabled, function(n, i) { return n != index; }),
			function(n, i) { return n >= index ? --n : n });

		this._tabify();

		// callback
		this._trigger('remove', null, this.ui($li.find('a')[0], $panel[0]));
	},
	enable: function(index) {
		var o = this.options;
		if ($.inArray(index, o.disabled) == -1)
			return;
			
		var $li = this.$lis.eq(index).removeClass(o.disabledClass);
		if ($.browser.safari) { // fix disappearing tab (that used opacity indicating disabling) after enabling in Safari 2...
			$li.css('display', 'inline-block');
			setTimeout(function() {
				$li.css('display', 'block');
			}, 0);
		}

		o.disabled = $.grep(o.disabled, function(n, i) { return n != index; });

		// callback
		this._trigger('enable', null, this.ui(this.$tabs[index], this.$panels[index]));
	},
	disable: function(index) {
		var self = this, o = this.options;
		if (index != o.selected) { // cannot disable already selected tab
			this.$lis.eq(index).addClass(o.disabledClass);

			o.disabled.push(index);
			o.disabled.sort();

			// callback
			this._trigger('disable', null, this.ui(this.$tabs[index], this.$panels[index]));
		}
	},
	select: function(index) {
		if (typeof index == 'string')
			index = this.$tabs.index( this.$tabs.filter('[href$=' + index + ']')[0] );
		this.$tabs.eq(index).trigger(this.options.event);
	},
	load: function(index, callback) { // callback is for internal usage only
		
		var self = this, o = this.options, $a = this.$tabs.eq(index), a = $a[0],
				bypassCache = callback == undefined || callback === false, url = $a.data('load.tabs');

		callback = callback || function() {};
		
		// no remote or from cache - just finish with callback
		if (!url || !bypassCache && $.data(a, 'cache.tabs')) {
			callback();
			return;
		}

		// load remote from here on
		
		var inner = function(parent) {
			var $parent = $(parent), $inner = $parent.find('*:last');
			return $inner.length && $inner.is(':not(img)') && $inner || $parent;
		};
		var cleanup = function() {
			self.$tabs.filter('.' + o.loadingClass).removeClass(o.loadingClass)
						.each(function() {
							if (o.spinner)
								inner(this).parent().html(inner(this).data('label.tabs'));
						});
			self.xhr = null;
		};
		
		if (o.spinner) {
			var label = inner(a).html();
			inner(a).wrapInner('<em></em>')
				.find('em').data('label.tabs', label).html(o.spinner);
		}

		var ajaxOptions = $.extend({}, o.ajaxOptions, {
			url: url,
			success: function(r, s) {
				$(a.hash).html(r);
				cleanup();
				
				if (o.cache)
					$.data(a, 'cache.tabs', true); // if loaded once do not load them again

				// callbacks
				self._trigger('load', null, self.ui(self.$tabs[index], self.$panels[index]));
				o.ajaxOptions.success && o.ajaxOptions.success(r, s);
				
				// This callback is required because the switch has to take
				// place after loading has completed. Call last in order to 
				// fire load before show callback...
				callback();
			}
		});
		if (this.xhr) {
			// terminate pending requests from other tabs and restore tab label
			this.xhr.abort();
			cleanup();
		}
		$a.addClass(o.loadingClass);
		setTimeout(function() { // timeout is again required in IE, "wait" for id being restored
			self.xhr = $.ajax(ajaxOptions);
		}, 0);

	},
	url: function(index, url) {
		this.$tabs.eq(index).removeData('cache.tabs').data('load.tabs', url);
	},
	destroy: function() {
		var o = this.options;
		this.element.unbind('.tabs')
			.removeClass(o.navClass).removeData('tabs');
		this.$tabs.each(function() {
			var href = $.data(this, 'href.tabs');
			if (href)
				this.href = href;
			var $this = $(this).unbind('.tabs');
			$.each(['href', 'load', 'cache'], function(i, prefix) {
				$this.removeData(prefix + '.tabs');
			});
		});
		this.$lis.add(this.$panels).each(function() {
			if ($.data(this, 'destroy.tabs'))
				$(this).remove();
			else
				$(this).removeClass([o.selectedClass, o.unselectClass,
					o.disabledClass, o.panelClass, o.hideClass].join(' '));
		});
	}
});

$.ui.tabs.defaults = {
	// basic setup
	unselect: false,
	event: 'click',
	disabled: [],
	cookie: null, // e.g. { expires: 7, path: '/', domain: 'jquery.com', secure: true }
	// TODO history: false,

	// Ajax
	spinner: 'Loading&#8230;',
	cache: false,
	idPrefix: 'ui-tabs-',
	ajaxOptions: {},

	// animations
	fx: null, // e.g. { height: 'toggle', opacity: 'toggle', duration: 200 }

	// templates
	tabTemplate: '<li><a href="#{href}"><span>#{label}</span></a></li>',
	panelTemplate: '<div></div>',

	// CSS classes
	navClass: 'ui-tabs-nav',
	selectedClass: 'ui-tabs-selected',
	unselectClass: 'ui-tabs-unselect',
	disabledClass: 'ui-tabs-disabled',
	panelClass: 'ui-tabs-panel',
	hideClass: 'ui-tabs-hide',
	loadingClass: 'ui-tabs-loading'
};

$.ui.tabs.getter = "length";

/*
 * Tabs Extensions
 */

/*
 * Rotate
 */
$.extend($.ui.tabs.prototype, {
	rotation: null,
	rotate: function(ms, continuing) {
		
		continuing = continuing || false;
		
		var self = this, t = this.options.selected;
		
		function start() {
			self.rotation = setInterval(function() {
				t = ++t < self.$tabs.length ? t : 0;
				self.select(t);
			}, ms); 
		}
		
		function stop(e) {
			if (!e || e.clientX) { // only in case of a true click
				clearInterval(self.rotation);
			}
		}
		
		// start interval
		if (ms) {
			start();
			if (!continuing)
				this.$tabs.bind(this.options.event, stop);
			else
				this.$tabs.bind(this.options.event, function() {
					stop();
					t = self.options.selected;
					start();
				});
		}
		// stop interval
		else {
			stop();
			this.$tabs.unbind(this.options.event, stop);
		}
	}
});

})(jQuery);
