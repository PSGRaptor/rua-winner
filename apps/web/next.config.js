import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_PKG = path.resolve(__dirname, '..', '..', 'package.json');
let APP_VERSION = 'v0.0.0';
try {
    const raw = fs.readFileSync(ROOT_PKG, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.version) APP_VERSION = `v${parsed.version}`;
} catch {}

const isDesktopExport = process.env.NEXT_DESKTOP_EXPORT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Only export when building the desktop bundle
    ...(isDesktopExport ? { output: 'export', images: { unoptimized: true } } : {}),
    reactStrictMode: true,
    webpack: (config, { webpack }) => {
        config.plugins ??= [];
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.NEXT_PUBLIC_APP_VERSION': JSON.stringify(APP_VERSION),
            })
        );
        return config;
    },
};

export default nextConfig;
