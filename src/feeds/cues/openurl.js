if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.type == "sersol") {
    autolink.exclude = [libxEnv.openUrlResolver.url.replace("http://", "")];
}
