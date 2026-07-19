/**
 * generate-descriptions.js
 *
 * Generates a unique, short SEO description for every channel, category,
 * and performer page, using the Claude API, and writes them to
 * data/descriptions.json as { "type:slug": "description text" }.
 *
 * Resumable: if you re-run it, entries already in descriptions.json are
 * skipped, so a failed/interrupted run doesn't waste API calls redoing
 * work. Delete a key from the JSON file if you want it regenerated.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-xxxx node scripts/generate-descriptions.js
 *
 * Optional flags:
 *   --only=channel      only process one type (channel | tag | star)
 *   --limit=20          stop after N new descriptions (useful for a test run)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { CHANNELS, CATEGORIES, PERFORMERS } = require('../api/index.js');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY environment variable.');
    process.exit(1);
}

const DESCRIPTIONS_PATH = path.join(__dirname, '..', 'data', 'descriptions.json');
const CONCURRENCY = 3;         // parallel API calls in flight at once
const DELAY_MS = 300;          // small delay between batch waves, be nice to rate limits

const args = process.argv.slice(2);
const onlyArg = args.find(a => a.startsWith('--only='));
const limitArg = args.find(a => a.startsWith('--limit='));
const ONLY = onlyArg ? onlyArg.split('=')[1] : null;   // 'channel' | 'tag' | 'star'
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

function loadExisting() {
    try {
        return JSON.parse(fs.readFileSync(DESCRIPTIONS_PATH, 'utf8'));
    } catch (err) {
        return {};
    }
}

function saveAll(data) {
    fs.mkdirSync(path.dirname(DESCRIPTIONS_PATH), { recursive: true });
    fs.writeFileSync(DESCRIPTIONS_PATH, JSON.stringify(data, null, 2));
}

function buildPrompt(pageType, item) {
    const typeLabel = { channel: 'channel', tag: 'category', star: 'performer' }[pageType];
    return `You are writing a short SEO description for a page on an adult video
aggregator site. The description will appear at the top of a ${typeLabel}
listing page, above a grid of videos.

Page type: ${typeLabel}
Name: ${item.label}

Write 2-3 sentences (40-60 words) that:
- Describe what visitors will find on this page in plain, factual language
- Are unique in wording and structure from any other page's description
  (avoid generic templated phrasing like "Watch the best X videos")
- Include the name "${item.label}" once naturally for SEO, not stuffed
- Stay tasteful and non-explicit — informational tone, not graphic description
- Do not make claims you can't verify (view counts, "top rated" claims,
  awards, etc.)

Output only the description text, no preamble, no quotation marks, no extra commentary.`;
}

async function generateOne(pageType, item) {
    const prompt = buildPrompt(pageType, item);
    const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
            model: 'claude-sonnet-4-6',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
        },
        {
            headers: {
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
        }
    );
    const textBlock = response.data.content.find(b => b.type === 'text');
    return textBlock ? textBlock.text.trim() : null;
}

async function runPool(tasks, concurrency, worker) {
    let i = 0;
    let processed = 0;
    async function next() {
        while (i < tasks.length && processed < LIMIT) {
            const idx = i++;
            processed++;
            await worker(tasks[idx]);
            if (DELAY_MS) await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }
    const workers = Array.from({ length: concurrency }, next);
    await Promise.all(workers);
}

async function main() {
    const existing = loadExisting();

    const groups = [
        { type: 'channel', items: CHANNELS },
        { type: 'tag', items: CATEGORIES },
        { type: 'star', items: PERFORMERS }
    ].filter(g => !ONLY || g.type === ONLY);

    const todo = [];
    for (const group of groups) {
        for (const item of group.items) {
            const key = `${group.type}:${item.slug}`;
            if (!existing[key]) {
                todo.push({ type: group.type, item, key });
            }
        }
    }

    console.log(`${todo.length} descriptions to generate (${Object.keys(existing).length} already done).`);
    if (todo.length === 0) return;

    let done = 0;
    let failed = 0;

    await runPool(todo, CONCURRENCY, async (task) => {
        try {
            const description = await generateOne(task.type, task.item);
            if (description) {
                existing[task.key] = description;
                done++;
                if (done % 10 === 0) {
                    saveAll(existing); // periodic checkpoint save
                    console.log(`  ...${done} done so far`);
                }
            }
        } catch (err) {
            failed++;
            console.error(`Failed on ${task.key}:`, err.response?.data?.error?.message || err.message);
        }
    });

    saveAll(existing);
    console.log(`Done. Generated ${done} new descriptions, ${failed} failures. Total saved: ${Object.keys(existing).length}`);
}

main();
