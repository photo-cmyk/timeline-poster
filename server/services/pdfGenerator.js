const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fetch = require('node-fetch');

// ─── Constantes d'impression ───────────────────────────────────────────────
// A3 à 300 DPI = 3508 x 4960 px / 72 = 297 x 420 mm en points PDF
const FORMAT = {
  A3: { width: 841.89, height: 1190.55 }, // points (1 point = 0.353mm)
  A4: { width: 595.28, height: 841.89 },
};

// Palette couleurs
const COLORS = {
  background: '#FDFBF7',
  accent: '#C92A2A',
  line: '#A0A0A0',
  textDark: '#1A1A1A',
  textMuted: '#666666',
  dateBg: '#F0EDE6',
};

// Pictos en Unicode (fallback texte si pas de police icon)
const PICTOS = {
  heart: '♥',
  wine: '🍷',
  plane: '✈',
  house: '🏠',
  ring: '💍',
  star: '★',
  music: '♪',
};

/**
 * Génère le PDF de l'affiche timeline
 * @param {Object} orderData - { partner1, partner2, product, steps }
 * @returns {Promise<Buffer>} - Buffer PDF
 */
async function generatePoster(orderData) {
  const { partner1, partner2, product = 'A3', steps } = orderData;
  const fmt = FORMAT[product] || FORMAT.A3;

  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];

      const doc = new PDFDocument({
        size: [fmt.width, fmt.height],
        margin: 0,
        // 300 DPI : PDFKit travaille en points (72 ppi), l'imprimeur gère le DPI
        // On précise les métadonnées pour que l'imprimeur sache que c'est 300 DPI
        info: {
          Title: `Timeline ${partner1} & ${partner2}`,
          Author: 'Timeline Poster',
          Subject: 'Poster imprimé haute définition 300 DPI',
        },
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ────────────────────────────────────────────
      // FOND
      // ────────────────────────────────────────────
      doc.rect(0, 0, fmt.width, fmt.height).fill(COLORS.background);

      const W = fmt.width;
      const H = fmt.height;
      const margin = W * 0.06; // 6% de marge latérale

      // ────────────────────────────────────────────
      // EN-TÊTE
      // ────────────────────────────────────────────
      let cursorY = H * 0.05;

      // "Notre histoire" en manuscrite
      doc
        .font('Helvetica-Oblique') // fallback – remplacer par Great Vibes si disponible
        .fontSize(W * 0.065)
        .fillColor(COLORS.textDark)
        .text('Notre histoire', 0, cursorY, { align: 'center', width: W });

      cursorY += W * 0.08;

      // Petit cœur rouge
      doc
        .font('Helvetica')
        .fontSize(W * 0.025)
        .fillColor(COLORS.accent)
        .text('♥', 0, cursorY, { align: 'center', width: W });

      cursorY += W * 0.04;

      // Prénoms en majuscules espacés
      doc
        .font('Helvetica-Bold')
        .fontSize(W * 0.038)
        .fillColor(COLORS.textDark)
        .text(
          `${partner1.toUpperCase()}  &  ${partner2.toUpperCase()}`,
          margin,
          cursorY,
          {
            align: 'center',
            width: W - margin * 2,
            characterSpacing: W * 0.008,
          }
        );

      cursorY += W * 0.06;

      // ────────────────────────────────────────────
      // TIMELINE : calcul zones
      // ────────────────────────────────────────────
      const timelineX = W * 0.27;       // Ligne verticale à 27% de la largeur
      const timelineTop = cursorY + 10;
      const timelineBottom = H * 0.88;
      const stepZoneHeight = (timelineBottom - timelineTop) / steps.length;

      // Ligne verticale grise
      doc
        .moveTo(timelineX, timelineTop)
        .lineTo(timelineX, timelineBottom)
        .strokeColor(COLORS.line)
        .lineWidth(0.8)
        .stroke();

      // ────────────────────────────────────────────
      // ÉTAPES
      // ────────────────────────────────────────────
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepCenterY = timelineTop + stepZoneHeight * i + stepZoneHeight * 0.45;

        // ── Cercle point d'ancrage ──
        doc
          .circle(timelineX, stepCenterY, 4)
          .fillColor(COLORS.accent)
          .fill();

        // ── DATE (à gauche, alignée droite) ──
        const dateText = (step.date || '').toUpperCase();
        doc
          .font('Helvetica-Bold')
          .fontSize(W * 0.018)
          .fillColor(COLORS.textDark)
          .text(dateText, margin, stepCenterY - W * 0.012, {
            width: timelineX - margin - 12,
            align: 'right',
          });

        // ── PICTO (sur la ligne) ──
        const picto = PICTOS[step.picto] || '♥';
        const pictoSize = W * 0.022;
        doc
          .font('Helvetica')
          .fontSize(pictoSize)
          .fillColor(COLORS.accent)
          .text(picto, timelineX - pictoSize / 2 - 2, stepCenterY - pictoSize * 0.65, {
            width: pictoSize + 4,
            align: 'center',
          });

        // ── TITRE étape (à droite de la ligne) ──
        const textLeft = timelineX + 16;
        const textWidth = W * 0.38;

        doc
          .font('Helvetica-Oblique')
          .fontSize(W * 0.022)
          .fillColor(COLORS.textDark)
          .text(step.title || '', textLeft, stepCenterY - W * 0.025, {
            width: textWidth,
          });

        // ── DESCRIPTION ──
        doc
          .font('Helvetica')
          .fontSize(W * 0.016)
          .fillColor(COLORS.textMuted)
          .text(step.description || '', textLeft, stepCenterY + W * 0.002, {
            width: textWidth,
          });

        // ── IMAGE (extrême droite) ──
        if (step.imageUrl) {
          try {
            const imgBuffer = await fetchAndOptimizeImage(step.imageUrl);
            const imgX = W * 0.68;
            const imgW = W * 0.26;
            const imgH = imgW * 0.75; // ratio 4:3

            doc.image(imgBuffer, imgX, stepCenterY - imgH / 2, {
              width: imgW,
              height: imgH,
              cover: [imgW, imgH],
            });

            // Fine bordure autour de l'image
            doc
              .rect(imgX, stepCenterY - imgH / 2, imgW, imgH)
              .strokeColor('#E0DDD7')
              .lineWidth(0.5)
              .stroke();
          } catch (imgErr) {
            console.error(`[PDF] Image step ${i} non chargée:`, imgErr.message);
            // Placeholder gris si image indisponible
            doc
              .rect(W * 0.68, stepCenterY - W * 0.1, W * 0.26, W * 0.195)
              .fillColor('#EAE7E0')
              .fill();
          }
        }
      }

      // ────────────────────────────────────────────
      // PIED DE PAGE
      // ────────────────────────────────────────────
      const footerY = H * 0.91;

      // Ligne séparatrice fine
      doc
        .moveTo(W * 0.3, footerY - 10)
        .lineTo(W * 0.7, footerY - 10)
        .strokeColor(COLORS.line)
        .lineWidth(0.5)
        .stroke();

      // Phrase de conclusion
      doc
        .font('Helvetica-Oblique')
        .fontSize(W * 0.026)
        .fillColor(COLORS.textDark)
        .text('Le meilleur reste à venir...', 0, footerY, {
          align: 'center',
          width: W,
        });

      // Symbole infini
      doc
        .font('Helvetica')
        .fontSize(W * 0.03)
        .fillColor(COLORS.accent)
        .text('∞', 0, footerY + W * 0.04, {
          align: 'center',
          width: W,
        });

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Récupère une image depuis une URL et la convertit en Buffer JPEG optimisé
 */
async function fetchAndOptimizeImage(url) {
  const response = await fetch(url, { timeout: 10000 });
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return await sharp(buffer)
    .resize(800, 600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toBuffer();
}

module.exports = { generatePoster };
