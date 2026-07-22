/**
 * build-css.js
 *
 * Regenerates public/styles.css — a purged, minified Tailwind build
 * containing only the classes actually used in api/index.js. Replaces
 * the old Tailwind CDN script (~124 KiB of render-blocking JavaScript)
 * with a small static CSS file (~11 KiB) that the browser can apply
 * immediately without executing any JavaScript first.
 *
 * WHEN TO RUN THIS: any time you add a NEW Tailwind class to
 * api/index.js that wasn't already used elsewhere in the file. If you
 * only reuse existing classes (bg-slate-900, text-red-500, etc.), you
 * don't need to rebuild — those are already in the compiled file.
 *
 * One-time setup (only needed once, if not already installed):
 *   npm install -D tailwindcss@3
 *
 * Usage:
 *   node scripts/build-css.js
 *
 * This regenerates public/styles.css directly — commit and push that
 * file afterward like any other change.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const configPath = path.join(projectRoot, 'tailwind.config.js');
const inputCssPath = path.join(projectRoot, 'tailwind-input.css');
const outputCssPath = path.join(projectRoot, 'public', 'styles.css');

// Write the Tailwind config if it doesn't exist yet, pointing at the
// actual server file so it scans the real class names in use.
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, `module.exports = {
  content: ["./api/index.js"],
  theme: { extend: {} },
  plugins: [],
}
`);
    console.log('Created tailwind.config.js');
}

// Write the minimal Tailwind input file if it doesn't exist yet.
if (!fs.existsSync(inputCssPath)) {
    fs.writeFileSync(inputCssPath, `@tailwind base;
@tailwind components;
@tailwind utilities;
`);
    console.log('Created tailwind-input.css');
}

fs.mkdirSync(path.dirname(outputCssPath), { recursive: true });

console.log('Building purged CSS...');
execSync(
    `npx tailwindcss -i "${inputCssPath}" -o "${outputCssPath}" --minify`,
    { cwd: projectRoot, stdio: 'inherit' }
);

const sizeKb = (fs.statSync(outputCssPath).size / 1024).toFixed(1);
console.log(`Done. public/styles.css is now ${sizeKb} KB.`);
console.log('Commit and push public/styles.css (and tailwind.config.js / tailwind-input.css if new) to deploy.');
