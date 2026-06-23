/**
 * canvas.js v3 — Preview avec cadre et mockup mur
 */

const CANVAS_W = 340;
const CANVAS_H = 481;

const DESIGNS_CFG = {
  classique: { bg: '#FDFBF7', accent: '#C92A2A', line: '#BEBEBE', dark: '#1A1A1A', muted: '#888', border: '#E0DDD7' },
  or:        { bg: '#FFFFFF', accent: '#C9A84C', line: '#C9A84C', dark: '#1A1A1A', muted: '#888', border: '#E8D9A0' },
  sombre:    { bg: '#1A1A1A', accent: '#E8A0B0', line: '#444',    dark: '#F0F0F0', muted: '#AAA', border: '#333' },
  botanik:   { bg: '#E8EDE4', accent: '#4A7C59', line: '#8FB99A', dark: '#2C3E2D', muted: '#5A7A5E', border: '#C5D9C0' },
  vintage:   { bg: '#F5EDD6', accent: '#8B4513', line: '#C4A882', dark: '#3D2B1F', muted: '#7A5C3A', border: '#D4B896' },
};

const PICTO_MAP = { heart:'♥', wine:'♦', plane:'▲', house:'■', ring:'★', star:'✦', music:'♪' };

const FRAME_STYLES = {
  none:   null,
  black:  { outer: '#1A1A1A', inner: '#0D0D0D', thickness: 14 },
  white:  { outer: '#F5F5F5', inner: '#E0E0E0', thickness: 14 },
  wood:   { outer: '#8B6343', inner: '#6B4A2A', thickness: 16, grain: true },
  canvas: { outer: '#D4C4A8', inner: '#B8A882', thickness: 10, isCanvas: true },
};

const imgCache = {};
let currentDesign = 'classique';
let currentFrame = 'none';

function setDesign(design) {
  currentDesign = design;
  const names = { classique:'Classique', or:'Doré', sombre:'Sombre', botanik:'Botanik', vintage:'Vintage' };
  const badge = document.getElementById('designBadge');
  if (badge) badge.textContent = names[design] || design;
}

function setFrame(frame) {
  currentFrame = frame;
}

// ─── Rendu principal ────────────────────────────────────────────
async function renderPoster(data, canvasId = 'posterCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const frame = data.frame || currentFrame;
  const frameStyle = FRAME_STYLES[frame];
  const isHero = canvasId === 'heroCanvas';

  // Canvas avec marge pour le cadre + ombre + mur
  const padding = isHero ? 20 : 28;
  const frameThick = frameStyle ? frameStyle.thickness : 0;
  const totalPad = padding + frameThick;

  const totalW = CANVAS_W + totalPad * 2;
  const totalH = CANVAS_H + totalPad * 2;

  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, totalW, totalH);

  // Fond mur
  drawWall(ctx, totalW, totalH, isHero);

  // Ombre portée
  drawShadow(ctx, totalPad, totalPad, CANVAS_W, CANVAS_H, frameThick);

  // Cadre
  if (frameStyle) {
    drawFrame(ctx, totalPad - frameThick, totalPad - frameThick,
      CANVAS_W + frameThick * 2, CANVAS_H + frameThick * 2, frameStyle);
  }

  // Affiche
  await drawPosterContent(ctx, totalPad, totalPad, CANVAS_W, CANVAS_H, data);
}

// ─── Mur ────────────────────────────────────────────────────────
function drawWall(ctx, w, h, isHero) {
  // Fond mur chaleureux
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#F2EDE8');
  grad.addColorStop(1, '#E8E2DC');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Texture subtile
  if (!isHero) {
    ctx.fillStyle = 'rgba(0,0,0,0.015)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }
  }
}

// ─── Ombre ──────────────────────────────────────────────────────
function drawShadow(ctx, x, y, w, h, frameThick) {
  const fx = x - frameThick;
  const fy = y - frameThick;
  const fw = w + frameThick * 2;
  const fh = h + frameThick * 2;
  const blur = 20;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#000';
  ctx.fillRect(fx, fy, fw, fh);
  ctx.restore();
}

// ─── Cadre ──────────────────────────────────────────────────────
function drawFrame(ctx, x, y, w, h, style) {
  const t = style.thickness;

  if (style.grain) {
    // Bois : dégradé avec veinage
    const woodGrad = ctx.createLinearGradient(x, y, x+w, y);
    woodGrad.addColorStop(0,    '#9B7045');
    woodGrad.addColorStop(0.2,  '#7A5230');
    woodGrad.addColorStop(0.5,  '#8B6343');
    woodGrad.addColorStop(0.8,  '#7A5230');
    woodGrad.addColorStop(1,    '#9B7045');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(x+t, y+t, w-t*2, h-t*2);

    // Veines bois
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i*(w/8), y);
      ctx.lineTo(x + i*(w/8) + 3, y+h);
      ctx.stroke();
    }
    ctx.restore();
  } else if (style.isCanvas) {
    // Toile : bords arrondis texture
    ctx.fillStyle = style.outer;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.fillStyle = style.inner;
    roundRect(ctx, x+t, y+t, w-t*2, h-t*2, 2);
    ctx.fill();
  } else {
    // Cadre classique noir/blanc avec biseau
    const grad = ctx.createLinearGradient(x, y, x+t, y+t);
    grad.addColorStop(0, lighten(style.outer, 30));
    grad.addColorStop(1, darken(style.outer, 20));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = style.inner;
    ctx.fillRect(x+t, y+t, w-t*2, h-t*2);

    // Trait intérieur fin
    ctx.strokeStyle = lighten(style.outer, 40);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x+t-1, y+t-1, w-t*2+2, h-t*2+2);
  }
}

// ─── Contenu affiche ────────────────────────────────────────────
async function drawPosterContent(ctx, ox, oy, W, H, data) {
  const { partner1='', partner2='', steps=[], design=currentDesign } = data;
  const C = DESIGNS_CFG[design] || DESIGNS_CFG.classique;
  const margin = W * 0.07;

  // Fond affiche
  ctx.fillStyle = C.bg;
  ctx.fillRect(ox, oy, W, H);

  // Coins déco
  const cs = W * 0.058;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 0.9;
  [
    [ox+margin*0.5, oy+margin*0.5, 1, 1],
    [ox+W-margin*0.5, oy+margin*0.5, -1, 1],
    [ox+margin*0.5, oy+H-margin*0.5, 1, -1],
    [ox+W-margin*0.5, oy+H-margin*0.5, -1, -1]
  ].forEach(([x,y,dx,dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y+dy*cs); ctx.lineTo(x, y); ctx.lineTo(x+dx*cs, y);
    ctx.stroke();
  });

  let cy = oy + H * 0.06;

  // Titre
  ctx.fillStyle = C.dark;
  ctx.textAlign = 'center';
  ctx.font = `italic ${W*0.082}px Georgia, serif`;
  ctx.fillText('Notre histoire', ox + W/2, cy + W*0.07);
  cy += W * 0.092;

  // Cœur
  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.024}px Arial`;
  ctx.fillText('— ♥ —', ox + W/2, cy + W*0.017);
  cy += W * 0.034;

  // Prénoms
  const n1 = (partner1 || 'Prénom 1').toUpperCase();
  const n2 = (partner2 || 'Prénom 2').toUpperCase();
  ctx.fillStyle = C.dark;
  ctx.font = `bold ${W*0.033}px Arial`;
  ctx.fillText(`${n1}  ×  ${n2}`, ox + W/2, cy + W*0.025);
  cy += W * 0.046;

  // Ligne fine
  ctx.beginPath();
  ctx.moveTo(ox + W*0.32, cy); ctx.lineTo(ox + W*0.68, cy);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5; ctx.stroke();
  cy += 13;

  // Timeline
  const tlX = ox + W * 0.25;
  const tlTop = cy;
  const tlBottom = oy + H * 0.87;
  const activeSteps = (steps || []).filter(Boolean);
  const count = Math.max(activeSteps.length, 1);
  const zoneH = (tlBottom - tlTop) / count;

  ctx.beginPath();
  ctx.moveTo(tlX, tlTop); ctx.lineTo(tlX, tlBottom);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.8; ctx.stroke();

  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i] || {};
    const stepY = tlTop + zoneH * i + zoneH * 0.44;

    // Point
    ctx.beginPath(); ctx.arc(tlX, stepY, 5, 0, Math.PI*2);
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(tlX, stepY, 2.5, 0, Math.PI*2);
    ctx.fillStyle = C.bg; ctx.fill();

    // Date
    ctx.fillStyle = C.accent;
    ctx.font = `bold ${W*0.017}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText((step.date||'').toUpperCase(), tlX-10, stepY+4);

    // Picto
    ctx.font = `${W*0.019}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(PICTO_MAP[step.picto]||'♥', tlX, stepY-12);

    // Titre
    ctx.fillStyle = C.dark;
    ctx.font = `italic ${W*0.021}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(clip(step.title||'Votre moment', 22), tlX+11, stepY-1);

    // Description
    ctx.fillStyle = C.muted;
    ctx.font = `${W*0.013}px Arial`;
    ctx.fillText(clip(step.description||'', 34), tlX+11, stepY+W*0.019);

    // Image
    if (step.imageUrl) {
      const ix = ox + W*0.65, iw = W*0.29, ih = iw*0.73;
      try {
        const img = await loadImg(step.imageUrl);
        // Clip pour ne pas déborder de l'affiche
        ctx.save();
        ctx.beginPath();
        ctx.rect(ox, oy, W, H);
        ctx.clip();
        coverDraw(ctx, img, ix, stepY-ih/2, iw, ih);
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
        ctx.strokeRect(ix, stepY-ih/2, iw, ih);
        ctx.restore();
      } catch {
        ctx.fillStyle = C.border;
        ctx.fillRect(ix, stepY-ih/2, iw, ih);
        ctx.fillStyle = C.muted;
        ctx.font = `${W*0.02}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('📷', ix+iw/2, stepY+5);
      }
    }
  }

  // Footer
  const fy = oy + H * 0.9;
  ctx.beginPath();
  ctx.moveTo(ox+W*0.28, fy-8); ctx.lineTo(ox+W*0.72, fy-8);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.fillStyle = C.dark;
  ctx.font = `italic ${W*0.025}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Le meilleur reste à venir…', ox+W/2, fy+10);

  ctx.fillStyle = C.accent;
  ctx.font = `${W*0.028}px Arial`;
  ctx.fillText('∞', ox+W/2, fy+27);
}

// ─── Helpers ────────────────────────────────────────────────────
function clip(str, max) {
  return str && str.length > max ? str.slice(0, max-1)+'…' : (str||'');
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
  const ir = img.width/img.height, br = w/h;
  let sx,sy,sw,sh;
  if (ir > br) { sh=img.height; sw=sh*br; sx=(img.width-sw)/2; sy=0; }
  else         { sw=img.width; sh=sw/br; sx=0; sy=(img.height-sh)/2; }
  ctx.drawImage(img, sx,sy,sw,sh, x,y,w,h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

function lighten(hex, amt) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (n>>16)+amt);
  const g = Math.min(255, ((n>>8)&0xFF)+amt);
  const b = Math.min(255, (n&0xFF)+amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex, amt) { return lighten(hex, -amt); }

window.renderPoster = renderPoster;
window.setDesign = setDesign;
window.setFrame = setFrame;
