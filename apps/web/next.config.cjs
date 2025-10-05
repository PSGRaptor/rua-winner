// apps/web/next.config.js
/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

// Resolve root package.json (two levels up from apps/web)
const ROOT_PKG = path.resolve(__dirname, '..', '..', 'package.json');

let APP_VERSION = 'v0.0.0';
try {
    const raw = fs.readFileSync(ROOT_PKG, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version) APP_VERSION = `v${parsed.version}`;
} catch {
    // keep default if not found; don't crash builds
}

const nextConfig = {
    reactStrictMode: true,

    // Use standalone for electron packaging & serverless-like deploys
    output: 'standalone',

    // Next/Image doesn’t need dynamic optimization inside Electron
    images: { unoptimized: true },

    // Transpile our workspace lib
    transpilePackages: ['@rua-winner/core'],

    // Make the version available in the browser (About modal)
    env: {
        NEXT_PUBLIC_APP_VERSION: APP_VERSION,
    },

    // Reduce NTFS rename/cache races on Windows during production build
    webpack(config, { dev }) {
        if (!dev) {
            config.cache = false;
        }

        // Hard-define the version, even if a runner strips env
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.NEXT_PUBLIC_APP_VERSION': JSON.stringify(APP_VERSION),
            })
        );

        return config;
    },
};

module.exports = nextConfig;
