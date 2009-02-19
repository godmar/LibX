/* 
 * About: License
 *
 * ***** BEGIN LICENSE BLOCK *****
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
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** 
 */

/**
 * Handles traversing the DOM tree and finding text nodes.  It stores
 * a list of TextTransformer objects that will handle transforming
 * text nodes.
 *
 * @class
 */
libx.libapp.TextExplorer = libx.core.Class.create(
    /** @lends libx.libapp.TextExplorer.prototype */{

    nodesPerChunk : 40,

    intervalBetweenTimeouts : 15,

    /**
     * @param {int} nodesPerChunk
     * @param {int} intervalBetweenTimeouts
     */
    initialize : function (nodesPerChunk, intervalBetweenTimeouts) {
        if (nodesPerChunk != undefined)
            this.nodesPerChunk = nodesPerChunk;
        if (intervalBetweenTimeouts != undefined)
            this.intervalBetweenTimeouts = intervalBetweenTimeouts;

        this.textTransformerList = [];

        /*
         * An array of booleans indicating whether a particular TextExplorer
         * is currently enabled.
         */
        this.enabledTransformers = new libx.utils.collections.Vector();
    },

    /**
     * Traverse DOM tree in depth-first fashion.
     *
     * Splits work into chunks spread across timeouts to avoid
     * blocking the browser.
     */
    traverse : function (root) {
        var self = this;

        self.dfsStack = [ {node: root, enabledTransformers: self.enabledTransformers} ];
        dfsTraverse();

        function dfsTraverse() 
        {
            var cnt = 0;
            while (cnt++ < self.nodesPerChunk && self.dfsStack.length > 0) 
            {
                var n = self.dfsStack.pop();    // use .shift() for BFS
                var enabledTransformers = n.enabledTransformers;
                var currentNode = n.node;

                // A node may be scheduled for processing, but it may no longer be part of
                // the DOM - for instance, if a link was introduced by a text transformer.
                // Skip those nodes.
                if (currentNode.parentNode == null)
                    continue;

                if (self.nodeType.TEXT_NODE === currentNode.nodeType) {
                    processTextNode(currentNode, enabledTransformers);
                } else {
                    processNonTextNode(currentNode, enabledTransformers);
                }
            }

            // Schedule timeout to process remaining nodes, if any
            if (self.dfsStack.length > 0) {
                libx.utils.timer.setTimeout(dfsTraverse, self.intervalBetweenTimeouts);
            }

            function processTextNode(textNode, enabledTransformers) {
                for (var ctr = 0; ctr < self.textTransformerList.length; ++ctr)
                {
                    if (!enabledTransformers.get(ctr))
                        continue;

                    // Pass the text node to the textTransformer
                    var nodes = self.textTransformerList[ctr].processNode(textNode);
                    
                    // Continue if no change
                    if (nodes == null)
                        continue;

                    // Replace textNode with the returned nodes, and schedule
                    // returned nodes for processing using the remaining text
                    // transformers
                    var currentParent = textNode.parentNode;
                    var currentSibling = textNode.nextSibling;
                    currentParent.removeChild(textNode);

                    var remainingTransformers = enabledTransformers.clone();
                    for (var j = 0; j <= ctr; j++)
                        remainingTransformers.set(j, false);

                    for (var j = 0; j < nodes.length; j++) {
                        // nodes[j] is dual-typed
                        // it may be either a node, or a pair [node, callback]
                        if ('0' in nodes[j]) {
                            var node = nodes[j][0];
                            var cbfunc = nodes[j][1];
                        } else {
                            var node = nodes[j];
                            var cbfunc = null;
                        }
                        currentParent.insertBefore(node, currentSibling);
                        if (cbfunc)
                            cbfunc(node);

                        self.dfsStack.push({node: node,
                                            enabledTransformers: remainingTransformers});
                    }

                    break;
                }
            }

            function processNonTextNode(currentNode, enabledTransformers) { 
                var nodeName = currentNode.nodeName.toLowerCase();

                // Disable transformers that list this element in their
                // skippedElementList list. 
                enabledTransformers = enabledTransformers.clone();
                for (var ctr = 0; ctr < self.textTransformerList.length; ctr++)
                {
                    if (nodeName in self.textTransformerList[ctr].skippedElements) {
                        enabledTransformers.set(ctr, false);
                    }
                }

                // Schedule children for processing
                for (var ctr = 0; ctr < currentNode.childNodes.length; ctr++)
                {
                    self.dfsStack.push({node: currentNode.childNodes.item(ctr), 
                                        enabledTransformers: enabledTransformers});
                }
            }
        }
    },

    /**
     * Add a TextTransformer object to the list of objects
     * that will process a given text node.
     *
     * @param {TextTransformer}
     */
    addTextTransformer : function (transformer)
    {
        //TODO: Add code to compute/update intersection set
        this.enabledTransformers.add(true);
        this.textTransformerList.push(transformer);
    },

    /**
     * Provide symbols for DOM node types
     * @static
     */
    nodeType : {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
    }
});

