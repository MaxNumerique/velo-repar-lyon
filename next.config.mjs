import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  output: 'standalone',
  turbopack: {},
  outputFileTracingIncludes: {
    '/**/*': ['node_modules/postgres-*/**/*']
  }
};

export default withPWA(nextConfig);
