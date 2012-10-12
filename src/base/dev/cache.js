$(function() {
    var filename = null;
    libx.storage.cacheStore.find({
        success: function(files) {
            files.sort();
            for(var i = 0; i < files.length; i++) {
                var link = $('<a href="#">' + files[i] + '</a><br/>');
                link.click(function() {
                    $('a', '#cached-items').css('background-color', '#fff');
                    $(this).css('background-color', '#ddd');
                    filename = $(this).text();
                    function getItem(cache, elemId) {
                        cache.getItem({
                            key: filename,
                            success: function(data) {
                                $('#' + elemId).val(data);
                            }
                        });
                    }
                    getItem(libx.storage.cacheStore, 'item');
                });
                $('#cached-items').append(link);
            }
        }
    });
    $('#save-changes').click(function() {
        if(filename == null)
            return;
        function setItem(cache, elemId) {
            cache.setItem({
                key: filename,
                value: $('#' + elemId).val()
            });
        }
        setItem(libx.storage.cacheStore, 'item');
        setItem(libx.storage.metacacheStore, 'meta-item');
    });
    $('#clear-cache').click(function() {
        libx.storage.metacacheStore.clear();
        libx.storage.cacheStore.clear();
    });
});

