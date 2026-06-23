const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { uploadToSupabase } = require('../services/storage');

const router = express.Router();

// Multer en mémoire (pas de disque, direct Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  }
});

// POST /api/upload/image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) throw new Error('Aucun fichier reçu');

    // Optimiser l'image avec Sharp (ratio 4:3, max 1200px)
    const optimized = await sharp(req.file.buffer)
      .resize(1200, 900, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const filename = `uploads/${uuidv4()}.jpg`;
    const publicUrl = await uploadToSupabase(optimized, filename, 'image/jpeg');

    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('[UPLOAD ERROR]', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
