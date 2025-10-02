const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for SDK browser compatibility
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@assistant-ui/react",
  ],

  // Performance optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  webpack: (config, { isServer }) => {
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

    // Optimization: split chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // SDK and Web3 libraries
          web3: {
            name: "web3-libs",
            test: /[\\/]node_modules[\\/](ethers|viem|wagmi|@rainbow-me|@base-org)[\\/]/,
            priority: 40,
          },
          // UI libraries
          ui: {
            name: "ui-libs",
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|recharts)[\\/]/,
            priority: 30,
          },
          // Common libraries
          commons: {
            name: "commons",
            minChunks: 2,
            priority: 20,
          },
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
