/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@ivakit/shared'],
    experimental: {
        serverComponentsExternalPackages: ['@libsql/client'],
    },
    images: {
        domains: ['localhost'],
    },
};

module.exports = nextConfig;
