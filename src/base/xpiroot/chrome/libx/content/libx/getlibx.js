/*
 * Firefox-specific retrieval of the global LibX object.
 */

(function () {
    libx = Components.classes['@libx.org/libxcomponent;1'].getService().wrappedJSObject.libx;
})();

window.addEventListener('load', function() {
        
    var fullView = document.getElementById('full-view');
    fullView.style.backgroundColor = 'white';
    fullView.style.border = '1px solid #ccc';
    fullView.style.padding = '8px';
    
    var simpleView = document.getElementById('simple-view');
    simpleView.style.width = '180px';
    simpleView.style.backgroundColor = 'white';
    simpleView.style.border = '1px solid #ccc';
    simpleView.style.padding = '8px';
    simpleView.style.paddingBottom = '20px';

}, false);