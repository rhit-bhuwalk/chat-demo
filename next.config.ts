import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    // Exclude test files and directories from the build
    config.module.rules.push({
      test: /node_modules\/pdf-parse\/.*\.(pdf|test\.js)$/,
      use: 'ignore-loader'
    });

    // Ignore test directories in node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Add fallbacks for Node.js modules that might not be available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
