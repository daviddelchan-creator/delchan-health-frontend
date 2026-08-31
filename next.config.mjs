// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le decimos a Next.js que ignore los chequeos estrictos durante el despliegue
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/medplum/:path*',
        destination: 'https://delchan-health-portal-medplum.6jpght.easypanel.host/:path*'
      }
    ];
  }
};

export default nextConfig;