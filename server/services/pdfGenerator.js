/**
 * pdfGenerator.js — Génération PDF 300 DPI via Puppeteer
 * Reconstruit exactement le même rendu HTML que le front-end client.
 */
const puppeteer = require('puppeteer-core');
const chromium  = require('@sparticuz/chromium');

// Dimensions physiques en mm
const FORMATS = {
  A3: { w: 297, h: 420 },
  A4: { w: 210, h: 297 },
};

// Pictos SVG identiques au front
const PICTOS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="#C92A2A" stroke-width="1.8" stroke-linecap="round"><path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z"/></svg>`,
  ring:  `<svg viewBox="0 0 24 24" fill="none" stroke="#C92A2A" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="14" r="6"/><path d="M8 14l2-6 2-2 2 2 2 6"/></svg>`,
  plane: `<svg viewBox="0 0 24 24" fill="none" stroke="#C92A2A" stroke-width="1.8" stroke-linecap="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
  house: `<svg viewBox="0 0 24 24" fill="none" stroke="#C92A2A" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  wine:  `<svg viewBox="0 0 24 24" fill="none" stroke="#C92A2A" stroke-width="1.8" stroke-linecap="round"><path d="M8 2h8l-2 7a4 4 0 0 1-8 0L8 2z"/><line x1="12" y1="12" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>`,
};

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildPosterHTML(orderData) {
  const { partner1, partner2, steps, product = 'A3' } = orderData;
  const n1 = (partner1 || '').toUpperCase();
  const n2 = (partner2 || '').toUpperCase();
  const n  = steps.length;

  const stepsHTML = steps.map(step => {
    const pictoSVG = PICTOS[step.picto] || PICTOS.heart;
    const imgTag = step.imageUrl
      ? `<img src="${step.imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block"/>`
      : `<div style="color:#B8B4AC;font-size:24px;display:flex;align-items:center;justify-content:center;height:100%">📷</div>`;

    const imgH = Math.max(60, 120 - n * 12);

    return `
      <div style="display:grid;grid-template-columns:23% 5% 37% 30%;gap:0 1%;align-items:center;position:relative">
        <div style="text-align:right;font-weight:700;font-size:${14-n}px;text-transform:uppercase;padding-right:8px;color:#111;font-family:'Inter',sans-serif;line-height:1.2">
          ${esc((step.date || '').toUpperCase())}
        </div>
        <div style="display:flex;justify-content:center;align-items:center;position:relative;z-index:1">
          <div style="width:28px;height:28px;border-radius:50%;border:1.2px solid #C92A2A;background:#fff;display:flex;align-items:center;justify-content:center">
            <div style="width:15px;height:15px">${pictoSVG}</div>
          </div>
        </div>
        <div style="padding-left:12px">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;font-size:${16-n}px;color:#111;margin-bottom:4px;line-height:1.2">
            ${esc(step.title || '')}
          </div>
          <div style="font-size:${12-n}px;color:#777;line-height:1.45;font-family:'Inter',sans-serif">
            ${esc(step.description || '')}
          </div>
        </div>
        <div style="height:${imgH}px;border-radius:3px;overflow:hidden;background:#EDE9E2;border:0.5px solid #D8D4CC">
          ${imgTag}
        </div>
      </div>`;
  }).join(`<div style="height:1px;background:#DDDAD4;margin:0 5%;opacity:.4"></div>`);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#FDFBF7;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
</style>
</head>
<body>
<div style="
  width:100%;
  min-height:100vh;
  background:#FDFBF7;
  padding:7% 6% 5%;
  display:flex;
  flex-direction:column;
">
  <!-- En-tête -->
  <div style="text-align:center;margin-bottom:5%">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:400;font-size:42px;color:#111;line-height:1.1;margin-bottom:10px">
      Notre histoire
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px">
      <div style="width:60px;height:0.6px;background:#C92A2A"></div>
      <div style="color:#C92A2A;font-size:14px">♥</div>
      <div style="width:60px;height:0.6px;background:#C92A2A"></div>
    </div>
    <div style="font-weight:700;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#111;font-family:'Inter',sans-serif">
      ${n1}  ×  ${n2}
    </div>
  </div>

  <!-- Timeline -->
  <div style="flex:1;position:relative;display:flex;flex-direction:column;justify-content:space-around;gap:0">
    <!-- Ligne verticale -->
    <div style="position:absolute;left:25%;top:0;bottom:0;width:0.8px;background:#A0A0A0;z-index:0"></div>
    ${stepsHTML}
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:4%">
    <div style="width:40%;height:0.5px;background:#A0A0A0;margin:0 auto 10px"></div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:18px;color:#111">
      Le meilleur reste à venir…
    </div>
    <div style="color:#C92A2A;font-size:22px;margin-top:6px">∞</div>
  </div>
</div>
</body>
</html>`;
}

async function generatePoster(orderData) {
  const fmt = FORMATS[orderData.product] || FORMATS.A3;

  // 300 DPI : 1mm = 300/25.4 ≈ 11.81 px
  // On utilise deviceScaleFactor=3.125 sur une viewport 96dpi → 300dpi effectif
  const DPI_SCALE   = 3.125;
  const PX_PER_MM   = 3.7795; // 96 dpi
  const viewportW   = Math.round(fmt.w * PX_PER_MM);
  const viewportH   = Math.round(fmt.h * PX_PER_MM);

  const html = buildPosterHTML(orderData);

  const browser = await puppeteer.launch({
    args:            chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath:  await chromium.executablePath(),
    headless:        chromium.headless,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width:             viewportW,
      height:            viewportH,
      deviceScaleFactor: DPI_SCALE,
    });

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Attendre que les images distantes soient chargées
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(res => { img.onload = img.onerror = res; }))
      );
    });

    const pdfBuffer = await page.pdf({
      width:       `${fmt.w}mm`,
      height:      `${fmt.h}mm`,
      printBackground: true,
      margin:      { top:0, right:0, bottom:0, left:0 },
    });

    return Buffer.from(pdfBuffer);

  } finally {
    await browser.close();
  }
}

module.exports = { generatePoster };
