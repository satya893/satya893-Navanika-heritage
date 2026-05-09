import type { NextConfig } from "next";

const EXTERNAL_PACKAGES = [
  'firebase-admin',
  '@google-cloud/firestore',
  '@google-cloud/storage',
  'google-gax',
  'protobufjs',
  '@grpc/grpc-js',
  '@grpc/proto-loader',
  'grpc',
  'nodemailer',
  'razorpay',
  '@opentelemetry/api',
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: EXTERNAL_PACKAGES,
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // config.externals can be a function, array, or object in Next.js.
      // We must wrap/extend it rather than replace it.
      const originalExternals = config.externals;

      const ourExternalsFn = (
        { request }: { request: string },
        callback: (err?: any, result?: string) => void
      ) => {
        if (EXTERNAL_PACKAGES.some((mod) => request === mod || request.startsWith(mod + '/'))) {
          return callback(undefined, 'commonjs ' + request);
        }
        callback();
      };

      if (typeof originalExternals === 'function') {
        config.externals = (ctx: any, cb: any) => {
          ourExternalsFn(ctx, (err: any, result: any) => {
            if (result !== undefined) return cb(err, result);
            (originalExternals as Function)(ctx, cb);
          });
        };
      } else if (Array.isArray(originalExternals)) {
        config.externals = [...originalExternals, ourExternalsFn];
      } else {
        config.externals = [ourExternalsFn];
      }
    }
    return config;
  },
};

export default nextConfig;

