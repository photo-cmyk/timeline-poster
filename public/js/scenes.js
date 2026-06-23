/**
 * scenes.js v4 — Vraies photos Unsplash + overlay canvas affiche
 * Même principe que Thelma.pet
 */

window.Scenes = (() => {

const SCENE_PHOTOS = {
  salon: {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80&auto=format&fit=crop',
    zone: { left: 0.58, top: 0.04, width: 0.26, height: 0.66 },
    label: 'Salon'
  },
  chambre: {
    url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&q=80&auto=format&fit=crop',
    zone: { left: 0.56, top: 0.05, width: 0.24, height: 0.60 },
    label: 'Chambre'
  },
  couloir: {
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80&auto=format&fit=crop',
    zone: { left: 0.56, top: 0.05, width: 0.22, height: 0.56 },
    label: 'Couloir'
  },
  poster: {
    url: null,
    zone: { left: 0.50, top: 0.05, width: 0.44, height: 0.90 },
    label: 'Affiche seule'
  }
};

const FRAME_CFG = {
  none:   null,
  black:  { t: 10, outer: '#111', inner: '#000', hi: '#2A2A2A' },
  white:  { t: 10, outer: '#F2F2F2', inner: '#E0E0E0', hi: '#FFFFFF' },
  wood:   { t: 12, outer: '#8B6343', inner: '#5A3A20', hi: '#A8784A', grain: true },
  canvas: { t: 8,  outer: '#C8B898', inner: '#B0A080', hi: '#D8C8A8', isCanvas: true },
};

const photoCache = {};

function loadPhoto(url) {
  if (!url) return Promise.resolve(null);
  if (photoCache[url]) return Promise.resolve(photoCache[url]);
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { photoCache[url] = img; res(img); };
    img.onerror = () => res(null);
    img.src = url;
  });
}

function drawFrame(ctx, x, y, w, h, f) {
  const t = f.t;
  if (f.grain) {
    const g = ctx.createLinearGradient(x, y, x+w, y+h);
    g.addColorStop(0, '#A07848'); g.addColorStop(0.3, '#7A5230');
    g.addColorStop(0.6, '#8B6040'); g.addColorStop(1, '#A07848');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
    ctx.save(); ctx.globalAlpha = 0.06; ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(x+i*(w/14),y); ctx.lineTo(x+i*(w/14)+1.5,y+h); ctx.stroke(); }
    ctx.restore();
  } else if (f.isCanvas) {
    ctx.fillStyle = f.outer; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
  } else {
    ctx.fillStyle = f.outer; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = f.hi;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.lineTo(x+w-t,y+t); ctx.lineTo(x+t,y+t); ctx.lineTo(x+t,y+h-t); ctx.lineTo(x,y+h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f.inner;
    ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x+t,y+h-t); ctx.lineTo(x+w-t,y+h-t); ctx.lineTo(x+w-t,y+t); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
  }
}

function drawNeutralBg(ctx, cw, ch) {
  const g = ctx.createLinearGradient(0, 0, cw, ch);
  g.addColorStop(0, '#F0EBE3'); g.addColorStop(1, '#E6DDD3');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  ctx.save(); ctx.globalAlpha = 0.025;
  for (let y2 = 0; y2 < ch; y2 += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, y2, cw, 1); }
  ctx.restore();
}

async function renderScene(canvas, sceneName, frameKey, posterData) {
  const cw = canvas.width, ch = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);

  const scene = SCENE_PHOTOS[sceneName] || SCENE_PHOTOS.salon;
  const fCfg  = FRAME_CFG[frameKey] || null;
  const ft    = fCfg ? fCfg.t : 0;

  // Fond
  if (scene.url) {
    const photo = await loadPhoto(scene.url);
    if (photo) {
      const ir = photo.width / photo.height, cr = cw / ch;
      let sx, sy, sw, sh;
      if (ir > cr) { sh = photo.height; sw = sh*cr; sx = (photo.width-sw)/2; sy = 0; }
      else         { sw = photo.width;  sh = sw/cr; sx = 0; sy = (photo.height-sh)/2; }
      ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, cw, ch);
    } else { drawNeutralBg(ctx, cw, ch); }
  } else { drawNeutralBg(ctx, cw, ch); }

  // Position affiche
  const z = scene.zone;
  const posterH = ch * z.height;
  const posterW = posterH / 1.414;
  const totalW  = posterW + ft * 2;
  const totalH  = posterH + ft * 2;
  const px = cw * z.left - totalW / 2;
  const py = ch * z.top;

  // Ombre
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = Math.max(14, posterW * 0.07);
  ctx.shadowOffsetX = posterW * 0.02;
  ctx.shadowOffsetY = posterW * 0.03;
  ctx.fillStyle = '#000';
  ctx.fillRect(px, py, totalW, totalH);
  ctx.restore();

  // Cadre
  if (fCfg) drawFrame(ctx, px, py, totalW, totalH, fCfg);

  // Affiche
  await window.Poster.drawPoster(ctx, px+ft, py+ft, posterW, posterH, posterData);

  // Intégration réaliste légère
  if (sceneName !== 'poster' && scene.url) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(220,210,195,0.07)';
    ctx.fillRect(px+ft, py+ft, posterW, posterH);
    ctx.restore();
  }
}

return { renderScene };
})();
