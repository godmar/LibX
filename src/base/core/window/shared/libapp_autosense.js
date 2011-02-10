
$(function () {
    $("head").bind("DOMNodeInserted", function (node) {
        var insertedNode = $(node.target);
        if (insertedNode.is('link[name="temp_feed"]')) {
            alert("'" + insertedNode.attr("href") + "' appended to head");
        }
    });
});