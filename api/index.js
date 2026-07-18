const express = require('express');
const axios = require('axios');
const slugify = require('slugify');

const app = express();
const DOMAIN = 'https://vexn.org';

// -------------------------------------------------------------
// 1. CATEGORY LIST — Brazzers listed first on purpose (see homepage route,
// which pins it as a featured strip before the rest of the grid).
// -------------------------------------------------------------
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
    { slug: 'desi', label: 'Desi', blurb: 'Content from South Asian creators and studios.' },
    { slug: 'web-series', label: 'Web Series', blurb: 'Episodic web-series style adult content.' },
    { slug: 'jav', label: 'JAV', blurb: 'Japanese Adult Video (JAV) genre content.' },
    { slug: 'japanese', label: 'Japanese', blurb: 'Content featuring Japanese performers and studios.' },
];

// -------------------------------------------------------------
// NOTE ON "STARS" AND "COUNTRY" PAGES:
// The eporner API has no structured performer or country field — only a
// free-text `keywords` string per video. A performer list below is a
// CURATED set of names used as search queries (same mechanism as
// categories), not data pulled from a dedicated API field. There is no
// country data available at all, so no country-based pages are included —
// building those would mean inventing labels not backed by real data,
// which would hurt trust/quality signals rather than help them.
// -------------------------------------------------------------
const PERFORMERS = [
    { slug: 'eva-elfie', label: 'Eva Elfie', blurb: 'Scenes and clips featuring Eva Elfie.' },
    { slug: 'lana-rhoades', label: 'Lana Rhoades', blurb: 'Scenes and clips featuring Lana Rhoades.' },
    { slug: 'angela-white', label: 'Angela White', blurb: 'Scenes and clips featuring Angela White.' },
    { slug: 'abella-danger', label: 'Abella Danger', blurb: 'Scenes and clips featuring Abella Danger.' },
];

function findBySlug(list, slug) {
    return list.find(c => c.slug === slug);
}

function toSlug(text) {
    return slugify(text, { lower: true, strict: true });
}

function fromSlug(slug) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// CHANGE: Builds a "trending keywords" list from REAL data — it counts how
// often each keyword appears across a batch of currently trending videos'
// own `keywords` field (returned by the API), rather than a hand-typed
// list. This grows/shrinks naturally as real trending content changes,
// instead of being a fixed set of manufactured search-term pages.
// Widened to accept multiple video arrays (trending + latest + brazzers)
// so the pool draws from more real, current data before ranking by
// frequency — more variety without inventing anything.
function extractTopKeywords(videoArrays, limit = 60) {
    const counts = new Map();
    const allVideos = [].concat(...videoArrays);
    allVideos.forEach(v => {
        if (!v.keywords) return;
        v.keywords.split(',').forEach(raw => {
            const kw = raw.trim().toLowerCase();
            if (kw.length < 2) return;
            counts.set(kw, (counts.get(kw) || 0) + 1);
        });
    });
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([kw]) => kw);
}

// NEW: Real sort options — these map directly to the eporner API's own
// `order` values, so "sorting" is genuine, not decorative.
const SORT_OPTIONS = [
    { value: 'top-weekly', label: 'Trending' },
    { value: 'top-rated', label: 'Top Rated' },
    { value: 'latest', label: 'Latest' },
];

// Renders crawlable <a> sort links (not JS-only) so search engines can
// follow them, and validates the incoming order value against a safe list
// before it's ever passed to the upstream API.
function renderSortLinks(basePath, currentOrder) {
    return SORT_OPTIONS.map(opt => {
        const active = opt.value === currentOrder;
        const cls = active
            ? 'px-3 py-1 rounded bg-red-600 text-white text-xs font-bold'
            : 'px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-red-400';
        return `<a href="${basePath}?order=${opt.value}" class="${cls}">${opt.label}</a>`;
    }).join(' ');
}

function safeOrder(order) {
    return SORT_OPTIONS.some(o => o.value === order) ? order : 'top-weekly';
}

// -------------------------------------------------------------
// 2. SIMPLE IN-MEMORY CACHE
// -------------------------------------------------------------
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
const AD_SLOT_HTML = `
    <div class="bg-slate-900/40 rounded-lg p-3 border border-slate-800 flex items-center justify-center col-span-1 min-h-[250px]">
        <span class="text-[9px] font-mono text-slate-600 uppercase">Ad slot — insert vetted network embed here</span>
    </div>
`;

function renderHTMLPage({ title, description, keywords, canonicalPath, contentHtml, ogImage, jsonLd, robotsMeta }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="robots" content="${robotsMeta || 'index, follow'}">
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
    <header class="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <a href="/" class="text-xl sm:text-2xl font-black text-red-500 text-center sm:text-left">STREAM<span class="text-white">HUB</span>ELITE</a>
            <div class="flex gap-2 items-center w-full sm:w-auto">
                <form action="/search" method="GET" class="flex gap-2 flex-grow sm:flex-grow-0">
                    <input type="text" name="q" placeholder="Search keywords..." class="bg-slate-950 text-white px-3 py-2 sm:py-1 rounded border border-slate-800 text-sm flex-grow sm:flex-grow-0 sm:w-56">
                    <button type="submit" class="bg-red-600 px-4 py-2 sm:py-1 rounded text-sm font-bold whitespace-nowrap">Search</button>
                </form>
                <a href="/favorites" class="bg-slate-800 px-3 py-2 sm:py-1 rounded text-sm font-bold whitespace-nowrap border border-slate-700 hover:border-red-500">❤ <span id="favNavCount">0</span></a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-grow w-full">
        ${contentHtml}
    </main>

    <footer class="bg-slate-900 border-t border-slate-800 p-6 text-center text-xs text-slate-500">
        <p>&copy; ${new Date().getFullYear()} StreamHub Elite. All Rights Reserved. 18+ Adult Content.</p>
    </footer>

    <script>
        // CHANGE: Favorites stored ONLY in the visitor's own browser
        // (localStorage) — never sent to the server, no account needed.
        // This is a real feature port from the file you uploaded, minus
        // any ad code.
        function getFavorites() {
            try { return JSON.parse(localStorage.getItem('streamhub_favs')) || []; }
            catch (e) { return []; }
        }
        function setFavorites(list) {
            localStorage.setItem('streamhub_favs', JSON.stringify(list));
            document.querySelectorAll('#favNavCount').forEach(el => el.textContent = list.length);
        }
        function toggleFavorite(id, title, thumb, href) {
            const favs = getFavorites();
            const idx = favs.findIndex(f => f.id === id);
            if (idx > -1) favs.splice(idx, 1);
            else favs.push({ id, title, thumb, href });
            setFavorites(favs);
            paintFavoriteButtons();
        }
        function paintFavoriteButtons() {
            const favs = getFavorites();
            document.querySelectorAll('[data-fav-id]').forEach(btn => {
                const isSaved = favs.some(f => String(f.id) === btn.getAttribute('data-fav-id'));
                btn.textContent = isSaved ? '❤' : '♡';
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            setFavorites(getFavorites());
            paintFavoriteButtons();
        });
    </script>
</body>
</html>`;
}

function renderVideoGrid(videos) {
    let html = '';
    videos.forEach((v, index) => {
        const href = `/video/${v.id}/${toSlug(v.title)}`;
        const safeTitle = v.title.replace(/'/g, "\\'");
        html += `
            <div class="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative">
                <button data-fav-id="${v.id}" onclick="toggleFavorite('${v.id}', '${safeTitle}', '${v.default_thumb.src}', '${href}')" class="absolute top-2 right-2 z-10 w-7 h-7 bg-slate-950/80 rounded-lg flex items-center justify-center text-sm border border-slate-800">♡</button>
                <a href="${href}">
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

// CHANGE: Homepage now pulls THREE feeds instead of one:
//   1. Brazzers — pinned first, per your request to lead with that brand
//   2. Trending — order=top-weekly (eporner's real "trending" sort)
//   3. Latest — order=latest (eporner's real "newest" sort)
// All three run in parallel via Promise.allSettled so one failing feed
// doesn't take down the whole homepage.
app.get('/', async (req, res) => {
    try {
        const [brazzersRes, trendingRes, latestRes] = await Promise.allSettled([
            cachedGet('home:brazzers', 'https://www.eporner.com/api/v2/video/search/?query=Brazzers&per_page=8&thumbsize=big&hd=1'),
            cachedGet('home:trending', 'https://www.eporner.com/api/v2/video/search/?order=top-weekly&per_page=12&thumbsize=big&hd=1'),
            cachedGet('home:latest', 'https://www.eporner.com/api/v2/video/search/?order=latest&per_page=12&thumbsize=big&hd=1'),
        ]);

        const brazzersVideos = brazzersRes.status === 'fulfilled' ? (brazzersRes.value.videos || []) : [];
        const trendingVideos = trendingRes.status === 'fulfilled' ? (trendingRes.value.videos || []) : [];
        const latestVideos = latestRes.status === 'fulfilled' ? (latestRes.value.videos || []) : [];

        const categoryLinks = CATEGORIES.map(c => `
            <a href="/tag/${c.slug}" class="px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded text-slate-300 hover:text-red-400">${c.label}</a>
        `).join('');

        const performerLinks = PERFORMERS.map(p => `
            <a href="/star/${p.slug}" class="px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded text-slate-300 hover:text-red-400">${p.label}</a>
        `).join('');

        // CHANGE: Trending keyword cloud now pulls from all three real feeds
        // above (Brazzers + Trending + Latest) instead of just one, giving a
        // wider genuine pool before ranking by frequency.
        const topKeywords = extractTopKeywords([brazzersVideos, trendingVideos, latestVideos]);
        cache.set('trending-keywords', { data: topKeywords, time: Date.now() }); // reused by sitemap-keywords.xml
        const keywordLinks = topKeywords.map(kw => `
            <a href="/keyword/${toSlug(kw)}" class="px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded text-slate-300 hover:text-red-400">${kw}</a>
        `).join('');

        const content = `
            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold text-red-500">Brazzers</h1>
                    <a href="/tag/brazzers" class="text-xs text-slate-400 hover:text-red-400">View all →</a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(brazzersVideos)}</div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-bold mb-4 text-slate-200">Trending This Week</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(trendingVideos)}</div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-bold mb-4 text-slate-200">Latest Uploads</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(latestVideos)}</div>
            </div>

            <h2 class="text-lg font-bold mb-3 text-slate-400">Browse Categories</h2>
            <div class="flex flex-wrap gap-2 mb-6">${categoryLinks}</div>

            <h2 class="text-lg font-bold mb-3 text-slate-400">Browse Performers</h2>
            <div class="flex flex-wrap gap-2 mb-6">${performerLinks}</div>

            <h2 class="text-lg font-bold mb-3 text-slate-400">Trending Keywords</h2>
            <div class="flex flex-wrap gap-2">${keywordLinks}</div>
        `;

        res.send(renderHTMLPage({
            title: 'StreamHub Elite | Brazzers, Trending & Latest HD Streams',
            description: 'Watch Brazzers scenes plus trending and newly uploaded HD streams, updated daily.',
            keywords: ['Brazzers', ...CATEGORIES.map(c => c.label), ...PERFORMERS.map(p => p.label)].join(', '),
            canonicalPath: '/',
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send("We're temporarily unable to load the home feed. Please try again shortly.");
    }
});

app.get('/tag/:slug', async (req, res) => {
    const category = findBySlug(CATEGORIES, req.params.slug);
    if (!category) return res.status(404).send('Category not found');
    const order = safeOrder(req.query.order);

    try {
        const data = await cachedGet(
            `tag:${category.slug}:${order}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(category.label)}&order=${order}&per_page=24&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];

        const content = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h1 class="text-2xl font-bold text-red-500">${category.label} Videos</h1>
                <div class="flex gap-2">${renderSortLinks(`/tag/${category.slug}`, order)}</div>
            </div>
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

// NEW: Performer pages, same pattern as /tag/:slug.
app.get('/star/:slug', async (req, res) => {
    const performer = findBySlug(PERFORMERS, req.params.slug);
    if (!performer) return res.status(404).send('Performer not found');
    const order = safeOrder(req.query.order);

    try {
        const data = await cachedGet(
            `star:${performer.slug}:${order}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(performer.label)}&order=${order}&per_page=24&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];

        const content = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h1 class="text-2xl font-bold text-red-500">${performer.label}</h1>
                <div class="flex gap-2">${renderSortLinks(`/star/${performer.slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-6">${performer.blurb}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos)}</div>
        `;

        res.send(renderHTMLPage({
            title: `${performer.label} - HD Videos - StreamHub Elite`,
            description: performer.blurb,
            keywords: `${performer.label}, adult videos, hd streaming`,
            canonicalPath: `/star/${performer.slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This page is temporarily unavailable. Please try again shortly.');
    }
});

// NEW: Generic keyword page. Unlike the old modifier-matrix approach, this
// does NOT pre-generate a fixed list of URLs — it queries the API live for
// whatever real keyword slug is requested (normally reached via the
// Trending Keywords cloud on the homepage, which is itself built from
// real current data). If a keyword returns no videos, it 404s instead of
// serving an empty shell page.
app.get('/keyword/:slug', async (req, res) => {
    const slug = req.params.slug;
    const term = fromSlug(slug);
    const order = safeOrder(req.query.order);

    try {
        const data = await cachedGet(
            `keyword:${slug}:${order}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(term)}&order=${order}&per_page=24&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];
        if (videos.length === 0) return res.status(404).send('No results for this keyword');

        const content = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h1 class="text-2xl font-bold text-red-500">${term} Videos</h1>
                <div class="flex gap-2">${renderSortLinks(`/keyword/${slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-6">Currently trending clips matching "${term}".</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos)}</div>
        `;

        res.send(renderHTMLPage({
            title: `${term} Videos - Trending HD Clips - StreamHub Elite`,
            description: `Watch trending ${term} HD video clips, updated as new content trends.`,
            keywords: `${term}, trending, adult videos`,
            canonicalPath: `/keyword/${slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This page is temporarily unavailable. Please try again shortly.');
    }
});

// NEW: Favorites page. Content lives only in the visitor's own browser
// (localStorage), so the server can't render it — this page ships an empty
// shell plus a script that reads localStorage and builds the grid
// client-side. Marked noindex/nofollow: there's no real shared content
// here for search engines to index, and indexing an empty shell would be
// exactly the kind of thin-page problem we've been avoiding elsewhere.
app.get('/favorites', (req, res) => {
    const content = `
        <h1 class="text-2xl font-bold mb-6 text-red-500">My Saved Videos</h1>
        <div id="favGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"></div>
        <p id="favEmpty" class="text-sm text-slate-400 hidden">You haven't saved any videos yet. Tap the ♡ icon on any video to save it here.</p>
        <script>
            (function() {
                const favs = JSON.parse(localStorage.getItem('streamhub_favs') || '[]');
                const grid = document.getElementById('favGrid');
                const empty = document.getElementById('favEmpty');
                if (favs.length === 0) {
                    empty.classList.remove('hidden');
                    return;
                }
                favs.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative';
                    div.innerHTML = \`
                        <button data-fav-id="\${f.id}" onclick="toggleFavorite('\${f.id}', '', '', '')" class="absolute top-2 right-2 z-10 w-7 h-7 bg-slate-950/80 rounded-lg flex items-center justify-center text-sm border border-slate-800">❤</button>
                        <a href="\${f.href}">
                            <img src="\${f.thumb}" alt="\${f.title}" class="w-full h-48 object-cover" loading="lazy">
                            <div class="p-3"><h2 class="text-sm font-bold truncate text-slate-200">\${f.title}</h2></div>
                        </a>\`;
                    grid.appendChild(div);
                });
            })();
        </script>
    `;

    res.send(renderHTMLPage({
        title: 'My Saved Videos - StreamHub Elite',
        description: 'Videos you have saved for later.',
        keywords: '',
        canonicalPath: '/favorites',
        contentHtml: content,
        robotsMeta: 'noindex, nofollow'
    }));
});

app.get('/search', (req, res) => {
    const q = req.query.q || '';
    const catMatch = CATEGORIES.find(c => c.label.toLowerCase() === q.toLowerCase() || c.slug === toSlug(q));
    if (catMatch) return res.redirect(`/tag/${catMatch.slug}`);
    const starMatch = PERFORMERS.find(p => p.label.toLowerCase() === q.toLowerCase() || p.slug === toSlug(q));
    if (starMatch) return res.redirect(`/star/${starMatch.slug}`);
    res.redirect('/');
});

app.get('/video/:id/:slug?', async (req, res) => {
    const { id } = req.params;
    try {
        const video = await cachedGet(`video:${id}`, `https://www.eporner.com/api/v2/video/id/?id=${id}`);
        if (!video || !video.embed) return res.status(404).send('Video Not Found');

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

// -------------------------------------------------------------
// 5. SITEMAPS — now split into: index -> categories, performers, videos
// -------------------------------------------------------------
app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const now = new Date().toISOString();
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${DOMAIN}/sitemap-categories.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-performers.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-videos.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-keywords.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
</sitemapindex>`);
});

app.get('/sitemap-categories.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = CATEGORIES.map(c => `
    <url>
        <loc>${DOMAIN}/tag/${c.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>${c.slug === 'brazzers' ? '1.0' : '0.8'}</priority>
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

// NEW: Performer sitemap.
app.get('/sitemap-performers.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = PERFORMERS.map(p => `
    <url>
        <loc>${DOMAIN}/star/${p.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`);
});

// NEW: Keyword sitemap — pulls from the same real trending-keyword cache
// populated by the homepage (extractTopKeywords). If the cache is empty
// (e.g. cold start, no one has hit "/" yet), it fetches trending videos
// itself first rather than serving a stale fixed list.
app.get('/sitemap-keywords.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    try {
        let cached = cache.get('trending-keywords');
        let keywords = cached ? cached.data : [];
        if (keywords.length === 0) {
            const data = await cachedGet('home:trending', 'https://www.eporner.com/api/v2/video/search/?order=top-weekly&per_page=12&thumbsize=big&hd=1');
            keywords = extractTopKeywords(data.videos || []);
        }

        const urls = keywords.map(kw => `
    <url>
        <loc>${DOMAIN}/keyword/${toSlug(kw)}</loc>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
    </url>`).join('');

        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`);
    } catch (err) {
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }
});

// NEW: Video sitemap using the proper Google video-sitemap extension, so
// individual video pages are eligible for video rich results — not just
// listed as plain URLs. Pulls the latest videos live (short cache) since
// this list changes constantly.
app.get('/sitemap-videos.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    try {
        const data = await cachedGet('sitemap:videos', 'https://www.eporner.com/api/v2/video/search/?order=latest&per_page=100&thumbsize=big&hd=1');
        const videos = data.videos || [];

        const urls = videos.map(v => `
    <url>
        <loc>${DOMAIN}/video/${v.id}/${toSlug(v.title)}</loc>
        <video:video>
            <video:thumbnail_loc>${v.default_thumb.src}</video:thumbnail_loc>
            <video:title><![CDATA[${v.title}]]></video:title>
            <video:description><![CDATA[${v.title}]]></video:description>
            <video:duration>${v.length_sec || ''}</video:duration>
        </video:video>
    </url>`).join('');

        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${urls}
</urlset>`);
    } catch (err) {
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }
});

module.exports = app;