const axios = require('axios');

const GELATO_BASE_URL = 'https://order.gelatoapis.com';

// ─── IDs produits Gelato ──────────────────────────────────────────────────
// Référence officielle : https://dashboard.gelato.com/product-catalog
const GELATO_PRODUCTS = {
  A3: 'poster_30x40-cm_pho-paper-200-g_4-0',   // A3 papier photo 200g
  A4: 'poster_21x30-cm_pho-paper-200-g_4-0',   // A4 papier photo 200g
};

/**
 * Crée une commande d'impression chez Gelato
 */
async function createGelatoOrder({ orderData, pdfUrl, shipping, stripeSessionId }) {
  const { partner1, partner2, product = 'A3' } = orderData;
  const address = shipping.address;

  const productUid = GELATO_PRODUCTS[product] || GELATO_PRODUCTS.A3;

  const payload = {
    orderType: 'order',
    orderReferenceId: stripeSessionId, // ton référence interne = ID session Stripe
    customerReferenceId: `${partner1}_${partner2}`.toLowerCase().replace(/\s/g, '_'),

    currency: 'EUR',

    items: [
      {
        itemReferenceId: `item_${stripeSessionId}`,
        productUid,
        files: [
          {
            type: 'default',
            url: pdfUrl, // URL publique du PDF sur Supabase
          },
        ],
        quantity: 1,
      },
    ],

    shippingAddress: {
      firstName: shipping.name?.split(' ')[0] || partner1,
      lastName: shipping.name?.split(' ').slice(1).join(' ') || partner2,
      addressLine1: address.line1,
      addressLine2: address.line2 || '',
      city: address.city,
      postCode: address.postal_code,
      country: address.country,
      email: '', // récupérer depuis session Stripe si nécessaire
      phone: '',
    },

    // Gelato choisit automatiquement le meilleur imprimeur local
    shipmentMethodUid: 'standard',
  };

  try {
    const response = await axios.post(`${GELATO_BASE_URL}/v4/orders`, payload, {
      headers: {
        'X-API-KEY': process.env.GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log(`[GELATO] Commande créée: ${response.data.id}, statut: ${response.data.orderStatus}`);
    return response.data;

  } catch (err) {
    const details = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw new Error(`Gelato API error: ${details}`);
  }
}

module.exports = { createGelatoOrder };
