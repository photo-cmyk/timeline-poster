const axios = require('axios');

const GELATO_BASE_URL = 'https://order.gelatoapis.com';

const PRODUCT_UIDS = {
  // Sans cadre — Poster premium papier mat 200g
  A4_none:  'flat_a4-8x12-inch_200-gsm-80lb-uncoated_4-0_ver',
  A3_none:  'flat_a3_200-gsm-80lb-uncoated_4-0_ver',

  // Cadre métal noir
  A4_black: 'framed_poster_mounted_210x297mm-8x12-inch_black_aluminum_w10xt22-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-uncoated_4-0_ver',
  A3_black: 'framed_poster_mounted_279x432-mm-11x17-inch_black_aluminum_w10xt22-mm_plexiglass_280x430-mm-xl_200-gsm-80lb-uncoated_4-0_ver',

  // Cadre bois blanc
  A4_white: 'framed_poster_mounted_premium_210x297mm-8x12-inch_white_wood_w20xt20-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-uncoated_4-0_ver',
  A3_white: 'framed_poster_mounted_premium_a3_white_wood_w20xt20-mm_plexiglass_a3_200-gsm-80lb-uncoated_4-0_ver',

  // Cadre bois naturel
  A4_wood:  'framed_poster_mounted_premium_210x297mm-8x12-inch_natural-wood_wood_w20xt20-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-uncoated_4-0_ver',
  A3_wood:  'framed_poster_mounted_premium_a3_natural-wood_wood_w20xt20-mm_plexiglass_a3_200-gsm-80lb-uncoated_4-0_ver',

  // Toile canvas
  A4_canvas: 'canvas_200x300-mm-8x12-inch_canvas_wood-fsc-thick_4-0_ver',
  A3_canvas: 'canvas_300x400-mm-12x16-inch_canvas_wood-fsc-thick_4-0_ver',
};

function getProductUid(format, frame) {
  const key = `${format}_${frame}`;
  return PRODUCT_UIDS[key] || PRODUCT_UIDS[`${format}_none`];
}

async function createGelatoOrder({ orderData, pdfUrl, shipping, stripeSessionId }) {
  const { partner1, partner2, product = 'A3', frame = 'none' } = orderData;
  const address = shipping.address;

  const productUid = getProductUid(product, frame);
  console.log(`[GELATO] Produit: ${productUid}`);

  const payload = {
    orderType:          'order',
    orderReferenceId:   stripeSessionId,
    customerReferenceId:`${partner1}_${partner2}`.toLowerCase().replace(/\s/g,'_').substring(0,50),
    currency:           'EUR',
    items: [{
      itemReferenceId: `item_${stripeSessionId}`,
      productUid,
      files: [{ type: 'default', url: pdfUrl }],
      quantity: 1,
    }],
    shippingAddress: {
      firstName:    shipping.name?.split(' ')[0] || partner1,
      lastName:     shipping.name?.split(' ').slice(1).join(' ') || partner2,
      addressLine1: address.line1,
      addressLine2: address.line2 || '',
      city:         address.city,
      postCode:     address.postal_code,
      country:      address.country,
      email:        '',
      phone:        '',
    },
    shipmentMethodUid: 'standard',
  };

  try {
    const response = await axios.post(`${GELATO_BASE_URL}/v4/orders`, payload, {
      headers: {
        'X-API-KEY':    process.env.GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    console.log(`[GELATO] Commande créée: ${response.data.id}`);
    return response.data;
  } catch (err) {
    const details = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Gelato API error: ${details}`);
  }
}

module.exports = { createGelatoOrder };
