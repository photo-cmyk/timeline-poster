const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generatePoster } = require('../services/pdfGenerator');
const { uploadToSupabase } = require('../services/storage');
const { createGelatoOrder } = require('../services/gelato');

const router = express.Router();

// POST /webhook
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[WEBHOOK] Signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // On répond immédiatement à Stripe (éviter timeout)
  res.json({ received: true });

  // Traitement asynchrone
  if (event.type === 'checkout.session.completed') {
    handleCompletedCheckout(event.data.object).catch(err =>
      console.error('[WEBHOOK] Erreur traitement commande:', err.message)
    );
  }
});

async function handleCompletedCheckout(session) {
  console.log(`\n🛒 Nouvelle commande: ${session.id}`);

  try {
    // ── 1. Reconstituer les données client depuis les métadonnées ──
    const meta = session.metadata;
    const chunksCount = parseInt(meta.steps_chunks, 10);
    let stepsJson = '';
    for (let i = 0; i < chunksCount; i++) {
      stepsJson += meta[`steps_${i}`];
    }
    const steps = JSON.parse(stepsJson);

    const orderData = {
      partner1: meta.partner1,
      partner2: meta.partner2,
      product: meta.product || 'A3',
      steps,
      sessionId: session.id,
    };

    // ── 2. Récupérer l'adresse de livraison depuis Stripe ──
    const shippingDetails = session.shipping_details;
    if (!shippingDetails?.address) {
      throw new Error('Adresse de livraison manquante dans la session Stripe');
    }

    console.log(`📦 Client: ${orderData.partner1} & ${orderData.partner2}`);
    console.log(`📍 Livraison: ${shippingDetails.address.city}, ${shippingDetails.address.country}`);

    // ── 3. Générer le PDF haute définition ──
    console.log('🎨 Génération du PDF...');
    const pdfBuffer = await generatePoster(orderData);

    // ── 4. Uploader le PDF sur Supabase ──
    const pdfFilename = `posters/${session.id}.pdf`;
    const pdfUrl = await uploadToSupabase(pdfBuffer, pdfFilename, 'application/pdf');
    console.log(`✅ PDF hébergé: ${pdfUrl}`);

    // ── 5. Créer la commande Gelato ──
    console.log('🖨️  Envoi à Gelato...');
    const gelatoOrder = await createGelatoOrder({
      orderData,
      pdfUrl,
      shipping: shippingDetails,
      stripeSessionId: session.id,
    });
    console.log(`✅ Commande Gelato créée: ${gelatoOrder.id}`);

    console.log(`🎉 Commande ${session.id} entièrement traitée !\n`);

  } catch (err) {
    // En cas d'erreur : log détaillé pour debug manuel
    console.error(`❌ ERREUR commande ${session.id}:`, err.message);
    console.error(err.stack);
    // TODO: Envoyer un email d'alerte à l'admin
  }
}

module.exports = router;
