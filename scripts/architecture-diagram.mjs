// Source for web/public/how-a-review-runs.gif — the "How a review runs" diagram.
// Hand-coded SVG; each invocation emits one HTML frame for a given dash offset,
// so the flow arrows animate across the 24-frame loop.
//
// Regenerate the GIF (needs Google Chrome + ffmpeg):
//   mkdir -p frames
//   for i in $(seq 0 23); do p=$(printf "%02d" $i);
//     node scripts/architecture-diagram.mjs $i frames/f$p.html;
//     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//       --disable-gpu --hide-scrollbars --window-size=1376,768 \
//       --screenshot=frames/f$p.png "file://$PWD/frames/f$p.html"; done
//   ffmpeg -y -framerate 20 -i frames/f%02d.png -vf "palettegen=stats_mode=full" palette.png
//   ffmpeg -y -framerate 20 -i frames/f%02d.png -i palette.png \
//     -lavfi "paletteuse=dither=bayer:bayer_scale=3" -loop 0 web/public/how-a-review-runs.gif

const W = 1376, H = 768;

const C = {
  bg0: "#0B1120", bg1: "#090D14",
  ink: "#F8FAFC", sub: "#9FB2C8", eyebrow: "#7C8DA6", body: "#C4D0DE",
  purple: "#C084FC", blue: "#60A5FA", violet: "#A78BFA", emerald: "#34D399",
  gold: "#FBBF24", teal: "#22D3EE",
};

// Brand logo path data (all viewBox 0 0 24 24, single path).
const LOGO = {
  render: "m17.1491 1.50583c-2.6812-.1262-4.9358 1.81264-5.3205 4.36717-.0152.11854-.0381.23327-.0571.34799-.5979 3.18169-3.38195 5.59091-6.7258 5.59091-1.19206 0-2.31175-.3059-3.28672-.8413-.11807-.065-.25898.0191-.25898.1529v.6846 10.3137h10.2677v-7.7324c0-1.4226 1.1501-2.5775 2.5669-2.5775h2.5669c2.9059 0 5.2443-2.42069 5.13-5.36528-.1028-2.65013-2.2431-4.8146-4.8824-4.94079z",
  openai: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
  anthropic: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z",
  xai: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
};

function logo(name, cx, cy, size, color) {
  const s = size / 24;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})"><path d="${LOGO[name]}" fill="${color}" /></g>`;
}

const DIMS = ["Momentum", "Qualification", "Technical & Security", "Commercial Readiness", "Execution Alignment"];

// ---- layout ----
const BROWSER = { x: 64, y: 150, w: 190, h: 120 };
const API = { x: 300, y: 150, w: 210, h: 120 };
const HERO = { x: 300, y: 320, w: 210, h: 150 };
const REV = { x: 566, w: 274, h: 58, step: 82, top: 182 };
const REPORT = { x: 922, y: 320, w: 238, h: 150 };
const MODELS = { x: 566, y: 636, w: 274, h: 96 };

const revY = (i) => REV.top + i * REV.step;
const revCY = (i) => revY(i) + REV.h / 2;
const cx = (b) => b.x + b.w / 2;
const cy = (b) => b.y + b.h / 2;

function frame(offset) {
  const dash = "13 11";
  const off = -(offset % 24);
  const flow = (d, color, marker, w = 3) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#${marker})" />`;

  const fanOut = DIMS.map((_, i) => {
    const sx = HERO.x + HERO.w, sy = cy(HERO), tx = REV.x, ty = revCY(i), mx = (sx + tx) / 2;
    return flow(`M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`, C.violet, "aViolet");
  }).join("\n    ");

  const fanIn = DIMS.map((_, i) => {
    const sx = REV.x + REV.w, sy = revCY(i), tx = REPORT.x, ty = cy(REPORT), mx = (sx + tx) / 2;
    return flow(`M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`, C.emerald, "aEmerald");
  }).join("\n    ");

  const revCards = DIMS.map((name, i) => {
    const y = revY(i);
    return `<g filter="url(#shadow)"><rect x="${REV.x}" y="${y}" width="${REV.w}" height="${REV.h}" rx="14" fill="#0F241C" stroke="${C.emerald}" stroke-width="2.5" /><text x="${REV.x + REV.w / 2}" y="${y + REV.h / 2 + 7}" class="rev">${name}</text></g>`;
  }).join("\n    ");

  const markers = [["Purple", C.purple], ["Blue", C.blue], ["Violet", C.violet], ["Emerald", C.emerald], ["Gold", C.gold]]
    .map(([n, c]) => `<marker id="a${n}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}" /></marker>`)
    .join("\n      ");

  const mLogoY = MODELS.y + 40;
  const mWordY = MODELS.y + 74;
  const mx0 = MODELS.x + MODELS.w / 6, mx1 = MODELS.x + MODELS.w / 2, mx2 = MODELS.x + (5 * MODELS.w) / 6;

  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${C.bg1};}svg{display:block;}</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
    <defs>
      <linearGradient id="bg" x1="120" y1="0" x2="1256" y2="768" gradientUnits="userSpaceOnUse"><stop stop-color="${C.bg0}" /><stop offset="1" stop-color="${C.bg1}" /></linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.3" /></filter>
      ${markers}
      <style>
        .title{fill:${C.ink};font:700 42px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .subtitle{fill:${C.sub};font:500 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .eyebrow{fill:${C.eyebrow};font:600 13px 'Inter','Segoe UI',Arial,sans-serif;letter-spacing:0.16em;text-anchor:middle;}
        .card{fill:${C.ink};font:700 23px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .body{fill:${C.body};font:500 15px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .heroName{fill:${C.ink};font:700 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .rev{fill:${C.ink};font:700 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .word{fill:${C.body};font:600 13px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
      </style>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)" />
    <text x="${W / 2}" y="60" class="title">How a review runs</text>
    <text x="${W / 2}" y="92" class="subtitle">Five reviews run in parallel, then merge into a single report</text>

    <!-- connectors first (under cards) -->
    ${fanOut}
    ${fanIn}
    ${flow(`M${BROWSER.x + BROWSER.w} ${cy(BROWSER)} H ${API.x}`, C.purple, "aPurple")}
    ${flow(`M${cx(API)} ${API.y + API.h} V ${HERO.y}`, C.blue, "aBlue")}
    <!-- reviews-as-a-group bracket, then animated stem into the models card -->
    <path d="M${REV.x + 12} 574 V 604 H ${REV.x + REV.w - 12} V 574" fill="none" stroke="${C.gold}" stroke-width="2" opacity="0.6" />
    ${flow(`M${REV.x + REV.w / 2} 604 V ${MODELS.y}`, C.gold, "aGold")}

    <!-- CLIENT -->
    <text x="${cx(BROWSER)}" y="${BROWSER.y - 14}" class="eyebrow">CLIENT</text>
    <g filter="url(#shadow)"><rect x="${BROWSER.x}" y="${BROWSER.y}" width="${BROWSER.w}" height="${BROWSER.h}" rx="18" fill="#1B1230" stroke="${C.purple}" stroke-width="2.5" />
      <text x="${cx(BROWSER)}" y="${BROWSER.y + 58}" class="card">Browser</text>
      <text x="${cx(BROWSER)}" y="${BROWSER.y + 86}" class="body">picks a deal and model</text></g>

    <!-- API -->
    <text x="${cx(API)}" y="${API.y - 14}" class="eyebrow">RENDER · WEB SERVICE</text>
    <g filter="url(#shadow)"><rect x="${API.x}" y="${API.y}" width="${API.w}" height="${API.h}" rx="18" fill="#12263F" stroke="${C.blue}" stroke-width="2.5" />
      ${logo("render", API.x + 40, API.y + 52, 26, C.blue)}
      <text x="${cx(API) + 16}" y="${API.y + 60}" class="card">API</text>
      <text x="${cx(API)}" y="${API.y + 90}" class="body">starts and streams the run</text></g>

    <!-- HERO -->
    <g filter="url(#shadow)"><rect x="${HERO.x}" y="${HERO.y}" width="${HERO.w}" height="${HERO.h}" rx="20" fill="#2A1E48" stroke="${C.violet}" stroke-width="3" />
      ${logo("render", cx(HERO), HERO.y + 44, 28, C.violet)}
      <text x="${cx(HERO)}" y="${HERO.y + 92}" class="heroName">analyzeOpportunity</text>
      <text x="${cx(HERO)}" y="${HERO.y + 120}" class="body">Render Workflows</text></g>

    <!-- REVIEWS -->
    <text x="${REV.x + REV.w / 2}" y="${REV.top - 22}" class="eyebrow">FIVE PARALLEL REVIEWS</text>
    ${revCards}

    <!-- REPORT -->
    <text x="${cx(REPORT)}" y="${REPORT.y - 14}" class="eyebrow">SYNTHESIZE</text>
    <g filter="url(#shadow)"><rect x="${REPORT.x}" y="${REPORT.y}" width="${REPORT.w}" height="${REPORT.h}" rx="20" fill="#0E2E38" stroke="${C.teal}" stroke-width="3" />
      <text x="${cx(REPORT)}" y="${REPORT.y + 66}" class="card">Report</text>
      <text x="${cx(REPORT)}" y="${REPORT.y + 96}" class="body">findings, risks, and a score</text></g>

    <!-- MODELS -->
    <g filter="url(#shadow)"><rect x="${MODELS.x}" y="${MODELS.y}" width="${MODELS.w}" height="${MODELS.h}" rx="18" fill="#241C0C" stroke="${C.gold}" stroke-width="2.5" />
      ${logo("openai", mx0, mLogoY, 26, C.ink)}
      ${logo("anthropic", mx1, mLogoY, 26, C.ink)}
      ${logo("xai", mx2, mLogoY, 24, C.ink)}
      <text x="${mx0}" y="${mWordY}" class="word">OpenAI</text>
      <text x="${mx1}" y="${mWordY}" class="word">Anthropic</text>
      <text x="${mx2}" y="${mWordY}" class="word">xAI</text></g>
  </svg></body></html>`;
}

import { writeFileSync } from "node:fs";
const offset = Number(process.argv[2] ?? 0);
writeFileSync(process.argv[3] ?? "/dev/stdout", frame(offset));
