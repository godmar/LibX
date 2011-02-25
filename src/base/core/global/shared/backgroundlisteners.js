
libx.extension.addListener("clearCache", function (request, sender, sendResponse) {

    libx.initialize.reload();
    sendResponse({});

});