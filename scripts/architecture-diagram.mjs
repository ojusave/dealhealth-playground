// Source for web/public/how-a-review-runs.gif — the "How a review runs" diagram.
// Hand-coded SVG; each invocation emits one HTML frame for a given dash offset,
// so the flow arrows animate across the 26-frame loop.
//
// Regenerate the GIF (needs Google Chrome + ffmpeg):
//   mkdir -p frames
//   for i in $(seq 0 25); do p=$(printf "%02d" $i);
//     node scripts/architecture-diagram.mjs $i frames/f$p.html;
//     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//       --disable-gpu --hide-scrollbars --window-size=1376,768 \
//       --screenshot=frames/f$p.png "file://$PWD/frames/f$p.html"; done
//   ffmpeg -y -framerate 20 -i frames/f%02d.png -vf "palettegen=stats_mode=full" palette.png
//   ffmpeg -y -framerate 20 -i frames/f%02d.png -i palette.png \
//     -lavfi "paletteuse=dither=bayer:bayer_scale=3" -loop 0 web/public/how-a-review-runs.gif

const W = 1376, H = 768;

// Palette
const C = {
  bg0: "#0B1120", bg1: "#090D14",
  ink: "#F8FAFC", sub: "#AFC1D6", eyebrow: "#93A6BC", body: "#D8E1EC", label: "#C6D2E0",
  purple: "#C084FC", blue: "#60A5FA", violet: "#A78BFA", emerald: "#34D399",
  gold: "#FBBF24", teal: "#22D3EE",
};

// Dimension cards
const DIMS = [
  "Momentum",
  "Qualification",
  "Technical & Security",
  "Commercial Readiness",
  "Execution Alignment",
];

// Vertical layout for the dimension column
const DIM_X = 620, DIM_W = 268, DIM_H = 62, DIM_STEP = 96, DIM_TOP = 150;
const dimY = (i) => DIM_TOP + i * DIM_STEP;
const dimCY = (i) => dimY(i) + DIM_H / 2;

// Hero (root task)
const HERO = { x: 300, y: 300, w: 214, h: 214 };
const HERO_CX = HERO.x + HERO.w / 2, HERO_CY = HERO.y + HERO.h / 2;

// Synthesize (fan-in target)
const SYN = { x: 984, y: 296, w: 250, h: 156 };
const SYN_CX = SYN.x + SYN.w / 2, SYN_CY = SYN.y + SYN.h / 2;

// Browser + Web Service (intake, top)
const BROWSER = { x: 50, y: 124, w: 200, h: 128 };
const WEB = { x: 300, y: 124, w: 214, h: 128 };

// Providers (bottom)
const PROV = { x: 592, y: 632, w: 324, h: 92 };

function frame(offset) {
  const dash = "14 12";
  const period = 26;
  const off = -(offset % period);

  // fan-out paths hero -> dims
  const fanOut = DIMS.map((_, i) => {
    const sx = HERO.x + HERO.w, sy = HERO_CY;
    const tx = DIM_X, ty = dimCY(i);
    const mx = (sx + tx) / 2;
    return `<path d="M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="${C.violet}" stroke-width="3" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#aViolet)" opacity="0.95" />`;
  }).join("\n    ");

  // fan-in paths dims -> synthesize
  const fanIn = DIMS.map((_, i) => {
    const sx = DIM_X + DIM_W, sy = dimCY(i);
    const tx = SYN.x, ty = SYN_CY;
    const mx = (sx + tx) / 2;
    return `<path d="M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="${C.emerald}" stroke-width="3" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#aEmerald)" opacity="0.95" />`;
  }).join("\n    ");

  const dimCards = DIMS.map((name, i) => {
    const y = dimY(i);
    return `<g filter="url(#shadow)">
      <rect x="${DIM_X}" y="${y}" width="${DIM_W}" height="${DIM_H}" rx="14" fill="#0F241C" stroke="${C.emerald}" stroke-width="2.5" />
      <text x="${DIM_X + DIM_W / 2}" y="${y + 32}" class="dimTitle">${name}</text>
      <text x="${DIM_X + DIM_W / 2}" y="${y + 50}" class="dimSub">analyzeDimension · retry ×1</text>
    </g>`;
  }).join("\n    ");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:${C.bg1};}
  svg{display:block;}
  </style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
    <defs>
      <linearGradient id="bg" x1="120" y1="0" x2="1256" y2="768" gradientUnits="userSpaceOnUse">
        <stop stop-color="${C.bg0}" /><stop offset="1" stop-color="${C.bg1}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.28" />
      </filter>
      ${["Purple:"+C.purple,"Blue:"+C.blue,"Violet:"+C.violet,"Emerald:"+C.emerald,"Gold:"+C.gold,"Teal:"+C.teal].map(p=>{const[n,c]=p.split(":");return `<marker id="a${n}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}" /></marker>`;}).join("\n      ")}
      <style>
        .title{fill:${C.ink};font:700 42px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .subtitle{fill:${C.sub};font:500 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .eyebrow{fill:${C.eyebrow};font:600 14px 'Inter','Segoe UI',Arial,sans-serif;letter-spacing:0.14em;text-anchor:middle;}
        .cardTitle{fill:${C.ink};font:700 24px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .body{fill:${C.body};font:500 16px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .heroTitle{fill:${C.ink};font:700 22px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .heroBody{fill:#DDD6FE;font:500 16px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .dimTitle{fill:${C.ink};font:700 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .dimSub{fill:#8FBFA8;font:500 12px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .label{fill:${C.label};font:600 14px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
      </style>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)" />

    <text x="${W/2}" y="52" class="title">How a review runs</text>
    <text x="${W/2}" y="82" class="subtitle">Render Workflows fans one deal out to five parallel reviews, then synthesizes a single report</text>

    <!-- fan-out / fan-in connectors (drawn under cards) -->
    ${fanOut}
    ${fanIn}

    <!-- intake: browser -> web service -->
    <text x="${BROWSER.x+BROWSER.w/2}" y="${BROWSER.y-12}" class="eyebrow">CLIENT</text>
    <g filter="url(#shadow)">
      <rect x="${BROWSER.x}" y="${BROWSER.y}" width="${BROWSER.w}" height="${BROWSER.h}" rx="18" fill="#1B1230" stroke="${C.purple}" stroke-width="2.5" />
      <text x="${BROWSER.x+BROWSER.w/2}" y="${BROWSER.y+52}" class="cardTitle">Browser</text>
      <text x="${BROWSER.x+BROWSER.w/2}" y="${BROWSER.y+82}" class="body">picks a deal + model</text>
      <text x="${BROWSER.x+BROWSER.w/2}" y="${BROWSER.y+104}" class="body">watches the live graph</text>
    </g>

    <text x="${WEB.x+WEB.w/2}" y="${WEB.y-12}" class="eyebrow">RENDER · WEB SERVICE</text>
    <g filter="url(#shadow)">
      <rect x="${WEB.x}" y="${WEB.y}" width="${WEB.w}" height="${WEB.h}" rx="18" fill="#12263F" stroke="${C.blue}" stroke-width="2.5" />
      <text x="${WEB.x+WEB.w/2}" y="${WEB.y+50}" class="cardTitle">API · Hono</text>
      <text x="${WEB.x+WEB.w/2}" y="${WEB.y+80}" class="body">returns 202 Accepted</text>
      <text x="${WEB.x+WEB.w/2}" y="${WEB.y+102}" class="body">startTask · SSE snapshots</text>
    </g>

    <!-- POST arrow browser -> web -->
    <path d="M${BROWSER.x+BROWSER.w} ${BROWSER.y+44} H ${WEB.x}" stroke="${C.purple}" stroke-width="3" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#aPurple)" />
    <text x="${(BROWSER.x+BROWSER.w+WEB.x)/2}" y="${BROWSER.y+28}" class="label">POST /api/analyze</text>
    <!-- SSE return web -> browser -->
    <path d="M${WEB.x} ${BROWSER.y+94} H ${BROWSER.x+BROWSER.w}" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="13 13" stroke-dashoffset="${-off}" marker-end="url(#aBlue)" />
    <text x="${(BROWSER.x+BROWSER.w+WEB.x)/2}" y="${BROWSER.y+116}" class="label">SSE + polling</text>

    <!-- web service -> hero (startTask) -->
    <path d="M${WEB.x+WEB.w/2} ${WEB.y+WEB.h} V ${HERO.y}" stroke="${C.blue}" stroke-width="3" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#aBlue)" />

    <!-- hero: analyzeOpportunity -->
    <text x="${HERO_CX}" y="${HERO.y-12}" class="eyebrow">RENDER · WORKFLOWS</text>
    <g filter="url(#shadow)">
      <rect x="${HERO.x}" y="${HERO.y}" width="${HERO.w}" height="${HERO.h}" rx="20" fill="#2A1E48" stroke="${C.violet}" stroke-width="3" />
      <text x="${HERO_CX}" y="${HERO.y+58}" class="heroTitle">analyzeOpportunity</text>
      <text x="${HERO_CX}" y="${HERO.y+90}" class="heroBody">root task</text>
      <text x="${HERO_CX}" y="${HERO.y+124}" class="heroBody">fan-out → fan-in</text>
      <text x="${HERO_CX}" y="${HERO.y+150}" class="heroBody">retries · resumes</text>
      <text x="${HERO_CX}" y="${HERO.y+172}" class="heroBody">if the browser closes</text>
    </g>

    <!-- dimension column -->
    <text x="${DIM_X+DIM_W/2}" y="${DIM_TOP-16}" class="eyebrow">FIVE PARALLEL REVIEWS</text>
    ${dimCards}

    <!-- synthesize -->
    <text x="${SYN_CX}" y="${SYN.y-12}" class="eyebrow">FAN-IN</text>
    <g filter="url(#shadow)">
      <rect x="${SYN.x}" y="${SYN.y}" width="${SYN.w}" height="${SYN.h}" rx="18" fill="#0E2E38" stroke="${C.teal}" stroke-width="2.5" />
      <text x="${SYN_CX}" y="${SYN.y+56}" class="cardTitle">Synthesize</text>
      <text x="${SYN_CX}" y="${SYN.y+88}" class="body">merge five findings</text>
      <text x="${SYN_CX}" y="${SYN.y+110}" class="body">→ analysis report</text>
    </g>

    <!-- providers -->
    <g filter="url(#shadow)">
      <rect x="${PROV.x}" y="${PROV.y}" width="${PROV.w}" height="${PROV.h}" rx="16" fill="#241C0C" stroke="${C.gold}" stroke-width="2.5" />
      <text x="${PROV.x+PROV.w/2}" y="${PROV.y+38}" class="cardTitle">Provider models</text>
      <text x="${PROV.x+PROV.w/2}" y="${PROV.y+68}" class="body">OpenAI · Anthropic · xAI</text>
    </g>
    <!-- dims -> providers (each dimension makes one inference call) -->
    <path d="M${DIM_X+DIM_W/2} ${dimY(4)+DIM_H} V ${PROV.y}" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#aGold)" />
    <text x="${PROV.x+PROV.w+96}" y="${(dimY(4)+DIM_H+PROV.y)/2+4}" class="label">1 model call / review</text>

    <!-- synthesize -> web service (report + events return) -->
    <path d="M${SYN_CX} ${SYN.y+SYN.h} C ${SYN_CX} ${SYN.y+SYN.h+90}, ${WEB.x+WEB.w+40} ${WEB.y+WEB.h+40}, ${WEB.x+WEB.w} ${WEB.y+WEB.h-24}" fill="none" stroke="${C.teal}" stroke-width="2.5" stroke-dasharray="13 13" stroke-dashoffset="${-off}" marker-end="url(#aTeal)" opacity="0.85" />
    <text x="${SYN_CX-40}" y="${SYN.y+SYN.h+40}" class="label">report + progress events</text>
  </svg>
  </body></html>`;
}

// CLI: node gen.mjs <offset> <outfile>
import { writeFileSync } from "node:fs";
const offset = Number(process.argv[2] ?? 0);
const out = process.argv[3] ?? "/dev/stdout";
writeFileSync(out, frame(offset));
