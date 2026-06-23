const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fetch = require('node-fetch');

const FORMAT = {
  A3: { width: 841.89, height: 1190.55 },
  A4: { width: 595.28, height: 841.89 },
};

const DESIGNS = {
  classique: { bg: '#FDFBF7', accent: '#C92A2A', line: '#A0A0A0', dark: '#1A1A1A', muted: '#777', border: '#E0DDD7' },
  or:        { bg: '#FFFFFF', accent: '#C9A84C', line: '#C9A84C', dark: '#1A1A1A', muted: '#888', border: '#E8D9A0' },
  sombre:    { bg: '#1A1A1A', accent: '#E8A0B0', line: '#444', dark: '#F5F5F5', muted: '#AAA', border: '#333' },
  botanik:   { bg: '#E8EDE4', accent: '#4A7C59', line: '#7FAD8A', dark: '#2C3E2D', muted: '#5A7A5E', border: '#C5D9C0' },
  vintage:   { bg: '#F5EDD6', accent: '#8B4513', line: '#B8956A', dark: '#3D2B1F', muted: '#7A5C3A', border: '#D4B896' },
};

const PICTO_MAP = {
  heart: '♥', wine: '♦', plane: '▲', house: '■', ring: '★', star: '✦', music: '♪',
};

async function generatePoster(orderData) {
  const { partner1, partner2, product = 'A3', steps, design = 'classique' } = orderData;
  const fmt = FORMAT[product] || FORMAT.A3;
  const C = DESIGNS[design] || DESIGNS.classique;

  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({
        size: [fmt.width, fmt.height],
        margin: 0,
        info: { Title: `Timeline ${partner1} & ${partner2}`, Author: 'Notre Histoire' },
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = fmt.width;
      const H = fmt.height;
      const margin = W * 0.06;

      // Fond
      doc.rect(0, 0, W, H).fill(C.bg);

      // Décoration coins (subtile)
      const cornerSize = W * 0.06;
      doc.moveTo(margin * 0.6, margin * 0.6).lineTo(margin * 0.6 + cornerSize, margin * 0.6)
        .moveTo(margin * 0.6, margin * 0.6).lineTo(margin * 0.6, margin * 0.6 + cornerSize)
        .strokeColor(C.accent).lineWidth(0.8).stroke();
      doc.moveTo(W - margin * 0.6, margin * 0.6).lineTo(W - margin * 0.6 - cornerSize, margin * 0.6)
        .moveTo(W - margin * 0.6, margin * 0.6).lineTo(W - margin * 0.6, margin * 0.6 + cornerSize)
        .strokeColor(C.accent).lineWidth(0.8).stroke();

      let cursorY = H * 0.055;

      // "Notre histoire"
      doc.font('Helvetica-Oblique').fontSize(W * 0.068).fillColor(C.dark)
        .text('Notre histoire', 0, cursorY, { align: 'center', width: W });
      cursorY += W * 0.082;

      // Cœur accent
      doc.font('Helvetica').fontSize(W * 0.022).fillColor(C.accent)
        .text('— ♥ —', 0, cursorY, { align: 'center', width: W });
      cursorY += W * 0.038;

      // Prénoms
      doc.font('Helvetica-Bold').fontSize(W * 0.034).fillColor(C.dark)
        .text(`${partner1.toUpperCase()}  ×  ${partner2.toUpperCase()}`, margin, cursorY, {
          align: 'center', width: W - margin * 2, characterSpacing: W * 0.007,
        });
      cursorY += W * 0.052;

      // Séparateur
      doc.moveTo(W * 0.35, cursorY).lineTo(W * 0.65, cursorY)
        .strokeColor(C.line).lineWidth(0.5).stroke();
      cursorY += 14;

      // Timeline
      const timelineX = W * 0.26;
      const timelineTop = cursorY;
      const timelineBottom = H * 0.875;
      const stepCount = Math.max(steps.length, 1);
      const stepZoneH = (timelineBottom - timelineTop) / stepCount;

      // Ligne verticale
      doc.moveTo(timelineX, timelineTop).lineTo(timelineX, timelineBottom)
        .strokeColor(C.line).lineWidth(0.7).stroke();

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i] || {};
        const centerY = timelineTop + stepZoneH * i + stepZoneH * 0.44;

        // Point ancrage
        doc.circle(timelineX, centerY, 5).fillColor(C.accent).fill();
        doc.circle(timelineX, centerY, 5).strokeColor(C.bg).lineWidth(1.5).stroke();

        // Date
        doc.font('Helvetica-Bold').fontSize(W * 0.019).fillColor(C.accent)
          .text((step.date || '').toUpperCase(), margin * 0.5, centerY - W * 0.011, {
            width: timelineX - margin * 0.5 - 10, align: 'right',
          });

        // Picto
        const pictoSize = W * 0.02;
        doc.font('Helvetica').fontSize(pictoSize).fillColor(C.accent)
          .text(PICTO_MAP[step.picto] || '♥', timelineX - pictoSize, centerY - 22, { width: pictoSize * 2, align: 'center' });

        // Titre
        const textLeft = timelineX + 14;
        const textW = W * 0.36;
        doc.font('Helvetica-Oblique').fontSize(W * 0.023).fillColor(C.dark)
          .text(step.title || '', textLeft, centerY - W * 0.022, { width: textW });

        // Description
        doc.font('Helvetica').fontSize(W * 0.015).fillColor(C.muted)
          .text(step.description || '', textLeft, centerY + W * 0.004, { width: textW });

        // Image
        if (step.imageUrl) {
          try {
            const imgBuf = await fetchImage(step.imageUrl);
            const imgX = W * 0.67;
            const imgW = W * 0.27;
            const imgH = imgW * 0.72;
            const iy = centerY - imgH / 2;
            doc.image(imgBuf, imgX, iy, { width: imgW, height: imgH, cover: [imgW, imgH] });
            doc.rect(imgX, iy, imgW, imgH).strokeColor(C.border).lineWidth(0.5).stroke();
          } catch {}
        }
      }

      // Footer
      const footerY = H * 0.9;
      doc.moveTo(W * 0.25, footerY - 8).lineTo(W * 0.75, footerY - 8)
        .strokeColor(C.line).lineWidth(0.4).stroke();
      doc.font('Helvetica-Oblique').fontSize(W * 0.024).fillColor(C.dark)
        .text('Le meilleur reste à venir…', 0, footerY + 4, { align: 'center', width: W });
      doc.font('Helvetica').fontSize(W * 0.028).fillColor(C.accent)
        .text('∞', 0, footerY + W * 0.036, { align: 'center', width: W });

      // Coins bas
      doc.moveTo(margin * 0.6, H - margin * 0.6).lineTo(margin * 0.6 + cornerSize, H - margin * 0.6)
        .moveTo(margin * 0.6, H - margin * 0.6).lineTo(margin * 0.6, H - margin * 0.6 - cornerSize)
        .strokeColor(C.accent).lineWidth(0.8).stroke();
      doc.moveTo(W - margin * 0.6, H - margin * 0.6).lineTo(W - margin * 0.6 - cornerSize, H - margin * 0.6)
        .moveTo(W - margin * 0.6, H - margin * 0.6).lineTo(W - margin * 0.6, H - margin * 0.6 - cornerSize)
        .strokeColor(C.accent).lineWidth(0.8).stroke();

      doc.end();
    } catch (err) { reject(err); }
  });
}

async function fetchImage(url) {
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return sharp(buf).resize(800, 600, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer();
}

module.exports = { generatePoster, DESIGNS };
