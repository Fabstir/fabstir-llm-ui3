/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for SDK browser compatibility
  transpilePackages: [
    "@fabstir/sdk-core",
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

    // Suppress punycode deprecation warning
    config.ignoreWarnings = [{ module: /node_modules\/punycode/ }];

    // Add externals for node-only packages
    config.externals.push("pino-pretty", "encoding");

    return config;
  },
};

module.exports = nextConfig;
