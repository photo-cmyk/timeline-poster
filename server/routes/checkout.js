const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// POST /api/checkout
// Body: { partner1, partner2, steps: [...], product: 'A3' | 'A4' }
router.post('/', async (req, res) => {
  try {
    const { partner1, partner2, steps, product = 'A3' } = req.body;

    // Validation basique
    if (!partner1 || !partner2) throw new Error('Les deux prénoms sont requis');
    if (!steps || steps.length < 3 || steps.length > 5)
      throw new Error('Entre 3 et 5 étapes sont requises');

    // On encode les données client dans les métadonnées Stripe
    // Les URLs d'images sont déjà hébergées sur Supabase à ce stade
    const metadata = {
      partner1,
      partner2,
      product,
      steps_count: String(steps.length),
    };

    // Stripe limite les métadonnées à 500 chars par clé
    // On sérialise les étapes en JSON et on les découpe si nécessaire
    const stepsJson = JSON.stringify(steps);
    if (stepsJson.length > 499) {
      // Découper en chunks de 490 chars
      const chunks = stepsJson.match(/.{1,490}/g);
      chunks.forEach((chunk, i) => {
        metadata[`steps_${i}`] = chunk;
      });
      metadata.steps_chunks = String(chunks.length);
    } else {
      metadata.steps_0 = stepsJson;
      metadata.steps_chunks = '1';
    }

    const prices = { A4: 2990, A3: 3990 }; // centimes EUR
    const priceAmount = prices[product] || 3990;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Affiche Timeline — ${partner1} & ${partner2}`,
              description: `Format ${product} · ${steps.length} étapes · Livraison incluse`,
              images: [steps[0]?.imageUrl].filter(Boolean),
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Stripe Checkout collecte l'adresse de livraison automatiquement
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'MC', 'CA'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Livraison standard (5-7 jours)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      metadata,
      success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/?canceled=true`,
      locale: 'fr',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[CHECKOUT ERROR]', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
