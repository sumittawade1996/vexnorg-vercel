const express = require('express');
const axios = require('axios');
const slugify = require('slugify');

const app = express();
const DOMAIN = 'https://vexn.org';

// -------------------------------------------------------------
// 1. CATEGORY LIST (CONSOLIDATED — no auto-generated modifier spam)
// -------------------------------------------------------------
// CHANGE: Removed the BASE_CATEGORIES x MODIFIERS cross-product (was ~135
// near-duplicate pages like "Brazzers hd videos", "Brazzers full movie",
// "Brazzers trending clips"...). That pattern reads as doorway pages to
// search engines and risks algorithmic or manual suppression.
// Keep ONE page per real category. Add unique editorial copy per category
// below instead of relying on keyword variants to create "more pages".
const CATEGORIES = [
    { slug: 'brazzers', label: 'Brazzers', blurb: 'Studio-produced scenes from one of the best-known adult production brands.' },
    { slug: 'reality-kings', label: 'Reality Kings', blurb: 'Reality-style scenarios and recurring series content.' },
    { slug: 'digital-playground', label: 'Digital Playground', blurb: 'High-production narrative scenes.' },
    { slug: 'naughty-america', label: 'Naughty America', blurb: 'Long-running studio series with a large back catalog.' },
    { slug: 'amateur', label: 'Amateur', blurb: 'User- and creator-submitted clips outside studio production.' },
    { slug: 'milf', label: 'MILF', blurb: 'Scenes featuring mature performers.' },
    { slug: 'anal', label: 'Anal', blurb: 'Category page for anal-focused content.' },
    { slug: 'college', label: 'College', blurb: 'College/campus-themed scenes.' },
    { slug: 'lesbian', label: 'Lesbian', blurb: 'Scenes featuring lesbian performers.' },
    { slug: 'pov', label: 'POV', blurb: 'Point-of-view perspective videos.' },
    { slug: 'creampie', label: 'Creampie', blurb: 'Creampie-focused category page.' },
];

function findCategory(slug) {
    return CATEGORIES.find(c => c.slug === slug);
}

function toSlug(text) {
    return slugify(text, { lower: true, strict: true });
}

// -------------------------------------------------------------
// 2. SIMPLE IN-MEMORY CACHE
// -------------------------------------------------------------
// CHANGE: Previously every route hit the upstream API live and returned a
// bare 500 on any failure/timeout. If Googlebot crawls during an upstream
// hiccup, it sees a 500 — that damages crawl budget and can get pages
// dropped from the index. Cache last-good responses with a TTL so a
// transient failure serves slightly-stale content instead of an error.
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function cachedGet(key, url) {
    const entry = cache.get(key);
    const now = Date.now();
    if (entry && now - entry.time < CACHE_TTL_MS) {
        return entry.data;
    }
    try {
        const res = await axios.get(url, { timeout: 8000 });
        cache.set(key, { data: res.data, time: now });
        return res.data;
    } catch (err) {
        if (entry) return entry.data; // serve stale on failure rather than 500
        throw err;
    }
}

// -------------------------------------------------------------
// 3. HTML SSR TEMPLATE
// -------------------------------------------------------------
// CHANGE: Added Open Graph / Twitter card tags (improves click-through when
// shared/linked) and a JSON-LD slot. Removed the third-party ad script
// (supportiveinvoicevarnish.com) — that domain pattern is commonly
// associated with pop-under/redirect ad networks that get flagged by
// Google Safe Browsing. A Safe Browsing flag is far more damaging to
// rankings and traffic than losing that ad slot. Replace `AD_SLOT_HTML`
// with a vetted ad network's official embed if/when you pick one.
const AD_SLOT_HTML = `
    <div class="bg-slate-900/40 rounded-lg p-3 border border-slate-800 flex items-center justify-center col-span-1 min-h-[250px]">
        <span class="text-[9px] font-mono text-slate-600 uppercase">Ad slot — insert vetted network embed here</span>
    </div>
`;

function renderHTMLPage({ title, description, keywords, canonicalPath, contentHtml, ogImage, jsonLd }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="robots" content="index, follow">
    <meta name="rating" content="adult">
    <meta name="rating" content="RTA-5042-1996-1400-1577-RTA">
    <link rel="canonical" href="${DOMAIN}${canonicalPath}">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${DOMAIN}${canonicalPath}">
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">

    <script src="https://cdn.tailwindcss.com"></script>
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col">
    <header class="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <a href="/" class="text-2xl font-black text-red-500">STREAM<span class="text-white">HUB</span>ELITE</a>
            <form action="/search" method="GET" class="flex gap-2">
                <input type="text" name="q" placeholder="Search keywords..." class="bg-slate-950 text-white px-3 py-1 rounded border border-slate-800 text-sm">
                <button type="submit" class="bg-red-600 px-4 py-1 rounded text-sm font-bold">Search</button>
            </form>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        ${contentHtml}
    </main>

    <footer class="bg-slate-900 border-t border-slate-800 p-6 text-center text-xs text-slate-500">
        <p>&copy; ${new Date().getFullYear()} StreamHub Elite. All Rights Reserved. 18+ Adult Content.</p>
    </footer>
</body>
</html>`;
}

function renderVideoGrid(videos) {
    let html = '';
    videos.forEach((v, index) => {
        html += `
            <div class="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                <a href="/video/${v.id}/${toSlug(v.title)}">
                    <img src="${v.default_thumb.src}" alt="${v.title}" class="w-full h-48 object-cover" loading="lazy">
                    <div class="p-3">
                        <h2 class="text-sm font-bold truncate text-slate-200">${v.title}</h2>
                        <span class="text-xs text-slate-400 font-mono">${v.length_min} mins</span>
                    </div>
                </a>
            </div>
        `;
        if ((index + 1) % 4 === 0) {
            html += AD_SLOT_HTML;
        }
    });
    return html;
}

// -------------------------------------------------------------
// 4. ROUTES
// -------------------------------------------------------------

app.get('/', async (req, res) => {
    try {
        const data = await cachedGet('home', 'https://www.eporner.com/api/v2/video/search/?per_page=20&thumbsize=big&hd=1');
        const videos = data.videos || [];

        const categoryLinks = CATEGORIES.map(c => `
            <a href="/tag/${c.slug}" class="px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded text-slate-300 hover:text-red-400">${c.label}</a>
        `).join('');

        const content = `
            <h1 class="text-2xl font-bold mb-4 text-red-500">Trending HD Streams</h1>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">${renderVideoGrid(videos)}</div>
            <h2 class="text-lg font-bold mb-3 text-slate-400">Browse Categories</h2>
            <div class="flex flex-wrap gap-2">${categoryLinks}</div>
        `;

        res.send(renderHTMLPage({
            title: 'StreamHub Elite | Watch Free Ultra-HD Adult Streams',
            description: 'Stream thousands of HD inline video streams online for free.',
            keywords: CATEGORIES.map(c => c.label).join(', '),
            canonicalPath: '/',
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send("We're temporarily unable to load the home feed. Please try again shortly.");
    }
});

// CHANGE: Route now keyed off the fixed CATEGORIES list (one real page per
// category) instead of accepting any arbitrary slug and re-querying the API
// with a synthesized "category + modifier" string. Unknown slugs get a 404
// instead of silently generating a new thin page — this stops the page
// count from growing unbounded and keeps Google from finding an infinite
// crawl space.
app.get('/tag/:slug', async (req, res) => {
    const category = findCategory(req.params.slug);
    if (!category) return res.status(404).send('Category not found');

    try {
        const data = await cachedGet(
            `tag:${category.slug}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(category.label)}&per_page=24&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];

        const content = `
            <h1 class="text-2xl font-bold mb-2 text-red-500">${category.label} Videos</h1>
            <p class="text-sm text-slate-400 mb-6">${category.blurb}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos)}</div>
        `;

        res.send(renderHTMLPage({
            title: `Watch ${category.label} HD Streaming Clips - StreamHub Elite`,
            description: category.blurb,
            keywords: `${category.label}, adult videos, hd streaming`,
            canonicalPath: `/tag/${category.slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This category is temporarily unavailable. Please try again shortly.');
    }
});

app.get('/search', (req, res) => {
    const q = req.query.q || '';
    const match = CATEGORIES.find(c => c.label.toLowerCase() === q.toLowerCase() || c.slug === toSlug(q));
    if (match) return res.redirect(`/tag/${match.slug}`);
    res.redirect('/');
});

app.get('/video/:id/:slug?', async (req, res) => {
    const { id } = req.params;
    try {
        const video = await cachedGet(`video:${id}`, `https://www.eporner.com/api/v2/video/id/?id=${id}`);
        if (!video || !video.embed) return res.status(404).send('Video Not Found');

        // CHANGE: Added VideoObject structured data. This is what actually
        // lets Google show video rich results / thumbnails in search,
        // rather than relying on keyword-stuffed meta tags.
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: video.title,
            description: video.title,
            thumbnailUrl: video.default_thumb ? video.default_thumb.src : undefined,
            uploadDate: video.added || undefined,
            duration: video.length_sec ? `PT${video.length_sec}S` : undefined,
            embedUrl: video.embed,
            contentUrl: video.url || undefined
        };

        const content = `
            <div class="max-w-4xl mx-auto">
                <h1 class="text-xl font-bold mb-4 text-slate-100">${video.title}</h1>
                <div class="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden mb-6 border border-slate-800">
                    <iframe src="${video.embed}" class="absolute top-0 left-0 w-full h-full border-0" allowfullscreen></iframe>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p class="text-xs text-slate-400 font-mono">Duration: ${video.length_min} mins | Rating: ★ ${video.rate || '4.8'}</p>
                </div>
            </div>
        `;

        res.send(renderHTMLPage({
            title: `${video.title} - Watch HD Stream - StreamHub Elite`,
            description: `Watch ${video.title} in full HD online streaming.`,
            keywords: video.keywords || 'hd video, adult stream',
            canonicalPath: `/video/${id}/${toSlug(video.title)}`,
            contentHtml: content,
            ogImage: video.default_thumb ? video.default_thumb.src : undefined,
            jsonLd
        }));
    } catch (err) {
        res.status(503).send('Video temporarily unavailable. Please try again shortly.');
    }
});

app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${DOMAIN}/sitemap-categories.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
</sitemapindex>`);
});

// CHANGE: Renamed from sitemap-keywords.xml to sitemap-categories.xml and
// now lists only the real, fixed category pages — not ~135 synthesized
// keyword-modifier URLs.
app.get('/sitemap-categories.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');

    const urls = CATEGORIES.map(c => `
    <url>
        <loc>${DOMAIN}/tag/${c.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${DOMAIN}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    ${urls}
</urlset>`);
});

module.exports = app;
