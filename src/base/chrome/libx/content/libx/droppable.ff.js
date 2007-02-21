/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *
 * ***** END LICENSE BLOCK ***** */

/*

How to use:
include in .xul file
   <script type="application/x-javascript" src="chrome://global/content/nsDragAndDrop.js"/>
   <script type="application/x-javascript" src="chrome://global/content/nsTransferable.js"/> 
   <script type="application/x-javascript" src="chrome://yourextension/..../droppable.js"/> 

Define a function to call when text is dropped.
Determine object on which to drop text.

Example 1:

      function textWasDropped(text) {
      }

      var dropTargetButton = document.getElementById("Groowe-SearchNextBtn");
      new TextDropTarget(textWasDropped).attachToElement(dropTargetButton);

Example 2:

      tdt = new TextDropTarget(function (data) {
        alert("you dropped `" + data + "'"); 
      });
      var dropTargetButton = document.getElementById("Groowe-SearchNextBtn");
      tdt.attachToElement(dropTargetButton);

*/

function TextDropTarget(func) {
    this.callback = func;
}

TextDropTarget.prototype = {
    onDrop: function (evt,dropdata,session) {
        var d = dropdata.data;
        if (d != "") {
            d = d.replace(/\s+/g, " ");
            // d = d.replace(/[^\040-\177]/g, "");
            this.callback(d);
        } 
    },
    onDragOver: function (evt,flavour,session){},
    getSupportedFlavours : function () {
        var flavours = new FlavourSet();
        flavours.appendFlavour("text/unicode");
        return flavours;
    },
    attachToElement: function (el) {
        var self = this;        // capture this
        el.addEventListener("dragdrop", function(e) { nsDragAndDrop.drop(e, self); }, false);
        el.addEventListener("dragover", function(e) { nsDragAndDrop.dragOver(e, self); }, false);
    }
};

// vim: ts=4
