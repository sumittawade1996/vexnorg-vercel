/**
 * csv-to-manual-overrides.js
 *
 * Converts a simple two-column CSV (key, text) into a properly formatted
 * JSON file for your manual content overrides — so you can write content
 * in a spreadsheet instead of hand-editing JSON syntax.
 *
 * CSV format expected (with header row):
 *   key,text
 *   channel:brazzers,"Brazzers is one of the longest-running studio brands..."
 *   tag:japanese,"This category brings together videos tagged Japanese..."
 *   star:johnny-sins,"One of the most recognizable names in the industry..."
 *
 * Notes on the CSV:
 * - If your text contains a comma, wrap that field in double quotes (as
 *   shown above) — standard CSV rule, Excel/Sheets does this for you
 *   automatically when you export.
 * - The "key" column must match your existing key format:
 *     channel:slug   (e.g. channel:brazzers)
 *     tag:slug       (e.g. tag:japanese — this covers categories AND
 *                     countries, since countries are just tag entries)
 *     star:slug      (for descriptions-manual.json)
 *   For performer-bios-manual.json specifically, just use the bare slug
 *   (e.g. johnny-sins) with no "star:" prefix, since that file is
 *   performer-only.
 *
 * Usage:
 *   node scripts/csv-to-manual-overrides.js input.csv data/descriptions-manual.json
 *   node scripts/csv-to-manual-overrides.js bios.csv data/performer-bios-manual.json
 *
 * Safe to re-run: if the output file already has entries, this MERGES
 * new/updated ones in rather than wiping it — so you can top up the
 * file incrementally without losing earlier manual entries.
 */

const fs = require('fs');
const path = require('path');

const [, , inputCsvPath, outputJsonPath] = process.argv;

if (!inputCsvPath || !outputJsonPath) {
    console.error('Usage: node scripts/csv-to-manual-overrides.js <input.csv> <output.json>');
    process.exit(1);
}

// Minimal CSV parser handling quoted fields with embedded commas — no
// external dependency needed for a simple two-column file like this.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') { field += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { field += char; }
        } else {
            if (char === '"') { inQuotes = true; }
            else if (char === ',') { row.push(field); field = ''; }
            else if (char === '\n' || char === '\r') {
                if (char === '\r' && next === '\n') i++; // handle \r\n
                if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
                row = []; field = '';
            } else { field += char; }
        }
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}

function main() {
    const rawCsv = fs.readFileSync(inputCsvPath, 'utf8');
    const rows = parseCsv(rawCsv).filter(r => r.length > 0 && r.some(cell => cell.trim() !== ''));

    if (rows.length === 0) {
        console.error('CSV appears empty.');
        process.exit(1);
    }

    // Assume first row is a header (key,text) — skip it.
    const header = rows[0].map(h => h.trim().toLowerCase());
    const keyIdx = header.indexOf('key');
    const textIdx = header.indexOf('text');
    if (keyIdx === -1 || textIdx === -1) {
        console.error('CSV header must contain "key" and "text" columns.');
        process.exit(1);
    }

    const dataRows = rows.slice(1);

    // Load existing output file if present, so we MERGE rather than overwrite.
    let existing = {};
    try {
        existing = JSON.parse(fs.readFileSync(outputJsonPath, 'utf8'));
    } catch (err) {
        existing = {}; // fine if it doesn't exist yet
    }

    let added = 0, updated = 0, skipped = 0;
    for (const row of dataRows) {
        const key = (row[keyIdx] || '').trim();
        const text = (row[textIdx] || '').trim();
        if (!key || !text) { skipped++; continue; }
        if (existing[key] !== undefined) updated++; else added++;
        existing[key] = text;
    }

    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
    fs.writeFileSync(outputJsonPath, JSON.stringify(existing, null, 2));

    console.log(`Done. Added: ${added}, Updated: ${updated}, Skipped (empty): ${skipped}.`);
    console.log(`Total entries in ${outputJsonPath}: ${Object.keys(existing).length}`);
}

main();
