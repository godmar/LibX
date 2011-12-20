try {
    libx.initialize(true);
} catch (er) {
    console.log("Error in libx.initialize(): " + er);
}

libx.config.EditionConfigurationReader.defaultpkgURL = "http://libx.org/libx2/libapps/libxcore";

