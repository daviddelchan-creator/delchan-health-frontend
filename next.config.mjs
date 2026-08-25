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
        // ¡Aquí está la magia! Apuntamos a la API real que descubriste con F12
        destination: 'https://delchan-health-portal-medplum.6jpght.easypanel.host/:path*'
      }
    ];
  }
};

export default nextConfig;