import { readFileSync } from 'fs'

// Every @radix-ui package in the lockfile, including ones only pulled in by other packages.
const radixPackages = [...new Set(readFileSync('pnpm-lock.yaml', 'utf8').match(/@radix-ui\/[a-z-]+/g))]

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // These packages ship syntax newer than the browserslist target (Chrome 63 signage players).
  transpilePackages: ['tailwind-merge', 'uuid', ...radixPackages],
}

export default nextConfig
