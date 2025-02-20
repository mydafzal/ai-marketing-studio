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
      }
    ],
  },
  reactStrictMode: false,
}
