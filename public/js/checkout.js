/**
 * checkout.js v2
 */

document.getElementById('orderBtn').addEventListener('click', async () => {
  const state = window.getFormState();
  const errors = validate(state);
  if (errors.length) { alert('Erreurs :\n\n' + errors.map(e=>`• ${e}`).join('\n')); return; }

  showLoading('Préparation de votre commande…');
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    showLoading('Redirection vers le paiement…');
    window.location.href = data.url;
  } catch (err) {
    hideLoading();
    alert('Erreur : ' + err.message);
  }
});

function validate(state) {
  const e = [];
  if (!state.partner1.trim()) e.push('Prénom 1 requis');
  if (!state.partner2.trim()) e.push('Prénom 2 requis');
  if (state.steps.length < 3) e.push('Minimum 3 moments');
  state.steps.forEach((s,i) => {
    if (!s.date.trim())  e.push(`Moment ${i+1} : date manquante`);
    if (!s.title.trim()) e.push(`Moment ${i+1} : titre manquant`);
    if (!s.imageUrl)     e.push(`Moment ${i+1} : photo manquante`);
  });
  return e;
}

function showLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg;
  document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

const params = new URLSearchParams(window.location.search);
if (params.get('session_id')) {
  document.getElementById('successOverlay').style.display = 'flex';
}
