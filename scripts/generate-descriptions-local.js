/**
 * generate-descriptions-local.js
 *
 * Generates a short, varied description for every channel, category, and
 * performer page WITHOUT calling any external API — no Anthropic key,
 * no cost, runs instantly. It rotates through a bank of sentence
 * structures (keyed off each item's slug, so the same item always gets
 * the same result — deterministic, not random each run) so pages don't
 * all read as identical copy-paste text.
 *
 * This is a reasonable free stand-in for true AI-written unique prose.
 * It won't be as naturally varied as per-item AI generation, but it
 * fixes the "every page has the exact same sentence" problem, which is
 * the main thing worth avoiding for SEO.
 *
 * Usage:
 *   node scripts/generate-descriptions-local.js
 *
 * Output: data/descriptions.json, keyed "type:slug" -> description string.
 * Safe to re-run — fully regenerates the file (this one's free, so there's
 * no need to preserve partial progress like the API version does).
 */

const fs = require('fs');
const path = require('path');

const { CHANNELS, CATEGORIES, PERFORMERS } = require('../api/index.js');

const OUT_PATH = path.join(__dirname, '..', 'data', 'descriptions.json');

// Simple deterministic hash so the same slug always maps to the same
// template index (stable across re-runs, not random).
function hashIndex(str, mod) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h % mod;
}

const CHANNEL_TEMPLATES = [
    (name) => `Browse the ${name} library here, with new uploads added as they're released and sortable by trending, top rated, or latest.`,
    (name) => `This page collects videos published under the ${name} banner. Use the sort options above to jump straight to what's new or what's currently trending.`,
    (name) => `Everything currently available from ${name} lives on this page, updated as fresh content comes in. Switch between latest and top-rated to filter results.`,
    (name) => `A running collection of ${name} uploads, refreshed continuously. Sort by trending or latest to narrow down what you're looking for.`,
    (name) => `${name} content is organized here in one place, with pagination and sorting so you can browse by popularity or recency.`,
    (name) => `Find the current catalog of ${name} videos on this page. New releases are added over time, and you can reorder results by rating or date.`,
];

const CATEGORY_TEMPLATES = [
    (name) => `This page gathers videos tagged ${name}, pulled from across the catalog and updated as new matches appear.`,
    (name) => `Browse the ${name} category here — results are sorted by trending, top rated, or latest, whichever you prefer.`,
    (name) => `A filtered view of everything tagged ${name}, refreshed continuously and searchable by page.`,
    (name) => `Everything matching ${name} is collected on this page, with sort and pagination controls above the results.`,
    (name) => `This is the ${name} listing page — new matches are added automatically as the catalog updates.`,
    (name) => `Videos categorized under ${name} appear here, orderable by recency or rating using the controls above.`,
];

const PERFORMER_TEMPLATES = [
    (name) => `This page lists videos featuring ${name}, sortable by trending, top rated, or latest upload.`,
    (name) => `Browse ${name}'s available videos here, updated as new content is indexed.`,
    (name) => `A collected view of videos featuring ${name}, with sorting and pagination above the grid.`,
    (name) => `Find videos featuring ${name} on this page, refreshed as new matches come in from the catalog.`,
    (name) => `Everything currently indexed under ${name} appears here — use the sort options to browse by date or rating.`,
    (name) => `This page tracks videos featuring ${name}, searchable across multiple pages and sort orders.`,
];

function generateFor(type, items, templates) {
    const out = {};
    for (const item of items) {
        const idx = hashIndex(`${type}:${item.slug}`, templates.length);
        out[`${type}:${item.slug}`] = templates[idx](item.label);
    }
    return out;
}

function main() {
    const result = {
        ...generateFor('channel', CHANNELS, CHANNEL_TEMPLATES),
        ...generateFor('tag', CATEGORIES, CATEGORY_TEMPLATES),
        ...generateFor('star', PERFORMERS, PERFORMER_TEMPLATES)
    };

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
    console.log(`Wrote ${Object.keys(result).length} descriptions to ${OUT_PATH}`);
}

main();
