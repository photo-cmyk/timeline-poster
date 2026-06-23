/**
 * canvas.js v2.2 — Rendu immédiat sans dépendance polices externes
 */

const CANVAS_W = 340;
const CANVAS_H = 481;

const DESIGNS = {
  classique: { bg: '#FDFBF7', accent: '#C92A2A', line: '#BEBEBE', dark: '#1A1A1A', muted: '#888', border: '#E0DDD7' },
  or:        { bg: '#FFFFFF', accent: '#C9A84C', line: '#C9A84C', dark: '#1A1A1A', muted: '#888', border: '#E8D9A0' },
  sombre:    { bg: '#1A1A1A', accent: '#E8A0B0', line: '#444',    dark: '#F0F0F0', muted: '#AAA', border: '#333' },
  botanik:   { bg: '#E8EDE4', accent: '#4A7C59', line: '#8FB99A', dark: '#2C3E2D', muted: '#5A7A5E', border: '#C5D9C0' },
  vintage:   { bg: '#F5EDD6', accent: '#8B4513', line: '#C4A882', dark: '#3D2B1F', muted: '#7A5C3A', border: '#D4B896' },
};

const PICTO_MAP = { heart:'♥', wine:'♦', plane:'▲', house:'■', ring:'★', star:'✦', music:'♪' };

const imgCache = {};
let currentDesign = 'classique';

function setDesign(design) {
  currentDesign = design;
  const badge = document.getElementById('designBadge');
  const names = { classique:'Classique', or:'Doré', sombre:'Sombre', botanik:'Botanik', vintage:'Vintage' };
  if (badge) badge.textContent = names[design] || design;
}

async function renderPoster(data, canvasId = 'posterCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const ctx = canvas.getContext('2d');
  const { partner1 = '', partner2 = '', steps = [], design = currentDesign } = data;
  const C = DESIGNS[design] || DESIGNS.classique;
  const W = CANVAS_W;
  const H = CANVAS_H;
  const margin = W * 0.07;

  // ── Fond ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Coins déco ──
  const cs = W * 0.06;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1;
  [
    [margin*0.5, margin*0.5, 1, 1],
    [W-margin*0.5, margin*0.5, -1, 1],
    [margin*0.5, H-margin*0.5, 1, -1],
    [W-margin*0.5, H-margin*0.5, -1, -1]
  ].forEach(([x,y,dx,dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y+dy*cs); ctx.lineTo(x, y); ctx.lineTo(x+dx*cs, y);
    ctx.stroke();
  });

  let cy = H * 0.06;

  // ── Titre "Notre histoire" ──
  ctx.fillStyle = C.dark;
  ctx.textAlign = 'center';
  ctx.font = `italic ${W*0.085}px Georgia, serif`;
  ctx.fillText('Notre histoire', W/2, cy + W*0.072);
  cy += W * 0.095;

  // ── Séparateur cœur ──
  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.025}px Arial`;
  ctx.fillText('— ♥ —', W/2, cy + W*0.018);
  cy += W * 0.036;

  // ── Prénoms ──
  const n1 = (partner1 || 'Prénom 1').toUpperCase();
  const n2 = (partner2 || 'Prénom 2').toUpperCase();
  ctx.fillStyle = C.dark;
  ctx.font = `bold ${W*0.034}px Arial, sans-serif`;
  ctx.fillText(`${n1}  ×  ${n2}`, W/2, cy + W*0.026);
  cy += W * 0.048;

  // ── Ligne fine ──
  ctx.beginPath();
  ctx.moveTo(W*0.32, cy); ctx.lineTo(W*0.68, cy);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.6; ctx.stroke();
  cy += 14;

  // ── Timeline ──
  const tlX = W * 0.25;
  const tlTop = cy;
  const tlBottom = H * 0.87;
  const activeSteps = (steps || []).filter(Boolean);
  const count = Math.max(activeSteps.length, 1);
  const zoneH = (tlBottom - tlTop) / count;

  // Ligne verticale
  ctx.beginPath();
  ctx.moveTo(tlX, tlTop); ctx.lineTo(tlX, tlBottom);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.8; ctx.stroke();

  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i] || {};
    const stepY = tlTop + zoneH * i + zoneH * 0.44;

    // Point ancrage
    ctx.beginPath(); ctx.arc(tlX, stepY, 5, 0, Math.PI*2);
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(tlX, stepY, 2.5, 0, Math.PI*2);
    ctx.fillStyle = C.bg; ctx.fill();

    // Date (gauche)
    ctx.fillStyle = C.accent;
    ctx.font = `bold ${W*0.018}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText((step.date || '').toUpperCase(), tlX - 10, stepY + 4);

    // Picto (sur la ligne, au dessus du point)
    ctx.font = `${W*0.02}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(PICTO_MAP[step.picto] || '♥', tlX, stepY - 12);

    // Titre (droite)
    const tx = tlX + 12;
    const tw = W * 0.38;
    ctx.fillStyle = C.dark;
    ctx.font = `italic ${W*0.022}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(clip(step.title || 'Votre moment', 22), tx, stepY - 1);

    // Description
    ctx.fillStyle = C.muted;
    ctx.font = `${W*0.014}px Arial`;
    ctx.fillText(clip(step.description || '', 34), tx, stepY + W*0.02);

    // Image (extrême droite)
    if (step.imageUrl) {
      const ix = W * 0.65, iw = W * 0.29, ih = iw * 0.73;
      try {
        const img = await loadImg(step.imageUrl);
        coverDraw(ctx, img, ix, stepY - ih/2, iw, ih);
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
        ctx.strokeRect(ix, stepY - ih/2, iw, ih);
      } catch {
        ctx.fillStyle = C.border;
        ctx.fillRect(ix, stepY - ih/2, iw, ih);
        ctx.fillStyle = C.muted;
        ctx.font = `${W*0.022}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('📷', ix + iw/2, stepY + 6);
      }
    }
  }

  // ── Footer ──
  const fy = H * 0.9;
  ctx.beginPath();
  ctx.moveTo(W*0.28, fy-8); ctx.lineTo(W*0.72, fy-8);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.fillStyle = C.dark;
  ctx.font = `italic ${W*0.026}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Le meilleur reste à venir…', W/2, fy + 10);

  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.03}px Arial`;
  ctx.fillText('∞', W/2, fy + 28);
}

function clip(str, max) {
  return str && str.length > max ? str.slice(0, max-1) + '…' : (str || '');
}

function loadImg(url) {
  if (imgCache[url]) return Promise.resolve(imgCache[url]);
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgCache[url] = img; res(img); };
    img.onerror = rej;
    img.src = url;
  });
}

function coverDraw(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const br = w / h;
  let sx, sy, sw, sh;
  if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
  else         { sw = img.width;  sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

window.renderPoster = renderPoster;
window.setDesign = setDesign;
