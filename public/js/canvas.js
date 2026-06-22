/**
 * canvas.js — Rendu temps réel de l'affiche sur Canvas HTML
 * Reproduit fidèlement le design du PDF généré côté serveur
 */

const CANVAS_W = 420;
const CANVAS_H = 594; // ratio A4/A3

const COLORS = {
  background: '#FDFBF7',
  accent: '#C92A2A',
  line: '#A0A0A0',
  dark: '#1A1A1A',
  muted: '#777777',
  border: '#E0DDD7',
};

const PICTO_MAP = {
  heart:  '♥',
  wine:   '🍷',
  plane:  '✈',
  house:  '🏠',
  ring:   '💍',
  star:   '★',
  music:  '♪',
};

// Cache images pour éviter les rechargements
const imageCache = {};

/**
 * Point d'entrée : dessine toute l'affiche
 */
async function renderPoster(data) {
  const canvas = document.getElementById('posterCanvas');
  if (!canvas) return;

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const ctx = canvas.getContext('2d');
  const { partner1 = '', partner2 = '', steps = [] } = data;

  // ── Fond ──
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const margin = CANVAS_W * 0.06;

  // ── En-tête : "Notre histoire" ──
  let cursorY = CANVAS_H * 0.05;

  ctx.fillStyle = COLORS.dark;
  ctx.font = `${CANVAS_W * 0.072}px 'Great Vibes', cursive`;
  ctx.textAlign = 'center';
  ctx.fillText('Notre histoire', CANVAS_W / 2, cursorY + CANVAS_W * 0.06);
  cursorY += CANVAS_W * 0.088;

  // ── Cœur ──
  ctx.fillStyle = COLORS.accent;
  ctx.font = `${CANVAS_W * 0.028}px Arial`;
  ctx.fillText('♥', CANVAS_W / 2, cursorY + CANVAS_W * 0.016);
  cursorY += CANVAS_W * 0.042;

  // ── Prénoms ──
  const names = `${(partner1 || 'PRÉNOM 1').toUpperCase()}  &  ${(partner2 || 'PRÉNOM 2').toUpperCase()}`;
  ctx.fillStyle = COLORS.dark;
  ctx.font = `bold ${CANVAS_W * 0.038}px 'Montserrat', sans-serif`;
  ctx.letterSpacing = `${CANVAS_W * 0.006}px`;
  ctx.fillText(names, CANVAS_W / 2, cursorY + CANVAS_W * 0.028);
  ctx.letterSpacing = '0px';
  cursorY += CANVAS_W * 0.055;

  // ── Ligne séparatrice sous les prénoms ──
  ctx.beginPath();
  ctx.moveTo(margin * 2, cursorY);
  ctx.lineTo(CANVAS_W - margin * 2, cursorY);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  cursorY += 12;

  // ── Timeline ──
  const timelineX = CANVAS_W * 0.27;
  const timelineTop = cursorY;
  const timelineBottom = CANVAS_H * 0.88;
  const activeSteps = steps.filter(s => s); // filtrer null
  const stepCount = Math.max(activeSteps.length, 1);
  const stepZoneH = (timelineBottom - timelineTop) / stepCount;

  // Ligne verticale
  ctx.beginPath();
  ctx.moveTo(timelineX, timelineTop);
  ctx.lineTo(timelineX, timelineBottom);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Étapes ──
  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i] || {};
    const centerY = timelineTop + stepZoneH * i + stepZoneH * 0.45;

    // Point d'ancrage
    ctx.beginPath();
    ctx.arc(timelineX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    // DATE (gauche)
    ctx.fillStyle = COLORS.dark;
    ctx.font = `bold ${CANVAS_W * 0.022}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText((step.date || '').toUpperCase(), timelineX - 10, centerY + 4);

    // PICTO (sur la ligne)
    ctx.font = `${CANVAS_W * 0.026}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(PICTO_MAP[step.picto] || '♥', timelineX, centerY - 14);

    // TITRE étape
    const textLeft = timelineX + 12;
    const textMaxW = CANVAS_W * 0.37;

    ctx.fillStyle = COLORS.dark;
    ctx.font = `italic ${CANVAS_W * 0.024}px 'Great Vibes', cursive`;
    ctx.textAlign = 'left';
    ctx.fillText(step.title || 'Votre moment', textLeft, centerY - 2);

    // DESCRIPTION
    ctx.fillStyle = COLORS.muted;
    ctx.font = `${CANVAS_W * 0.016}px 'Inter', sans-serif`;
    const desc = truncateText(step.description || '', 38);
    ctx.fillText(desc, textLeft, centerY + CANVAS_W * 0.018);

    // IMAGE
    if (step.imageUrl) {
      const imgX = CANVAS_W * 0.68;
      const imgW = CANVAS_W * 0.26;
      const imgH = imgW * 0.75;

      try {
        const img = await loadImageCached(step.imageUrl);
        // Recadrage cover
        drawImageCover(ctx, img, imgX, centerY - imgH / 2, imgW, imgH);

        // Bordure fine
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(imgX, centerY - imgH / 2, imgW, imgH);
      } catch {
        // Placeholder si image pas encore chargée
        ctx.fillStyle = '#EAE7E0';
        ctx.fillRect(CANVAS_W * 0.68, centerY - CANVAS_W * 0.1, CANVAS_W * 0.26, CANVAS_W * 0.195);
        ctx.fillStyle = COLORS.muted;
        ctx.font = `${CANVAS_W * 0.02}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('📷', CANVAS_W * 0.81, centerY + 6);
      }
    }
  }

  // ── Pied de page ──
  const footerY = CANVAS_H * 0.91;

  ctx.beginPath();
  ctx.moveTo(CANVAS_W * 0.3, footerY - 8);
  ctx.lineTo(CANVAS_W * 0.7, footerY - 8);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = COLORS.dark;
  ctx.font = `italic ${CANVAS_W * 0.028}px 'Great Vibes', cursive`;
  ctx.textAlign = 'center';
  ctx.fillText('Le meilleur reste à venir...', CANVAS_W / 2, footerY + 16);

  ctx.fillStyle = COLORS.accent;
  ctx.font = `${CANVAS_W * 0.032}px Arial`;
  ctx.fillText('∞', CANVAS_W / 2, footerY + 38);
}

// ─── Helpers ────────────────────────────────────────────────────

function loadImageCached(url) {
  if (imageCache[url]) return Promise.resolve(imageCache[url]);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache[url] = img; resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height; sw = img.height * boxRatio;
    sx = (img.width - sw) / 2; sy = 0;
  } else {
    sw = img.width; sh = img.width / boxRatio;
    sx = 0; sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function truncateText(text, maxLen) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

// Exposer pour form.js
window.renderPoster = renderPoster;
