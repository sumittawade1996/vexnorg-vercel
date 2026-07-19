/**
 * generate-performer-bios-local.js
 *
 * Generates a short "About" paragraph for each performer page, written
 * to data/performer-bios.json as { "slug": "bio text" }.
 *
 * IMPORTANT — content boundary, read before editing the word banks:
 * These performers are real, named individuals. This generator
 * deliberately NEVER invents personal facts about them — no age, real
 * name, nationality, background, career start date, or biographical
 * claims of any kind. Every sentence here only describes what's
 * observably true from your own catalog (which studios/categories their
 * videos on this site fall under, how to browse their page) — nothing
 * about the person themselves. If you want real biographical content,
 * that has to come from a licensed performer-data source, not generated
 * text, since fabricated bios about real people is a misinformation risk
 * this script is designed to avoid.
 *
 * Free, no API key, deterministic (same slug always yields the same
 * bio), combinatorial slots so pages don't structurally repeat.
 *
 * Usage:
 *   node scripts/generate-performer-bios-local.js
 */

const fs = require('fs');
const path = require('path');

const { PERFORMERS } = require('../api/index.js');

const OUT_PATH = path.join(__dirname, '..', 'data', 'performer-bios.json');

function hashPick(str, salt, arr) {
    let h = 0;
    const s = str + '|' + salt;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return arr[h % arr.length];
}

// Every clause below is strictly about the CATALOG/PAGE, not the person —
// intentional, see file header.
const OPENERS = [
    (n) => `${n}'s page on this site brings together videos available across the catalog`,
    (n) => `This page is where you'll find videos featuring ${n} on this site`,
    (n) => `Videos featuring ${n} are gathered here from across the available catalog`,
    (n) => `${n}'s catalog page collects what's currently indexed under this name`,
    (n) => `Here you'll find the current set of videos listed under ${n}`,
    (n) => `${n} appears across a range of videos collected on this page`,
];

const SCOPE_CLAUSES = [
    `spanning several categories and studios represented in the catalog`,
    `drawn from multiple studios and tags available on the site`,
    `covering a range of content types indexed under this name`,
    `pulled together regardless of which studio originally released them`,
    `sourced from across the site's full video catalog`,
    `gathered from whichever studios and categories match this name`,
];

const BROWSE_TIPS = [
    `Use the sort options above to jump to trending, top rated, or the newest additions.`,
    `You can reorder the results above by rating, recency, or popularity.`,
    `Sort and pagination controls above let you browse by date or rating.`,
    `Switch between trending, latest, and top rated using the controls above.`,
    `Move between pages or change the sort order using the options above.`,
    `Use the filters above to browse newest uploads or highest rated first.`,
];

function buildBio(item) {
    const opener = hashPick(item.slug, 'bio-opener', OPENERS)(item.label);
    const scope = hashPick(item.slug, 'bio-scope', SCOPE_CLAUSES);
    const tip = hashPick(item.slug, 'bio-tip', BROWSE_TIPS);
    return `${opener}, ${scope}. ${tip}`;
}

function main() {
    const out = {};
    for (const item of PERFORMERS) {
        out[item.slug] = buildBio(item);
    }
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
    console.log(`Wrote ${Object.keys(out).length} performer bios to ${OUT_PATH}`);
}

main();
