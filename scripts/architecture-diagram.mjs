// Source for web/public/how-a-review-runs.gif — the "How a review runs" diagram.
// Hand-coded SVG; each invocation emits one HTML frame for a given dash offset,
// so the flow arrows animate across the 24-frame loop.

const W = 1376, H = 768;

// Light theme
const C = {
  bg0: "#FFFFFF", bg1: "#EEF2F8",
  ink: "#0F172A", body: "#51607A", eyebrow: "#7A88A0", sub: "#475569",
  card: "#FFFFFF",
  purple: "#7C3AED", blue: "#2563EB", violet: "#6D28D9", emerald: "#059669",
  gold: "#B45309", teal: "#0E7490",
  wrapFill: "#F6F3FF", wrapStroke: "#7C3AED",
};

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
const BROWSER = { x: 48, y: 150, w: 178, h: 104 };
const API = { x: 48, y: 306, w: 178, h: 104 };
const WRAP = { x: 268, y: 138, w: 872, h: 486 };
const HERO = { x: 300, y: 340, w: 176, h: 168 };            // analyzeOpportunity (root)
const REV = { x: 540, w: 252, h: 52, step: 64, top: 272 };  // 5 review tasks
const SYN = { x: 878, y: 340, w: 198, h: 168 };             // synthesize
const MODELS = { x: 540, y: 656, w: 252, h: 94 };           // external model APIs

const revY = (i) => REV.top + i * REV.step;
const revCY = (i) => revY(i) + REV.h / 2;
const cx = (b) => b.x + b.w / 2;
const cy = (b) => b.y + b.h / 2;

function frame(offset) {
  const dash = "13 11";
  const off = -(offset % 24);
  const flow = (d, color, marker, w = 2.5) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-dashoffset="${off}" marker-end="url(#${marker})" />`;

  const fanOut = DIMS.map((_, i) => {
    const sx = HERO.x + HERO.w, sy = cy(HERO), tx = REV.x, ty = revCY(i), mx = (sx + tx) / 2;
    return flow(`M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`, C.violet, "aViolet");
  }).join("\n    ");

  const fanIn = DIMS.map((_, i) => {
    const sx = REV.x + REV.w, sy = revCY(i), tx = SYN.x, ty = cy(SYN), mx = (sx + tx) / 2;
    return flow(`M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`, C.emerald, "aEmerald");
  }).join("\n    ");

  const revCards = DIMS.map((name, i) => {
    const y = revY(i);
    return `<g filter="url(#shadow)"><rect x="${REV.x}" y="${y}" width="${REV.w}" height="${REV.h}" rx="12" fill="${C.card}" stroke="${C.emerald}" stroke-width="2" /><text x="${REV.x + REV.w / 2}" y="${y + REV.h / 2 + 6}" class="rev">${name}</text></g>`;
  }).join("\n    ");

  const markers = [["Purple", C.purple], ["Blue", C.blue], ["Violet", C.violet], ["Emerald", C.emerald], ["Gold", C.gold]]
    .map(([n, c]) => `<marker id="a${n}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}" /></marker>`)
    .join("\n      ");

  const mLogoY = MODELS.y + 38, mWordY = MODELS.y + 72;
  const mx0 = MODELS.x + MODELS.w / 6, mx1 = MODELS.x + MODELS.w / 2, mx2 = MODELS.x + (5 * MODELS.w) / 6;

  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${C.bg1};}svg{display:block;}</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1376" y2="768" gradientUnits="userSpaceOnUse"><stop stop-color="${C.bg0}" /><stop offset="1" stop-color="${C.bg1}" /></linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#1E293B" flood-opacity="0.14" /></filter>
      ${markers}
      <style>
        .title{fill:${C.ink};font:700 42px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .subtitle{fill:${C.sub};font:500 19px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .eyebrow{fill:${C.eyebrow};font:600 13px 'Inter','Segoe UI',Arial,sans-serif;letter-spacing:0.14em;text-anchor:middle;}
        .wrapLabel{fill:${C.ink};font:700 20px 'Inter','Segoe UI',Arial,sans-serif;}
        .card{fill:${C.ink};font:700 22px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .body{fill:${C.body};font:500 14px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .heroName{fill:${C.ink};font:700 18px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .rev{fill:${C.ink};font:700 18px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
        .word{fill:${C.body};font:600 13px 'Inter','Segoe UI',Arial,sans-serif;text-anchor:middle;}
      </style>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)" />
    <text x="${W / 2}" y="58" class="title">How a review runs</text>
    <text x="${W / 2}" y="90" class="subtitle">Five reviews run in parallel inside one Render Workflow, then merge into a report</text>

    <!-- Render Workflows wrapper -->
    <g filter="url(#shadow)"><rect x="${WRAP.x}" y="${WRAP.y}" width="${WRAP.w}" height="${WRAP.h}" rx="26" fill="${C.wrapFill}" stroke="${C.wrapStroke}" stroke-width="2" stroke-dasharray="2 0" /></g>
    ${logo("render", WRAP.x + 34, WRAP.y + 34, 24, C.ink)}
    <text x="${WRAP.x + 54}" y="${WRAP.y + 41}" class="wrapLabel">Render Workflows</text>

    <!-- connectors (under cards) -->
    ${fanOut}
    ${fanIn}
    ${flow(`M${BROWSER.x + BROWSER.w / 2} ${BROWSER.y + BROWSER.h} V ${API.y}`, C.purple, "aPurple")}
    ${flow(`M${API.x + API.w} ${cy(API)} C ${API.x + API.w + 40} ${cy(API)}, ${HERO.x - 40} ${cy(HERO)}, ${HERO.x} ${cy(HERO)}`, C.blue, "aBlue")}
    ${flow(`M${REV.x + REV.w / 2} ${MODELS.y} V ${WRAP.y + WRAP.h}`, C.gold, "aGold")}

    <!-- CLIENT -->
    <text x="${cx(BROWSER)}" y="${BROWSER.y - 14}" class="eyebrow">CLIENT</text>
    <g filter="url(#shadow)"><rect x="${BROWSER.x}" y="${BROWSER.y}" width="${BROWSER.w}" height="${BROWSER.h}" rx="16" fill="${C.card}" stroke="${C.purple}" stroke-width="2" />
      <text x="${cx(BROWSER)}" y="${BROWSER.y + 52}" class="card">Browser</text>
      <text x="${cx(BROWSER)}" y="${BROWSER.y + 78}" class="body">picks a deal and model</text></g>

    <!-- API -->
    <g filter="url(#shadow)"><rect x="${API.x}" y="${API.y}" width="${API.w}" height="${API.h}" rx="16" fill="${C.card}" stroke="${C.blue}" stroke-width="2" />
      <text x="${cx(API)}" y="${API.y + 54}" class="card">API</text>
      <text x="${cx(API)}" y="${API.y + 82}" class="body">starts and streams the run</text></g>

    <!-- analyzeOpportunity (root task) -->
    <g filter="url(#shadow)"><rect x="${HERO.x}" y="${HERO.y}" width="${HERO.w}" height="${HERO.h}" rx="16" fill="${C.card}" stroke="${C.violet}" stroke-width="2" />
      <text x="${cx(HERO)}" y="${HERO.y + 78}" class="heroName">analyzeOpportunity</text>
      <text x="${cx(HERO)}" y="${HERO.y + 104}" class="body">the root task</text></g>

    <!-- REVIEWS -->
    <text x="${REV.x + REV.w / 2}" y="${REV.top - 20}" class="eyebrow">FIVE PARALLEL REVIEWS</text>
    ${revCards}

    <!-- SYNTHESIZE -->
    <g filter="url(#shadow)"><rect x="${SYN.x}" y="${SYN.y}" width="${SYN.w}" height="${SYN.h}" rx="16" fill="${C.card}" stroke="${C.teal}" stroke-width="2" />
      <text x="${cx(SYN)}" y="${SYN.y + 66}" class="card">Synthesize</text>
      <text x="${cx(SYN)}" y="${SYN.y + 94}" class="body">merges the findings</text>
      <text x="${cx(SYN)}" y="${SYN.y + 114}" class="body">into one report</text></g>

    <!-- MODELS (external) -->
    <g filter="url(#shadow)"><rect x="${MODELS.x}" y="${MODELS.y}" width="${MODELS.w}" height="${MODELS.h}" rx="16" fill="${C.card}" stroke="${C.gold}" stroke-width="2" />
      ${logo("openai", mx0, mLogoY, 24, C.ink)}
      ${logo("anthropic", mx1, mLogoY, 24, C.ink)}
      ${logo("xai", mx2, mLogoY, 22, C.ink)}
      <text x="${mx0}" y="${mWordY}" class="word">OpenAI</text>
      <text x="${mx1}" y="${mWordY}" class="word">Anthropic</text>
      <text x="${mx2}" y="${mWordY}" class="word">xAI</text></g>
  </svg></body></html>`;
}

import { writeFileSync } from "node:fs";
const offset = Number(process.argv[2] ?? 0);
writeFileSync(process.argv[3] ?? "/dev/stdout", frame(offset));
