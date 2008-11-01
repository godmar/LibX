/* 
 * The global libx object, which forms the root of the libx namespace
 * The following conventions are used.
 * lowercase letters are used as package names, for instance
 *
 * libx.core
 *
 * CamelCase names represent classes (to which 'new' can be applied)
 * and metaobjects (such as libx.core.Class)
 *
 * lowercase names represent objects
 */
libx = { };

/*
 * Embed Alex Arnell's 'inheritance' class in the libx.core
 * namespace.
 * See http://code.google.com/p/inheritance/ 
 * for details and documentation.
 *
 * Following snippet taken from 
 * http://pastie.textmate.org/private/ua9j48n4w0k4wpxktsxdhw
 * This file contains Alex's original code and a name space wrapper.
 */
libx.core = (function() {

  /*
    Class, version 2.7
    Copyright (c) 2006, 2007, 2008, Alex Arnell <alex@twologic.com>
    Licensed under the new BSD License. See end of file for full license terms.
  */

  var Class = (function() {
    var __extending = {};

    return {
      extend: function(parent, def) {
        if (arguments.length == 1) { def = parent; parent = null; }
        var func = function() {
          if (arguments[0] ==  __extending) { return; }
          if (typeof(this.initialize) == 'function') { this.initialize.apply(this, arguments); }
        };
        if (typeof(parent) == 'function') {
          func.prototype = new parent( __extending);
        }
        var mixins = [];
        if (def && def.include) {
          if (def.include.reverse) {
            // methods defined in later mixins should override prior
            mixins = mixins.concat(def.include.reverse());
          } else {
            mixins.push(def.include);
          }
          delete def.include; // clean syntax sugar
        }
        if (def) Class.inherit(func.prototype, def);
        for (var i = 0; (mixin = mixins[i]); i++) {
          Class.mixin(func.prototype, mixin);
        }
        return func;
      },
      mixin: function (dest, src, clobber) {
        clobber = clobber || false;
        if (typeof(src) != 'undefined' && src !== null) {
          for (var prop in src) {
            if (clobber || (!dest[prop] && typeof(src[prop]) == 'function')) {
              dest[prop] = src[prop];
            }
          }
        }
        return dest;
      },
      inherit: function(dest, src, fname) {
        if (arguments.length == 3) {
          var ancestor = dest[fname], descendent = src[fname], method = descendent;
          descendent = function() {
            var ref = this.parent; this.parent = ancestor;
            var result = method.apply(this, arguments);
            ref ? this.parent = ref : delete this.parent;
            return result;
          };
          // mask the underlying method
          descendent.valueOf = function() { return method; };
          descendent.toString = function() { return method.toString(); };
          dest[fname] = descendent;
        } else {
          for (var prop in src) {
            if (dest[prop] && typeof(src[prop]) == 'function') {
              Class.inherit(dest, src, prop);
            } else {
              dest[prop] = src[prop];
            }
          }
        }
        return dest;
      },
      singleton: function() {
        var args = arguments;
        if (args.length == 2 && args[0].getInstance) {
          var klass = args[0].getInstance(__extending);
          // we're extending a singleton swap it out for it's class
          if (klass) { args[0] = klass; }
        }

        return (function(args){
          // store instance and class in private variables
          var instance = false;
          var klass = Class.extend.apply(args.callee, args);
          return {
            getInstance: function () {
              if (arguments[0] == __extending) return klass;
              if (instance) return instance;
              return (instance = new klass());
            }
          };
        })(args);
      }
    };
  })();

  // finally remap Class.create for backward compatability with prototype
  Class.create = function() {
    return Class.extend.apply(this, arguments);
  };

  /*
    Redistribution and use in source and binary forms, with or without modification, are
    permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list
      of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this
      list of conditions and the following disclaimer in the documentation and/or other
      materials provided with the distribution.
    * Neither the name of typicalnoise.com nor the names of its contributors may be
      used to endorse or promote products derived from this software without specific prior
      written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
    THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
    OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  // return whatever new name you want for Class
  return { 'Class': Class };
})();
