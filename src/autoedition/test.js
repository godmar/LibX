$(document).ready(function() {
    $('#submit').click(function() {
        $.getJSON('findbyip/' + $('#ip').val() + "?callback=?", function(data) {
            outputHTML =
"Tested IP: " + data["ip"] + "<br />Tree timestamp: " + data["tree_mod"];
            for (index = 0; index < data["editions"].length; index = index + 1) {
                outputHTML = outputHTML + "<br />Result: id = \"" + data["editions"][index]["id"] + "\" description = \"" + data["editions"][index]["description"] + "\"";
            }
            $('#results').html(outputHTML);
        });
    });
});
