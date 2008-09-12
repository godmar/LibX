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
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

if (undefined == libxEnv.autolink)
    libxEnv.autolink = new Object();

libxEnv.autolink.TextExplorerClass = function ()
{

    this.textTransformerList = new Array();

    this.filterFlag = new Array();

    //Allow for prototype access within nested functions
    var instance = this;
    DFSStack = new Array();

    this.currentWindow = null;

    this.GetFilterCount
        = function()
        {
            return this.textTransformerList.length;
        };

    this.SetCurrentWindow 
        = function(currentWindow)
    {
        instance.currentWindow = currentWindow;
    };

    this.SetCurrentDocument
        = function(currentDocument)
        {
            for (var ctr = 0; ctr < this.textTransformerList.length; ++ctr)
            {
                this.textTransformerList[ctr].SetCurrentDocument(currentDocument);
            }
        };

    function DFSTraverse() 
    {
        var maxcnt = 25;    // do 25 nodes at a time
        var cnt = 0;
        var q;
        while (cnt++ < maxcnt && instance.DFSStack.length > 0) 
        {
            var n = instance.DFSStack.pop();
            var currentFlag = n.flag;
            var currentNode = n.node;

            //Check the node type
            if (instance.NodeType.TEXT_NODE == currentNode.nodeType)
            {
                //Check whether this node needs to be skipped by any
                //of the filters

                //Now run each enabled filter in order
                for (ctr = 0; ctr < instance.textTransformerList.length; ++ctr)
                {
                    //Check whether the filter is enabled
                    if (instance.CheckFilter(ctr, currentFlag))
                    {
                        var nodes = null;

                        //Pass the text node to the textTransformer
                        nodes = instance.textTransformerList[ctr].ProcessNode(currentNode);

                        if (null != nodes)
                        {
                            //We want to replace currentNode with the returned
                            //nodes
                            
                            

                            var currentParent = currentNode.parentNode;

                            var currentSibling = currentNode.nextSibling;

                            var removedNode = currentParent.removeChild(currentNode);
                            for (childIdx = 0; childIdx < nodes.length; ++childIdx)
                            {
                                currentParent.insertBefore(nodes[childIdx], currentSibling);
                            }

                            //Add the parent node back to the stack so that
                            //it'll be processed again.  For efficiency, we
                            //disable the current filter so that it doesn't
                            //run again on the same set of nodes
                            parentFlag = instance.DisableFilter(ctr, currentFlag);
                            instance.DFSStack.push({node: currentParent,
                                                      flag: parentFlag});

                            //Before running other filters, we should break out of this loop
                            //and let the other filters handle it the next time we get to
                            //this node
                            break;
                        }
                    }
                }
            }
            else 
            {
                nodeName = currentNode.nodeName.toLowerCase();

                //We go through the list of enabled TextTransformer objects
                //and disable them based on their skipped element property
                for (ctr = 0; ctr < instance.textTransformerList.length; ++ctr)
                {
                    if (instance.CheckFilter(ctr, currentFlag))
                    {
                        //Check to see whether this element is in the skipped
                        //element list
                        if (instance.textTransformerList[ctr].skippedElementList[nodeName])
                        {
                            //Disable this filter
                            currentFlag = instance.DisableFilter(ctr, currentFlag);
                        }
                    }
                }

                //Now push the children of that node onto the stack along
                //with the currentFlag
                for (var ctr = 0; ctr < currentNode.childNodes.length; ++ctr)
                {
                    instance.DFSStack.push( {node: currentNode.childNodes.item(ctr), 
                                             flag: currentFlag} );

                }
            }
        }

        //If there are still nodes on the stack, set a timeout for 20 ms
        if (0 < instance.DFSStack.length)
        {
            //window.setTimeout(DFSTraverse, 20);
            instance.currentWindow.setTimeout(DFSTraverse, 20);
        }
    }

    this.Traverse = function (root)
    {
        //invoke DFSTraverse
        instance.DFSStack = [ {node: root, flag: instance.filterFlag} ];
        DFSTraverse();
    }
}



/**
 * Add a TextTransformer object to the list of objects
 * that will process a given text node.
 *
 * @param {TextTransformer} object that handles processing of text node
 * @param {Array} array to store filter states
 */
libxEnv.autolink.TextExplorerClass.prototype.AddTextTransformer
= function (transformer)
{
    //TODO: Add code to compute/update intersection set
    this.filterFlag.push(true);
    this.textTransformerList.push(transformer);
}

/**
 * Enable a filter by setting the index in the array to true
 *
 * @param {number} index of the filter
 * @param {Array} current flag
 *
 * @return modified flag or null
 * @type {Array}
 */
libxEnv.autolink.TextExplorerClass.prototype.EnableFilter
    = function (index, currentFlag)
      {
          //Make a copy of the array to return
          toReturn = currentFlag.concat();

          //If index out of range
          if ((this.textTransformerList.length - 1) < index
                  || 0 > index )
              return toReturn;

          toReturn[index] = true;
          return toReturn;
      }

/**
 * Checks whether a given filter is enabled or not
 *
 * @param {number} index of filter
 * @param {string} current flag
 *
 * @return true if filter enabled, false otherwise
 * @type {boolean}
 */
libxEnv.autolink.TextExplorerClass.prototype.CheckFilter
    = function (index, currentFlag)
      {
          if ((this.textTransformerList.length - 1) < index
              || 0 > index )
              return false;

          return currentFlag[index];
      }

/**
 * Disable a filter by setting the index in the array to false
 *
 * @param {number} index of the filter
 * @param {string} current flag
 *
 * @return modified flag
 * @type {string}
 */
libxEnv.autolink.TextExplorerClass.prototype.DisableFilter 
    = function (index, currentFlag)
      {
          //Make a copy of the array to return
          toReturn = currentFlag.concat();

          //If index out of range
          if ((this.textTransformerList.length - 1) < index
              || 0 > index )
              return toReturn;

          toReturn[index] = false;
          return toReturn;
      }

/**
 * @final
 * Provide symbols for DOM node types
 */
libxEnv.autolink.TextExplorerClass.prototype.NodeType
    = {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
      };
