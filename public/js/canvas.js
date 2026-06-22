/**
 * canvas.js v2 — Preview temps réel avec 5 designs
 */

const CANVAS_W = 380;
const CANVAS_H = 537; // ratio A3

const DESIGNS = {
  classique: { bg: '#FDFBF7', accent: '#C92A2A', line: '#A0A0A0', dark: '#1A1A1A', muted: '#777', border: '#E0DDD7' },
  or:        { bg: '#FFFFFF', accent: '#C9A84C', line: '#C9A84C', dark: '#1A1A1A', muted: '#888', border: '#E8D9A0' },
  sombre:    { bg: '#1A1A1A', accent: '#E8A0B0', line: '#3A3A3A', dark: '#F5F5F5', muted: '#999', border: '#2A2A2A' },
  botanik:   { bg: '#E8EDE4', accent: '#4A7C59', line: '#7FAD8A', dark: '#2C3E2D', muted: '#5A7A5E', border: '#C5D9C0' },
  vintage:   { bg: '#F5EDD6', accent: '#8B4513', line: '#B8956A', dark: '#3D2B1F', muted: '#7A5C3A', border: '#D4B896' },
};

const PICTOS = { heart:'♥', wine:'♦', plane:'▲', house:'■', ring:'★', star:'✦', music:'♪' };

const imgCache = {};
let currentDesign = 'classique';

function setDesign(design) {
  currentDesign = design;
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
  const margin = W * 0.06;

  // Fond
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Coins décoratifs
  const cs = W * 0.055;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 0.8;
  // Top-left
  ctx.beginPath(); ctx.moveTo(margin*0.6, margin*0.6+cs); ctx.lineTo(margin*0.6, margin*0.6); ctx.lineTo(margin*0.6+cs, margin*0.6); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W-margin*0.6-cs, margin*0.6); ctx.lineTo(W-margin*0.6, margin*0.6); ctx.lineTo(W-margin*0.6, margin*0.6+cs); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(margin*0.6, H-margin*0.6-cs); ctx.lineTo(margin*0.6, H-margin*0.6); ctx.lineTo(margin*0.6+cs, H-margin*0.6); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W-margin*0.6-cs, H-margin*0.6); ctx.lineTo(W-margin*0.6, H-margin*0.6); ctx.lineTo(W-margin*0.6, H-margin*0.6-cs); ctx.stroke();

  let cursorY = H * 0.055;

  // "Notre histoire"
  ctx.fillStyle = C.dark;
  ctx.font = `italic ${W*0.07}px 'Great Vibes', cursive`;
  ctx.textAlign = 'center';
  ctx.fillText('Notre histoire', W/2, cursorY + W*0.062);
  cursorY += W * 0.082;

  // Séparateur accent
  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.02}px Arial`;
  ctx.fillText('— ♥ —', W/2, cursorY + W*0.014);
  cursorY += W * 0.034;

  // Prénoms
  const names = `${(partner1||'PRÉNOM 1').toUpperCase()}  ×  ${(partner2||'PRÉNOM 2').toUpperCase()}`;
  ctx.fillStyle = C.dark;
  ctx.font = `bold ${W*0.032}px 'DM Sans', sans-serif`;
  ctx.fillText(names, W/2, cursorY + W*0.024);
  cursorY += W * 0.048;

  // Ligne fine
  ctx.beginPath();
  ctx.moveTo(W*0.35, cursorY); ctx.lineTo(W*0.65, cursorY);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5; ctx.stroke();
  cursorY += 12;

  // Timeline
  const timelineX = W * 0.26;
  const timelineTop = cursorY;
  const timelineBottom = H * 0.875;
  const stepCount = Math.max(steps.length, 1);
  const zoneH = (timelineBottom - timelineTop) / stepCount;

  ctx.beginPath();
  ctx.moveTo(timelineX, timelineTop); ctx.lineTo(timelineX, timelineBottom);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.7; ctx.stroke();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] || {};
    const cy = timelineTop + zoneH * i + zoneH * 0.44;

    // Point ancrage
    ctx.beginPath();
    ctx.arc(timelineX, cy, 5, 0, Math.PI*2);
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.beginPath();
    ctx.arc(timelineX, cy, 3.5, 0, Math.PI*2);
    ctx.fillStyle = C.bg; ctx.fill();

    // Date
    ctx.fillStyle = C.accent;
    ctx.font = `bold ${W*0.018}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText((step.date||'').toUpperCase(), timelineX-10, cy+4);

    // Picto
    ctx.font = `${W*0.018}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.accent;
    ctx.fillText(PICTOS[step.picto]||'♥', timelineX, cy-13);

    // Titre
    ctx.fillStyle = C.dark;
    ctx.font = `italic ${W*0.022}px 'Cormorant Garamond', serif`;
    ctx.textAlign = 'left';
    ctx.fillText(step.title||'Votre moment', timelineX+11, cy-2);

    // Description
    ctx.fillStyle = C.muted;
    ctx.font = `${W*0.014}px 'DM Sans', sans-serif`;
    const desc = (step.description||'').slice(0,36);
    ctx.fillText(desc, timelineX+11, cy+W*0.018);

    // Image
    if (step.imageUrl) {
      const imgX = W*0.66;
      const imgW = W*0.28;
      const imgH = imgW*0.72;
      try {
        const img = await loadImg(step.imageUrl);
        coverDraw(ctx, img, imgX, cy-imgH/2, imgW, imgH);
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
        ctx.strokeRect(imgX, cy-imgH/2, imgW, imgH);
      } catch {
        ctx.fillStyle = C.border;
        ctx.fillRect(imgX, cy-imgH/2, imgW, imgH);
        ctx.fillStyle = C.muted;
        ctx.font = `${W*0.022}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('📷', imgX+imgW/2, cy+6);
      }
    }
  }

  // Footer
  const fy = H * 0.9;
  ctx.beginPath();
  ctx.moveTo(W*0.25, fy-6); ctx.lineTo(W*0.75, fy-6);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.4; ctx.stroke();

  ctx.fillStyle = C.dark;
  ctx.font = `italic ${W*0.025}px 'Great Vibes', cursive`;
  ctx.textAlign = 'center';
  ctx.fillText('Le meilleur reste à venir…', W/2, fy+14);

  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.028}px Arial`;
  ctx.fillText('∞', W/2, fy+32);
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
  const ir = img.width/img.height;
  const br = w/h;
  let sx,sy,sw,sh;
  if (ir > br) { sh=img.height; sw=img.height*br; sx=(img.width-sw)/2; sy=0; }
  else { sw=img.width; sh=img.width/br; sx=0; sy=(img.height-sh)/2; }
  ctx.drawImage(img, sx,sy,sw,sh, x,y,w,h);
}

window.renderPoster = renderPoster;
window.setDesign = setDesign;
