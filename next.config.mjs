// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/medplum/:path*',
        // Apuntamos exactamente al dominio del backend (ubuntu-medplum-1) en Easypanel
        destination: 'https://delchan-health-portal-medplum.6jpght.easypanel.host/:path*'
      }
    ];
  }
};

export default nextConfig;