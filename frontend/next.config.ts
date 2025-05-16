import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'randomuser.me',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
                pathname: '**',
            },
        ],
    },
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }
};

export default nextConfig;