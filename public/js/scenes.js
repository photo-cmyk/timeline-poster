/**
 * scenes.js — Rendu des mockups de pièces avec cadre
 * window.Scenes
 */

window.Scenes = (() => {

const FRAME_CFG = {
  none:   null,
  black:  { t: 12, outer: '#111', inner: '#000', highlight: '#333' },
  white:  { t: 12, outer: '#F0F0F0', inner: '#E0E0E0', highlight: '#FFFFFF' },
  wood:   { t: 14, outer: '#8B6343', inner: '#6B4A2A', highlight: '#A07848', grain: true },
  canvas: { t: 10, outer: '#C8B898', inner: '#B0A080', highlight: '#D8C8A8', canvas: true },
};

// ── Dessin du cadre ─────────────────────────────────────────
function drawFrame(ctx, x, y, w, h, frameKey) {
  const f = FRAME_CFG[frameKey];
  if (!f) return;
  const t = f.t;

  if (f.grain) {
    // Cadre bois avec veinage
    const g = ctx.createLinearGradient(x, y, x+w, y+h);
    g.addColorStop(0,   '#A07848'); g.addColorStop(0.25, '#7A5230');
    g.addColorStop(0.5, '#8B6343'); g.addColorStop(0.75,'#7A5230');
    g.addColorStop(1,   '#A07848');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // Vide intérieur
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
    // Veines
    ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#2A1500'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath(); ctx.moveTo(x+i*(w/12), y); ctx.lineTo(x+i*(w/12)+2, y+h); ctx.stroke();
    }
    ctx.restore();
  } else if (f.canvas) {
    // Toile avec coins arrondis
    ctx.fillStyle = f.outer; roundRect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
    // Texture toile
    ctx.save(); ctx.globalAlpha = 0.06; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(x, y+i*(h/8)); ctx.lineTo(x+w, y+i*(h/8)); ctx.stroke();
    }
    ctx.restore();
  } else {
    // Cadre classique avec biseau
    // Face extérieure
    ctx.fillStyle = f.outer; ctx.fillRect(x, y, w, h);
    // Biseau clair (coin haut-gauche)
    ctx.fillStyle = f.highlight;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x+w, y); ctx.lineTo(x+w-t, y+t);
    ctx.lineTo(x+t, y+t); ctx.lineTo(x+t, y+h-t); ctx.lineTo(x, y+h);
    ctx.closePath(); ctx.fill();
    // Biseau sombre (coin bas-droit)
    ctx.fillStyle = f.inner;
    ctx.beginPath();
    ctx.moveTo(x+w, y); ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h);
    ctx.lineTo(x+t, y+h-t); ctx.lineTo(x+w-t, y+h-t); ctx.lineTo(x+w-t, y+t);
    ctx.closePath(); ctx.fill();
    // Vide intérieur noir
    ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
  }
}

// ── Scènes de pièces ────────────────────────────────────────

function drawSalon(ctx, cw, ch) {
  // Sol parquet
  const floorY = ch * 0.72;
  ctx.fillStyle = '#C8A87A'; ctx.fillRect(0, floorY, cw, ch - floorY);
  // Lames parquet
  ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = '#8B6030'; ctx.lineWidth = 0.8;
  for (let y = floorY; y < ch; y += 14) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }
  for (let x = 0; x < cw; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x, ch); ctx.stroke();
  }
  ctx.restore();

  // Mur fond
  const wallGrad = ctx.createLinearGradient(0, 0, cw, ch*0.72);
  wallGrad.addColorStop(0, '#EDE8E0'); wallGrad.addColorStop(1, '#E0D9CF');
  ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, cw, floorY);

  // Plafond
  ctx.fillStyle = '#F5F2EE'; ctx.fillRect(0, 0, cw, ch*0.08);

  // Moulure plafond
  ctx.fillStyle = '#DDD8D0'; ctx.fillRect(0, ch*0.08, cw, 3);

  // Canapé simple
  const couchY = floorY - ch*0.22;
  const couchW = cw * 0.55; const couchX = (cw - couchW) / 2;
  // Dossier
  ctx.fillStyle = '#8B7355'; ctx.fillRect(couchX, couchY, couchW, ch*0.14);
  // Assise
  ctx.fillStyle = '#A08060'; ctx.fillRect(couchX, couchY+ch*0.1, couchW, ch*0.12);
  // Pieds
  ctx.fillStyle = '#5A3E28';
  ctx.fillRect(couchX+8, couchY+ch*0.22, 10, ch*0.04);
  ctx.fillRect(couchX+couchW-18, couchY+ch*0.22, 10, ch*0.04);
  // Coussins
  ctx.fillStyle = '#C8B090';
  ctx.fillRect(couchX+16, couchY+ch*0.01, couchW*0.27, ch*0.08);
  ctx.fillRect(couchX+couchW*0.38, couchY+ch*0.01, couchW*0.27, ch*0.08);
  ctx.fillRect(couchX+couchW-couchW*0.27-16, couchY+ch*0.01, couchW*0.27, ch*0.08);

  // Petite table basse
  ctx.fillStyle = '#6B4A2A';
  ctx.fillRect(cw*0.35, floorY-ch*0.06, cw*0.3, ch*0.03);
  ctx.fillRect(cw*0.37, floorY-ch*0.03, 6, ch*0.03);
  ctx.fillRect(cw*0.62, floorY-ch*0.03, 6, ch*0.03);
}

function drawChambre(ctx, cw, ch) {
  // Sol
  ctx.fillStyle = '#D4C4A8'; ctx.fillRect(0, ch*0.75, cw, ch*0.25);
  // Mur
  const wallGrad = ctx.createLinearGradient(0, 0, 0, ch*0.75);
  wallGrad.addColorStop(0, '#F0ECE4'); wallGrad.addColorStop(1, '#E4DDD4');
  ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, cw, ch*0.75);
  // Plafond
  ctx.fillStyle = '#F8F5F0'; ctx.fillRect(0, 0, cw, ch*0.07);
  ctx.fillStyle = '#DDD8D0'; ctx.fillRect(0, ch*0.07, cw, 2);

  // Lit
  const bedY = ch * 0.45;
  ctx.fillStyle = '#8B7355'; ctx.fillRect(cw*0.15, bedY, cw*0.7, ch*0.08); // tête de lit
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cw*0.15, bedY+ch*0.08, cw*0.7, ch*0.2); // matelas
  // Draps
  ctx.fillStyle = '#E8E0D8'; ctx.fillRect(cw*0.15, bedY+ch*0.14, cw*0.7, ch*0.14);
  // Oreiller
  ctx.fillStyle = '#F5F0EB';
  ctx.fillRect(cw*0.22, bedY+ch*0.09, cw*0.22, ch*0.06);
  ctx.fillRect(cw*0.56, bedY+ch*0.09, cw*0.22, ch*0.06);
  // Pied de lit
  ctx.fillStyle = '#6B4A2A'; ctx.fillRect(cw*0.15, bedY+ch*0.28, cw*0.7, ch*0.02);
  ctx.fillRect(cw*0.17, bedY+ch*0.3, 8, ch*0.04);
  ctx.fillRect(cw*0.75, bedY+ch*0.3, 8, ch*0.04);

  // Table de nuit
  ctx.fillStyle = '#A08060';
  ctx.fillRect(cw*0.04, bedY+ch*0.08, cw*0.1, ch*0.18);
  // Lampe
  ctx.fillStyle = '#C8A870'; ctx.fillRect(cw*0.07, bedY+ch*0.04, 4, ch*0.05);
  ctx.fillStyle = '#FFE8B0'; ctx.beginPath();
  ctx.arc(cw*0.072, bedY+ch*0.04, 12, 0, Math.PI, true); ctx.fill();
}

function drawCouloir(ctx, cw, ch) {
  // Sol carrelage
  ctx.fillStyle = '#D8D0C8'; ctx.fillRect(0, ch*0.7, cw, ch*0.3);
  ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = '#888'; ctx.lineWidth = 0.5;
  for (let y = ch*0.7; y < ch; y += 20) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke();
  }
  for (let x = 0; x < cw; x += 20) {
    ctx.beginPath(); ctx.moveTo(x,ch*0.7); ctx.lineTo(x,ch); ctx.stroke();
  }
  ctx.restore();

  // Mur
  const wallGrad = ctx.createLinearGradient(0, 0, 0, ch*0.7);
  wallGrad.addColorStop(0, '#EDE8E2'); wallGrad.addColorStop(1, '#E2DAD0');
  ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, cw, ch*0.7);
  ctx.fillStyle = '#F6F3EF'; ctx.fillRect(0, 0, cw, ch*0.07);
  ctx.fillStyle = '#D8D4CE'; ctx.fillRect(0, ch*0.07, cw, 2);

  // Lambris bas
  ctx.fillStyle = '#DDD6CC'; ctx.fillRect(0, ch*0.52, cw, ch*0.18);
  ctx.fillStyle = '#C8C0B6'; ctx.fillRect(0, ch*0.52, cw, 2);
  ctx.fillStyle = '#C8C0B6'; ctx.fillRect(0, ch*0.7, cw, 2);
  // Moulures lambris
  ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#A8A098'; ctx.lineWidth = 0.6;
  for (let x = 20; x < cw; x += 60) {
    ctx.beginPath(); ctx.rect(x, ch*0.545, 50, ch*0.155); ctx.stroke();
  }
  ctx.restore();
}

function drawPosterOnly(ctx, cw, ch) {
  // Fond neutre élégant
  const bg = ctx.createLinearGradient(0, 0, cw, ch);
  bg.addColorStop(0, '#F5F0EB'); bg.addColorStop(1, '#EDE8E0');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
  // Texture subtile
  ctx.save(); ctx.globalAlpha = 0.03;
  for (let y = 0; y < ch; y += 3) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, cw, 1); }
  ctx.restore();
}

const SCENE_DRAWERS = {
  salon:   drawSalon,
  chambre: drawChambre,
  couloir: drawCouloir,
  poster:  drawPosterOnly,
};

const SCENE_POSITIONS = {
  salon:   { cx: 0.5, cy: 0.28, ph: 0.52 },
  chambre: { cx: 0.5, cy: 0.25, ph: 0.44 },
  couloir: { cx: 0.5, cy: 0.26, ph: 0.48 },
  poster:  { cx: 0.5, cy: 0.5,  ph: 0.78 },
};

/**
 * Dessine une scène complète (pièce + cadre + affiche) sur un canvas
 * @param {HTMLCanvasElement} canvas
 * @param {string} scene - 'salon'|'chambre'|'couloir'|'poster'
 * @param {string} frameKey - 'none'|'black'|'white'|'wood'|'canvas'
 * @param {object} posterData - données affiche
 */
async function renderScene(canvas, scene, frameKey, posterData) {
  const cw = canvas.width, ch = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);

  // Dessiner la pièce
  const drawer = SCENE_DRAWERS[scene] || SCENE_DRAWERS.salon;
  drawer(ctx, cw, ch);

  // Calculer position/taille de l'affiche
  const pos = SCENE_POSITIONS[scene] || SCENE_POSITIONS.salon;
  const ratio = 1 / 1.414; // ratio A3 portrait
  const fCfg = FRAME_CFG[frameKey];
  const frameT = fCfg ? fCfg.t : 0;

  const pH = ch * pos.ph;
  const pW = pH * ratio;
  const totalW = pW + frameT * 2;
  const totalH = pH + frameT * 2;
  const px = cw * pos.cx - totalW / 2;
  const py = ch * pos.cy - totalH / 2;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#000';
  ctx.fillRect(px, py, totalW, totalH);
  ctx.restore();

  // Cadre
  if (fCfg) drawFrame(ctx, px, py, totalW, totalH, frameKey);

  // Affiche
  await window.Poster.drawPoster(ctx, px + frameT, py + frameT, pW, pH, posterData);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

return { renderScene };
})();
