/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for SDK browser compatibility
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@assistant-ui/react",
  ],

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Suppress punycode deprecation warning and MetaMask SDK warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/@react-native-async-storage/ },
    ];

    // Add externals for node-only packages
    config.externals.push("pino-pretty", "encoding");

    return config;
  },
};

module.exports = nextConfig;
