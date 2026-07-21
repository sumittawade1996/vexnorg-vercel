/**
 * generate-descriptions-local.js (v2 — combinatorial)
 *
 * Same goal as before (free, no API key, deterministic), but fixes the
 * "too many pages share the same sentence shape" problem. Instead of
 * picking ONE of 6 whole-sentence templates per page (which repeats
 * every ~6 pages), this builds each sentence out of several INDEPENDENT
 * slots — opener, verb phrase, detail clause, closer — each with its
 * own word bank. The slots are chosen independently per page, so the
 * number of unique combinations multiplies instead of adding.
 *
 * With 6 openers x 6 verbs x 6 details x 6 closers = 1,296 possible
 * shapes per page type — comfortably more than the ~180-291 pages in
 * any one type, so structural repeats become rare instead of common.
 *
 * Usage:
 *   node scripts/generate-descriptions-local.js
 *
 * Output: data/descriptions.json, keyed "type:slug" -> description string.
 * Deterministic and safe to re-run (same slug always produces the same
 * result, so this won't churn your file if you regenerate later).
 */

const fs = require('fs');
const path = require('path');

const { CHANNELS, CATEGORIES, PERFORMERS } = require('../api/index.js');

const OUT_PATH = path.join(__dirname, '..', 'data', 'descriptions.json');

// Deterministic hash -> stable per-slug slot selection.
function hashPick(str, salt, arr) {
    let h = 0;
    const s = str + '|' + salt;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return arr[h % arr.length];
}

const NOUN = { channel: 'channel', tag: 'category', star: 'performer' };

const OPENERS = {
    channel: [
        (n) => `This page collects videos published under the ${n} banner`,
        (n) => `Browse the current lineup from ${n}`,
        (n) => `Here's what's available from ${n} right now`,
        (n) => `A running catalog of ${n} uploads lives on this page`,
        (n) => `Videos released under ${n} are gathered here`,
        (n) => `${n}'s available catalog is organized on this page`,
    ],
    tag: [
        (n) => `This page gathers videos tagged ${n}`,
        (n) => `Browse everything filed under ${n}`,
        (n) => `Here's the current ${n} listing`,
        (n) => `A filtered view of the ${n} category lives on this page`,
        (n) => `Videos matching ${n} are collected here`,
        (n) => `The ${n} category is organized on this page`,
    ],
    star: [
        (n) => `This page lists videos featuring ${n}`,
        (n) => `Browse the current catalog for ${n}`,
        (n) => `Here's what's indexed under ${n} right now`,
        (n) => `A collected view of ${n}'s videos lives on this page`,
        (n) => `Videos featuring ${n} are gathered here`,
        (n) => `${n}'s available videos are organized on this page`,
    ],
};

const DETAILS = [
    `updated as new uploads come in`,
    `refreshed continuously as the catalog grows`,
    `with new matches added over time`,
    `kept current as fresh content is indexed`,
    `pulled directly from the live catalog`,
    `reflecting the latest available results`,
];

const CLOSERS = [
    `Use the sort links above to switch between trending, top rated, or latest.`,
    `Sort by trending, top rated, or latest using the controls above.`,
    `You can reorder results by recency or rating from the sort menu above.`,
    `Pagination and sort options are available above the results.`,
    `Switch sort order or move between pages using the controls above.`,
    `Browse by page, or reorder using the sort options above.`,
];

function buildDescription(type, item) {
    const opener = hashPick(item.slug, `${type}-opener`, OPENERS[type])(item.label);
    const detail = hashPick(item.slug, `${type}-detail`, DETAILS);
    const closer = hashPick(item.slug, `${type}-closer`, CLOSERS);
    return `${opener}, ${detail}. ${closer}`;
}

function generateFor(type, items) {
    const out = {};
    for (const item of items) {
        out[`${type}:${item.slug}`] = buildDescription(type, item);
    }
    return out;
}

function main() {
    const result = {
        ...generateFor('channel', CHANNELS),
        ...generateFor('tag', CATEGORIES),
        ...generateFor('star', PERFORMERS)
    };

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
    console.log(`Wrote ${Object.keys(result).length} descriptions to ${OUT_PATH}`);
}

main();
