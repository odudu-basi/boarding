import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Alias react-native to react-native-web
      'react-native': 'react-native-web',
    },
  },

  // Transpile react-native-web
  transpilePackages: [
    'react-native',
    'react-native-web',
  ],
};

export default nextConfig;
