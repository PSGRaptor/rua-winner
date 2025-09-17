/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // 👇 This makes Next transpile our workspace lib during dev/build
    transpilePackages: ["@rua-winner/core"]
};
export default nextConfig;
