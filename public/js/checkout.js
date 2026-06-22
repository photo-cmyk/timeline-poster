/**
 * checkout.js — Validation + redirection vers Stripe Checkout
 */

document.getElementById('orderBtn').addEventListener('click', async () => {
  const state = window.getFormState();
  const errors = validateForm(state);

  if (errors.length > 0) {
    showErrors(errors);
    return;
  }

  showLoading('Préparation de votre commande…');

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Erreur serveur');

    // Redirection vers Stripe Checkout
    showLoading('Redirection vers le paiement sécurisé…');
    window.location.href = data.url;

  } catch (err) {
    hideLoading();
    alert('Une erreur est survenue : ' + err.message);
  }
});

// ─── Validation ──────────────────────────────────────────────────
function validateForm(state) {
  const errors = [];

  if (!state.partner1.trim()) errors.push('Le prénom 1 est requis');
  if (!state.partner2.trim()) errors.push('Le prénom 2 est requis');

  if (state.steps.length < 3) errors.push('Ajoutez au moins 3 moments');

  state.steps.forEach((step, i) => {
    if (!step.date.trim())  errors.push(`Moment ${i+1} : date manquante`);
    if (!step.title.trim()) errors.push(`Moment ${i+1} : titre manquant`);
  });

  const missingImages = state.steps.filter(s => !s.imageUrl).length;
  if (missingImages > 0) {
    errors.push(`${missingImages} moment(s) sans photo — ajoutez une image à chaque étape`);
  }

  return errors;
}

function showErrors(errors) {
  const msg = errors.map(e => `• ${e}`).join('\n');
  alert('Veuillez corriger les erreurs suivantes :\n\n' + msg);
}

// ─── Loading ─────────────────────────────────────────────────────
function showLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg || 'Chargement…';
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// ─── Success (si retour de Stripe avec ?session_id=...) ──────────
const params = new URLSearchParams(window.location.search);
if (params.get('session_id')) {
  document.getElementById('successOverlay').style.display = 'flex';
}
if (params.get('canceled')) {
  // L'utilisateur a annulé Stripe, on ne fait rien (formulaire toujours là)
  console.log('Paiement annulé par l\'utilisateur');
}
