/**
 * form.js — Gestion du formulaire dynamique + preview temps réel
 */

const PICTOS = [
  { key: 'heart', emoji: '♥', label: 'Cœur' },
  { key: 'wine',  emoji: '🍷', label: 'Dîner' },
  { key: 'plane', emoji: '✈', label: 'Voyage' },
  { key: 'house', emoji: '🏠', label: 'Emménagement' },
  { key: 'ring',  emoji: '💍', label: 'Fiançailles' },
  { key: 'star',  emoji: '★',  label: 'Spécial' },
  { key: 'music', emoji: '♪',  label: 'Musique' },
];

// État de l'application
const state = {
  partner1: '',
  partner2: '',
  product: 'A3',
  steps: [],
};

// Debounce pour éviter de redessiner à chaque keystroke
let renderTimeout;
function scheduleRender() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    window.renderPoster(state);
  }, 80);
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pré-remplir avec 3 étapes exemple
  addStep({ date: '14 FÉV. 2020', title: 'Notre rencontre', description: 'Une soirée entre amis...', picto: 'heart' });
  addStep({ date: '12 JUIL. 2021', title: 'Premier voyage', description: 'Barcelone, juste nous deux.', picto: 'plane' });
  addStep({ date: '25 DÉC. 2022', title: 'Notre chez-nous', description: 'On a posé nos valises.', picto: 'house' });

  // Prénoms
  document.getElementById('partner1').addEventListener('input', e => {
    state.partner1 = e.target.value;
    scheduleRender();
  });
  document.getElementById('partner2').addEventListener('input', e => {
    state.partner2 = e.target.value;
    scheduleRender();
  });

  // Format
  document.querySelectorAll('input[name="product"]').forEach(radio => {
    radio.addEventListener('change', e => {
      state.product = e.target.value;
    });
  });

  // Bouton ajouter étape
  document.getElementById('addStepBtn').addEventListener('click', () => {
    if (state.steps.length >= 5) return;
    addStep();
  });

  scheduleRender();
});

// ─── Créer une étape ─────────────────────────────────────────────
function addStep(defaults = {}) {
  const index = state.steps.length;
  if (index >= 5) return;

  const stepData = {
    date: defaults.date || '',
    title: defaults.title || '',
    description: defaults.description || '',
    picto: defaults.picto || 'heart',
    imageUrl: defaults.imageUrl || null,
    _uploading: false,
  };
  state.steps.push(stepData);

  renderStepCard(index, stepData);
  updateAddButton();
  scheduleRender();
}

function renderStepCard(index, stepData) {
  const container = document.getElementById('stepsContainer');
  const card = document.createElement('div');
  card.className = 'step-card';
  card.dataset.stepIndex = index;

  card.innerHTML = `
    <div class="step-header">
      <span class="step-number">Moment ${index + 1}</span>
      ${state.steps.length > 3
        ? `<button class="btn-remove-step" data-index="${index}" title="Supprimer">✕</button>`
        : ''}
    </div>
    <div class="step-grid">
      <div>
        <label class="step-input-label">Date</label>
        <input type="text" class="step-input" data-field="date" data-index="${index}"
          placeholder="14 FÉV. 2020" value="${stepData.date}" maxlength="20" />
      </div>
      <div>
        <label class="step-input-label">Picto</label>
        <div class="picto-selector" data-index="${index}">
          ${PICTOS.map(p => `
            <button class="picto-btn ${p.key === stepData.picto ? 'active' : ''}"
              data-picto="${p.key}" data-index="${index}" title="${p.label}">${p.emoji}</button>
          `).join('')}
        </div>
      </div>
      <div>
        <label class="step-input-label">Titre</label>
        <input type="text" class="step-input" data-field="title" data-index="${index}"
          placeholder="Notre rencontre" value="${stepData.title}" maxlength="40" />
      </div>
      <div>
        <label class="step-input-label">Description courte</label>
        <input type="text" class="step-input" data-field="description" data-index="${index}"
          placeholder="Une soirée entre amis..." value="${stepData.description}" maxlength="60" />
      </div>
      <div class="step-full">
        <label class="step-input-label">Photo</label>
        <div class="image-upload-area" data-index="${index}">
          <input type="file" accept="image/*" data-index="${index}" class="file-input" />
          <div class="upload-placeholder">
            <div class="upload-icon">📷</div>
            <div class="upload-text">Cliquer pour ajouter une photo</div>
          </div>
          <img class="image-preview-thumb" data-index="${index}" src="" alt="" />
        </div>
      </div>
    </div>
  `;

  container.appendChild(card);

  // ── Listeners de la card ──

  // Inputs texte
  card.querySelectorAll('.step-input').forEach(input => {
    input.addEventListener('input', e => {
      const field = e.target.dataset.field;
      const idx = parseInt(e.target.dataset.index, 10);
      state.steps[idx][field] = e.target.value;
      scheduleRender();
    });
  });

  // Picto
  card.querySelectorAll('.picto-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(btn.dataset.index, 10);
      state.steps[idx].picto = btn.dataset.picto;
      // Mettre à jour le style actif
      card.querySelectorAll('.picto-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scheduleRender();
    });
  });

  // Upload image
  card.querySelector('.file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const idx = parseInt(e.target.dataset.index, 10);
    if (!file) return;

    const uploadArea = card.querySelector('.image-upload-area');
    const thumb = card.querySelector('.image-preview-thumb');

    uploadArea.style.opacity = '0.5';
    uploadArea.querySelector('.upload-text').textContent = 'Upload en cours…';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload échoué');

      state.steps[idx].imageUrl = data.url;

      // Aperçu local immédiat
      thumb.src = data.url;
      thumb.style.display = 'block';
      uploadArea.querySelector('.upload-placeholder').style.display = 'none';
      scheduleRender();

    } catch (err) {
      alert('Erreur upload : ' + err.message);
      uploadArea.querySelector('.upload-text').textContent = 'Cliquer pour ajouter une photo';
    } finally {
      uploadArea.style.opacity = '1';
    }
  });

  // Supprimer étape
  const removeBtn = card.querySelector('.btn-remove-step');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      const idx = parseInt(removeBtn.dataset.index, 10);
      removeStep(idx);
    });
  }
}

function removeStep(index) {
  if (state.steps.length <= 3) return;
  state.steps.splice(index, 1);
  // Re-render tout le container
  document.getElementById('stepsContainer').innerHTML = '';
  state.steps.forEach((step, i) => renderStepCard(i, step));
  updateAddButton();
  scheduleRender();
}

function updateAddButton() {
  const btn = document.getElementById('addStepBtn');
  btn.disabled = state.steps.length >= 5;
  btn.textContent = state.steps.length >= 5
    ? '✓ Maximum atteint (5 moments)'
    : '+ Ajouter un moment';
}

// Exposer state pour checkout.js
window.getFormState = () => ({ ...state, steps: [...state.steps] });
