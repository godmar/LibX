// per-page sandbox setup
// this sandbox script is evaluated first, before all others.
//
// XXX we need a way to safely allow cues/sandbox scripts to provide properties
// that will be visible in the sandbox - for now, smuggle them via libxEnv.xisbn

for (var p in libxEnv.xisbn.smuggle) {
    libxEnv[p] = libxEnv.xisbn.smuggle[p];
}

