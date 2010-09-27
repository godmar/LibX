
$('#publish').live('click', function() {
    chrome.extension.sendRequest({
        type: "clearCache"
    });
});
