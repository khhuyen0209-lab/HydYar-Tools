// ============================================================
// HYDYAR TOOLS — PRODUCTION SERVER
// Express 5 + SPA + Dynamic SEO
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();


// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 3000;

const BASE_URL =
    process.env.BASE_URL ||
    `http://localhost:${PORT}`;

const PUBLIC_DIR = path.join(__dirname, 'Public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');


// ============================================================
// SEO CONFIG
// ============================================================

const SEO_PAGES = {

    '/': {
        title: 'HydYar Tools — Công cụ tiện ích online',
        description:
            'HydYar Tools cung cấp các công cụ tiện ích online giúp bạn làm việc nhanh hơn và thuận tiện hơn.'
    },

    '/tools': {
        title: 'HydYar Tools — Công cụ tiện ích online',
        description:
            'Khám phá các công cụ tiện ích của HydYar Tools để tính toán, xử lý văn bản, ghi chú và nhiều hơn nữa.'
    },

    '/tools/all': {
        title: 'Tất cả công cụ — HydYar Tools',
        description:
            'Danh sách tất cả công cụ tiện ích có trên HydYar Tools.'
    },

    '/tools/calculator': {
        title: 'Máy tính cơ bản — HydYar Tools',
        description:
            'Máy tính online miễn phí hỗ trợ các phép tính và xử lý biểu thức nhanh chóng.'
    },

    '/tools/counter': {
        title: 'Đếm ký tự & từ — HydYar Tools',
        description:
            'Đếm ký tự, số từ và phân tích văn bản nhanh chóng ngay trên trình duyệt.'
    },

    '/tools/formatter': {
        title: 'Định dạng văn bản — HydYar Tools',
        description:
            'Công cụ định dạng và xử lý văn bản nhanh chóng, tiện lợi và miễn phí.'
    },

    '/tools/notes': {
        title: 'Note nhanh — HydYar Tools',
        description:
            'Ghi chú nhanh ngay trên trình duyệt với HydYar Tools.'
    }
};


// ============================================================
// BASIC SECURITY
// ============================================================

app.disable('x-powered-by');


// ============================================================
// STATIC FILES
// ============================================================
//
// Public/
// ├── index.html
// ├── Script.js
// ├── css/
// ├── assets/
// └── tools/
//
// Sẽ được truy cập:
//
// /Script.js
// /css/style.css
// /assets/logoHydYar.png
// /tools/cal/...
//

app.use(
    express.static(PUBLIC_DIR, {
        maxAge: '7d',
        extensions: false
    })
);


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

}


// ============================================================
// REGEX ESCAPE
// ============================================================

function escapeRegex(value) {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );

}


// ============================================================
// NORMALIZE PATH
// ============================================================

function normalizePath(requestPath) {

    if (!requestPath) {
        return '/';
    }

    let pathname = requestPath.split('?')[0];

    if (
        pathname.length > 1 &&
        pathname.endsWith('/')
    ) {
        pathname = pathname.slice(0, -1);
    }

    return pathname;

}


// ============================================================
// META REPLACER
// ============================================================

function replaceMeta(html, attribute, value) {

    const escapedValue = escapeHtml(value);

    const regex = new RegExp(
        `<meta\\s+(?:property|name)=["']${escapeRegex(attribute)}["'][^>]*>`,
        'i'
    );

    const isTwitter =
        attribute.startsWith('twitter:');

    const tag = isTwitter
        ? `<meta name="${attribute}" content="${escapedValue}">`
        : `<meta property="${attribute}" content="${escapedValue}">`;

    if (regex.test(html)) {

        return html.replace(regex, tag);

    }

    return html.replace(
        /<\/head>/i,
        `    ${tag}\n</head>`
    );

}


// ============================================================
// TEMPLATE CACHE
// ============================================================
//
// index.html chỉ đọc từ disk một lần.
// Không cần đọc file lại mỗi request.
//

let indexTemplate = null;

async function getIndexTemplate() {

    if (indexTemplate !== null) {
        return indexTemplate;
    }

    indexTemplate = await fs.readFile(
        INDEX_FILE,
        'utf8'
    );

    return indexTemplate;

}


// ============================================================
// BUILD SEO HTML
// ============================================================

function buildSeoHtml(template, seo, pathname) {

    const baseUrl =
        BASE_URL.replace(/\/$/, '');

    const canonical =
        baseUrl +
        (pathname === '/' ? '' : pathname);

    const imageUrl =
        `${baseUrl}/assets/logoHydYar.png`;


    let html = template;


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(seo.title)}</title>`
    );


    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    html = replaceDescription(
        html,
        seo.description
    );


    // --------------------------------------------------------
    // CANONICAL
    // --------------------------------------------------------

    const canonicalTag =
        `<link rel="canonical" href="${escapeHtml(canonical)}">`;

    if (
        /<link\s+rel=["']canonical["']/i.test(html)
    ) {

        html = html.replace(
            /<link\s+rel=["']canonical["'][^>]*>/i,
            canonicalTag
        );

    } else {

        html = html.replace(
            /<\/head>/i,
            `    ${canonicalTag}\n</head>`
        );

    }


    // --------------------------------------------------------
    // OPEN GRAPH
    // --------------------------------------------------------

    html = replaceMeta(
        html,
        'og:title',
        seo.title
    );

    html = replaceMeta(
        html,
        'og:description',
        seo.description
    );

    html = replaceMeta(
        html,
        'og:url',
        canonical
    );

    html = replaceMeta(
        html,
        'og:image',
        imageUrl
    );

    html = replaceMeta(
        html,
        'og:image:alt',
        'HydYar Tools'
    );

    html = replaceMeta(
        html,
        'og:type',
        'website'
    );


    // --------------------------------------------------------
    // TWITTER / X
    // --------------------------------------------------------

    html = replaceMeta(
        html,
        'twitter:title',
        seo.title
    );

    html = replaceMeta(
        html,
        'twitter:description',
        seo.description
    );

    html = replaceMeta(
        html,
        'twitter:image',
        imageUrl
    );


    // --------------------------------------------------------
    // SEO ROUTE MARKER
    // --------------------------------------------------------

    html = html.replace(
        /<meta\s+name=["']hydyar-seo-route["'][^>]*>/i,
        ''
    );

    html = html.replace(
        /<head>/i,
        `<head>
    <meta name="hydyar-seo-route" content="${escapeHtml(canonical)}">`
    );


    return html;

}


// ============================================================
// DESCRIPTION HANDLER
// ============================================================

function replaceDescription(html, description) {

    const tag =
        `<meta name="description" content="${escapeHtml(description)}">`;

    const regex =
        /<meta\s+name=["']description["'][^>]*>/i;

    if (regex.test(html)) {

        return html.replace(
            regex,
            tag
        );

    }

    return html.replace(
        /<\/head>/i,
        `    ${tag}\n</head>`
    );

}


// ============================================================
// SEO PAGE HANDLER
// ============================================================

async function serveSeoPage(req, res) {

    try {

        const pathname =
            normalizePath(req.path);

        const seo =
            SEO_PAGES[pathname];


        // Không phải SEO route
        if (!seo) {

            return res
                .status(404)
                .type('text')
                .send('HydYar Tools — 404 Not Found');

        }


        const template =
            await getIndexTemplate();


        const html =
            buildSeoHtml(
                template,
                seo,
                pathname
            );


        // ----------------------------------------------------
        // CLOUDFLARE / CDN CACHE
        // ----------------------------------------------------
        //
        // Browser:
        //   max-age=0
        //
        // CDN:
        //   s-maxage=86400 → 24 giờ
        //
        // Nếu origin Render ngủ:
        //   Cloudflare vẫn có thể phục vụ bản cache.
        //

        res.set(
            'Cache-Control',
            'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
        );


        res.type('html');

        return res.send(html);

    } catch (error) {

        console.error(
            '[HYDYAR SSR ERROR]',
            error
        );

        return res
            .status(500)
            .type('text')
            .send('HydYar Tools — Internal Server Error');

    }

}


// ============================================================
// SEO ROUTES
// ============================================================

app.get('/', serveSeoPage);

app.get('/tools', serveSeoPage);

app.get('/tools/all', serveSeoPage);

app.get('/tools/calculator', serveSeoPage);

app.get('/tools/counter', serveSeoPage);

app.get('/tools/formatter', serveSeoPage);

app.get('/tools/notes', serveSeoPage);


// ==========================================
// SEO — robots.txt
// ==========================================

app.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

    res.type('text/plain').send(robots);
});


// ==========================================
// SEO — sitemap.xml
// ==========================================

app.get('/sitemap.xml', (req, res) => {
    const urls = [
        '/',
        '/tools',
        '/tools/all',
        '/tools/calculator',
        '/tools/counter',
        '/tools/formatter',
        '/tools/notes'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls.map(path => `    <url>
        <loc>${BASE_URL}${path}</loc>
    </url>`).join('\n')}
</urlset>`;

    res
        .type('application/xml')
        .send(sitemap);
});


// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {

    res
        .status(404)
        .type('text')
        .send('HydYar Tools — 404 Not Found');

});


// ============================================================
// START
// ============================================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log('');
        console.log('==========================================');
        console.log('        HYDYAR TOOLS SERVER');
        console.log('==========================================');
        console.log(`Port      : ${PORT}`);
        console.log(`Base URL  : ${BASE_URL}`);
        console.log(`Public    : ${PUBLIC_DIR}`);
        console.log(`Index     : ${INDEX_FILE}`);
        console.log('==========================================');
        console.log('');

    }
);