// per-page sandbox setup
// this sandbox script is evaluated first, before all others.
// In FF, the libxEnv object in the sandbox (currently) has autolink, but not coins
// root.js attaches libxEnv.coins to libxEnv.autolink for now, we link it back here
// to the libxEnv existing in the sandbox
//
// XXX we need a way to safely allow cues/sandbox scripts to provide properties
// that will be visible in the sandbox

libxEnv.coins = libxEnv.autolink.coins;
libxEnv.getXMLDocument = libxEnv.autolink.getXMLDocument;

