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

// work-around for non-deterministic cue file execution order
if (undefined == libxEnv.autolink)
    libxEnv.autolink =  { };

var autolink = libxEnv.autolink;

/*
 * class: TextExplorerClass
 *
 * Handles traversing the DOM tree and finding text nodes.  It stores
 * a list of TextTransformerClass objects that will handle transforming
 * text nodes.
 */
autolink.textExplorerClass = function ()
{

    /*
     * array: textTransformerList
     *
     * Stores a list of TextTransformerClass objects
     */
    this.textTransformerList = new Array();

    /*
     * array: filterFlag
     *
     * An array of booleans indicating whether a particular TextExplorerClass
     * is currently enabled.
     */
    this.filterFlag = new Array();

    //Allow for prototype access within nested functions
    var instance = this;

    DFSStack = new Array();

    /*
     * object: currentWindow
     *
     * Store a reference to the current window object (used for invoking
     * setTimeout.
     */
    this.currentWindow = null;

    /*
     * function: getFilterCount
     *
     * Returns the number of TextExplorerClass objects stored in
     * this class
     *
     * returns: integer
     */
    this.getFilterCount
        = function()
        {
            return this.textTransformerList.length;
        };

    /*
     * function: setCurrentWindow
     *
     * Sets the reference to the window object that this class uses (for
     * calling setTimeout)
     */
    this.setCurrentWindow 
        = function(currentWindow)
    {
        instance.currentWindow = currentWindow;
    };

    /*
     * function: setCurrentDocument
     *
     * Sets the reference to the document object that this class uses 
     */

    this.setCurrentDocument
        = function(currentDocument)
        {
            for (var ctr = 0; ctr < this.textTransformerList.length; ++ctr)
            {
                this.textTransformerList[ctr].setCurrentDocument(currentDocument);
            }
        };

    /*
     * function: dfsTraverse
     *
     * Performs a depth first traversal of the DOM tree.  Uses setTimeout
     * to call itself
     */
    function dfsTraverse() 
    {
        var maxcnt = 25;    // do 25 nodes at a time
        var cnt = 0;
        var q;
        while (cnt++ < maxcnt && instance.dfsStack.length > 0) 
        {
            var n = instance.dfsStack.pop();
            var currentFlag = n.flag;
            var currentNode = n.node;

            //Check the node type
            if (instance.nodeType.TEXT_NODE == currentNode.nodeType)
            {
                //Check whether this node needs to be skipped by any
                //of the filters

                //Now run each enabled filter in order
                for (ctr = 0; ctr < instance.textTransformerList.length; ++ctr)
                {
                    //Check whether the filter is enabled
                    if (instance.checkFilter(ctr, currentFlag))
                    {
                        var nodes = null;

                        //Pass the text node to the textTransformer
                        nodes = instance.textTransformerList[ctr].processNode(currentNode);

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
                            parentFlag = instance.disableFilter(ctr, currentFlag);
                            instance.dfsStack.push({node: currentParent,
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
                    if (instance.checkFilter(ctr, currentFlag))
                    {
                        //Check to see whether this element is in the skipped
                        //element list
                        if (instance.textTransformerList[ctr].skippedElementList[nodeName])
                        {
                            //Disable this filter
                            currentFlag = instance.disableFilter(ctr, currentFlag);
                        }
                    }
                }

                //Now push the children of that node onto the stack along
                //with the currentFlag
                for (var ctr = 0; ctr < currentNode.childNodes.length; ++ctr)
                {
                    instance.dfsStack.push( {node: currentNode.childNodes.item(ctr), 
                                             flag: currentFlag} );

                }
            }
        }

        //If there are still nodes on the stack, set a timeout for 20 ms
        if (0 < instance.dfsStack.length)
        {
            instance.currentWindow.setTimeout(dfsTraverse, 20);
        }
    }

    this.traverse = function (root)
    {
        //invoke dfsTraverse
        instance.dfsStack = [ {node: root, flag: instance.filterFlag} ];
        dfsTraverse();
    }
}



/*
 * function: addTextTransformer
 *
 * Add a TextTransformer object to the list of objects
 * that will process a given text node.
 *
 * parameters:
 *
 * transformer - object that handles processing of text node
 *
 */
autolink.textExplorerClass.prototype.addTextTransformer
= function (transformer)
{
    //TODO: Add code to compute/update intersection set
    this.filterFlag.push(true);
    this.textTransformerList.push(transformer);
}

/*
 * function: enableFilter
 *
 * Enable a filter by setting the index in the array to true
 *
 * parameters:
 *
 * index       - index of the filter (in the filter list)
 * currentFlag - array of boolean values to act upon
 *
 * returns:
 *
 * An array of booleans with the boolean at the corresponding index set to 
 * true
 */
autolink.textExplorerClass.prototype.enableFilter
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

/*
 * function: checkFilter
 *
 * Checks whether a given filter is enabled or not
 *
 * parameters:
 * index       - index of filter
 * currentFlag - array of booleans corresponding to filter list state
 *
 * returns:
 * true if filter is enabled.  false otherwise
 */
autolink.textExplorerClass.prototype.checkFilter
    = function (index, currentFlag)
      {
          if ((this.textTransformerList.length - 1) < index
              || 0 > index )
              return false;

          return currentFlag[index];
      }

/*
 * function: disableFilter
 *
 * Disables a filter by setting the index in the array to false
 *
 * parameters:
 *
 * index       - index of the filter
 * currentFlag - array of booleans corresponding to filter list state
 *
 * returns:
 *
 * An array of booleans with the boolean at the index specified set to false.
 */
autolink.textExplorerClass.prototype.disableFilter 
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

/*
 * variable: NodeType
 *
 * Provide symbols for DOM node types
 */
autolink.textExplorerClass.prototype.nodeType
    = {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
      };
