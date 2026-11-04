/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    // Rewrites CSS that Chrome 63 signage players cannot read. See the file for details.
    './config/postcss-legacy-css.cjs': {},
    autoprefixer: {},
  },
};

export default config;
