if (libx.cs) {
    libx.cs.baseurl = "../../../";
    try {
        libx.initialize(true);
    } catch(err) {
        libx.log.write("Error in libx.initialize(): " 
            + err.message + "\n Desc: " + err.description);
    }
}
