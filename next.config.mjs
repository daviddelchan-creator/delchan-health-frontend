// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['qrcode.react'],
  async rewrites() {
    return [
      {
        source: '/api/medplum/:path*',
        // Apuntamos directamente a ubuntu-medplum-1 (API Backend)
        destination: 'http://ubuntu-medplum-1:8103/:path*'
      }
    ];
  }
};

export default nextConfig;