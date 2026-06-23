/**
 * poster.js — Rendu pur de l'affiche sur un canvas 2D
 * Exporté en window.Poster pour usage par scenes.js et form.js
 */

window.Poster = (() => {

const DESIGNS = {
  classique: { bg:'#FDFBF7', accent:'#C92A2A', line:'#C8C8C8', dark:'#1A1A1A', muted:'#888', border:'#E0DDD7' },
  or:        { bg:'#FFFFFF', accent:'#C9A84C', line:'#D4B86A', dark:'#1A1A1A', muted:'#999', border:'#EDD99A' },
  sombre:    { bg:'#181818', accent:'#E8A0B0', line:'#3A3A3A', dark:'#EFEFEF', muted:'#999', border:'#2C2C2C' },
  botanik:   { bg:'#E8EDE4', accent:'#4A7C59', line:'#8EB89A', dark:'#253326', muted:'#5A7560', border:'#C0D9C5' },
  vintage:   { bg:'#F5EDD6', accent:'#8B4513', line:'#C8A87A', dark:'#3A2518', muted:'#7A5C3A', border:'#D4B896' },
};

const PICTOS = {
  heart:'♥', wine:'♦', plane:'▲', house:'■', ring:'★', star:'✦', music:'♪'
};

const imgCache = {};

function loadImg(url) {
  if (imgCache[url]) return Promise.resolve(imgCache[url]);
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgCache[url] = img; res(img); };
    img.onerror = () => rej(new Error('img load failed: ' + url));
    img.src = url;
  });
}

function coverDraw(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, br = w / h;
  let sx, sy, sw, sh;
  if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
  else         { sw = img.width;  sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function clip(s, n) { return s && s.length > n ? s.slice(0, n-1)+'…' : (s||''); }

/**
 * Dessine l'affiche sur le canvas fourni, dans la zone (ox,oy,W,H)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ox - offset x
 * @param {number} oy - offset y
 * @param {number} W  - largeur zone affiche
 * @param {number} H  - hauteur zone affiche
 * @param {object} data - { partner1, partner2, steps, design }
 */
async function drawPoster(ctx, ox, oy, W, H, data) {
  const { partner1='', partner2='', steps=[], design='classique' } = data;
  const C = DESIGNS[design] || DESIGNS.classique;

  // Fond
  ctx.fillStyle = C.bg;
  ctx.fillRect(ox, oy, W, H);

  // Coins décoratifs fins
  const cs = W * 0.055;
  ctx.strokeStyle = C.accent; ctx.lineWidth = Math.max(0.6, W/500);
  [
    [ox + W*0.055, oy + W*0.055, 1, 1],
    [ox + W*0.945, oy + W*0.055, -1, 1],
    [ox + W*0.055, oy + H*0.96, 1, -1],
    [ox + W*0.945, oy + H*0.96, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy*cs); ctx.lineTo(x, y); ctx.lineTo(x + dx*cs, y);
    ctx.stroke();
  });

  let cy = oy + H * 0.062;

  // "Notre histoire"
  ctx.fillStyle = C.dark;
  ctx.textAlign = 'center';
  ctx.font = `italic ${W * 0.082}px Georgia, 'Times New Roman', serif`;
  ctx.fillText('Notre histoire', ox + W/2, cy + W*0.068);
  cy += W * 0.092;

  // — ♥ —
  ctx.fillStyle = C.accent;
  ctx.font = `${W * 0.022}px Arial, sans-serif`;
  ctx.fillText('— ♥ —', ox + W/2, cy + W * 0.016);
  cy += W * 0.034;

  // Prénoms
  const n1 = (partner1 || 'Prénom 1').toUpperCase();
  const n2 = (partner2 || 'Prénom 2').toUpperCase();
  ctx.fillStyle = C.dark;
  ctx.font = `bold ${W * 0.031}px Arial, sans-serif`;
  ctx.fillText(`${n1}  ×  ${n2}`, ox + W/2, cy + W*0.024);
  cy += W * 0.044;

  // Ligne fine centrale
  ctx.beginPath();
  ctx.moveTo(ox + W*0.33, cy); ctx.lineTo(ox + W*0.67, cy);
  ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(0.4, W/800); ctx.stroke();
  cy += 13;

  // ── Timeline ──
  const tlX = ox + W * 0.255;
  const tlTop = cy;
  const tlBot = oy + H * 0.875;
  const activeSteps = (steps || []).filter(Boolean);
  const count = Math.max(activeSteps.length, 1);
  const zH = (tlBot - tlTop) / count;

  ctx.beginPath();
  ctx.moveTo(tlX, tlTop); ctx.lineTo(tlX, tlBot);
  ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(0.6, W/600); ctx.stroke();

  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i] || {};
    const sy2 = tlTop + zH * i + zH * 0.44;
    const r = Math.max(3.5, W * 0.014);

    // Point ancrage
    ctx.beginPath(); ctx.arc(tlX, sy2, r, 0, Math.PI*2);
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(tlX, sy2, r*0.5, 0, Math.PI*2);
    ctx.fillStyle = C.bg; ctx.fill();

    // Date (gauche)
    ctx.fillStyle = C.accent;
    ctx.font = `bold ${W * 0.018}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(clip((step.date||'').toUpperCase(), 16), tlX - r - 6, sy2 + 4);

    // Picto (dessus du point)
    ctx.font = `${W * 0.019}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.accent;
    ctx.fillText(PICTOS[step.picto] || '♥', tlX, sy2 - r - 6);

    // Titre
    const tx = tlX + r + 8;
    const tw = W * 0.37;
    ctx.fillStyle = C.dark;
    ctx.font = `italic ${W * 0.021}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(clip(step.title || 'Votre moment', 22), tx, sy2 - 1);

    // Description
    ctx.fillStyle = C.muted;
    ctx.font = `${W * 0.013}px Arial, sans-serif`;
    ctx.fillText(clip(step.description || '', 34), tx, sy2 + W * 0.019);

    // Image
    if (step.imageUrl) {
      const ix = ox + W * 0.655;
      const iw = W * 0.295;
      const ih = iw * 0.73;
      const iy = sy2 - ih / 2;
      try {
        const img = await loadImg(step.imageUrl);
        // Clip to poster bounds
        ctx.save();
        ctx.beginPath(); ctx.rect(ox, oy, W, H); ctx.clip();
        coverDraw(ctx, img, ix, iy, iw, ih);
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
        ctx.strokeRect(ix, iy, iw, ih);
        ctx.restore();
      } catch {
        ctx.fillStyle = C.border; ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = C.muted; ctx.font = `${W*0.022}px Arial`;
        ctx.textAlign = 'center'; ctx.fillText('📷', ix+iw/2, sy2+5);
      }
    }
  }

  // Footer
  const fy = oy + H * 0.9;
  ctx.beginPath();
  ctx.moveTo(ox + W*0.28, fy - 8); ctx.lineTo(ox + W*0.72, fy - 8);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.fillStyle = C.dark;
  ctx.font = `italic ${W * 0.024}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Le meilleur reste à venir…', ox + W/2, fy + 11);

  ctx.fillStyle = C.accent;
  ctx.font = `${W * 0.028}px Arial`;
  ctx.fillText('∞', ox + W/2, fy + 28);
}

return { drawPoster, DESIGNS };
})();
