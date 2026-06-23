const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || 'timeline-posters';

/**
 * Upload un buffer vers Supabase Storage
 * @returns {Promise<string>} URL publique du fichier
 */
async function uploadToSupabase(buffer, filename, contentType) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return urlData.publicUrl;
}

/**
 * Supprime un fichier du bucket (nettoyage après commande envoyée)
 */
async function deleteFromSupabase(filename) {
  const { error } = await supabase.storage.from(BUCKET).remove([filename]);
  if (error) console.warn(`[STORAGE] Suppression échouée pour ${filename}:`, error.message);
}

module.exports = { uploadToSupabase, deleteFromSupabase };
