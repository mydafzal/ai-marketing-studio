/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '/**'
      },
      // Add a pattern for the Facebook CDN(s)
      {
        protocol: 'https',
        hostname: '*.xx.fbcdn.net',
        port: '',
        pathname: '/**'
      },
      // Add Facebook business domain for creative previews
      {
        protocol: 'https',
        hostname: 'business.facebook.com',
        port: '',
        pathname: '/**'
      },
      // Add Facebook generic domain
      {
        protocol: 'https',
        hostname: '*.facebook.com',
        port: '',
        pathname: '/**'
      }
    ],
  },
  // Add header configuration to allow iframes from Facebook domains
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'self' *.facebook.com facebook.com *.xx.fbcdn.net business.facebook.com;`,
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb' // Increased limit for image data
    },
    // Add these settings from the previous api config
    serverComponentsExternalPackages: []
  }
}