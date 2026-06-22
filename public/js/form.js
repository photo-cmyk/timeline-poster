/**
 * form.js v2 — Formulaire avec designs + cadres + preview
 */

const PICTOS = [
  { key: 'heart', e: '♥', l: 'Amour' },
  { key: 'wine',  e: '♦', l: 'Dîner' },
  { key: 'plane', e: '▲', l: 'Voyage' },
  { key: 'house', e: '■', l: 'Maison' },
  { key: 'ring',  e: '★', l: 'Bague' },
  { key: 'star',  e: '✦', l: 'Spécial' },
  { key: 'music', e: '♪', l: 'Musique' },
];

const FRAME_PRICES = { none: 0, black: 8, white: 8, wood: 10 };
const BASE_PRICES  = { A3: 39.90, A4: 29.90 };

const DESIGN_NAMES = {
  classique: 'Classique', or: 'Doré', sombre: 'Sombre', botanik: 'Botanik', vintage: 'Vintage'
};

const state = {
  partner1: '', partner2: '',
  product: 'A3', frame: 'none', design: 'classique',
  steps: [],
};

let renderTimeout;
function scheduleRender() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    window.renderPoster({ ...state });
    window.renderPoster({ ...state }, 'heroCanvas');
  }, 80);
}

function updatePrice() {
  const base = BASE_PRICES[state.product] || 39.90;
  const frame = FRAME_PRICES[state.frame] || 0;
  const total = (base + frame).toFixed(2).replace('.', ',');
  document.getElementById('priceDisplay').textContent = `${total} €`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Pré-remplir 3 étapes
  addStep({ date: '14 FÉV. 2020', title: 'Notre rencontre', description: 'Une soirée entre amis…', picto: 'heart' });
  addStep({ date: '12 JUIL. 2021', title: 'Premier voyage', description: 'Barcelone, juste nous deux.', picto: 'plane' });
  addStep({ date: '25 DÉC. 2022', title: 'Notre chez-nous', description: 'On a posé nos valises.', picto: 'house' });

  // Prénoms
  ['partner1', 'partner2'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
      state[id] = e.target.value; scheduleRender();
    });
  });

  // Format
  document.querySelectorAll('input[name="product"]').forEach(r => {
    r.addEventListener('change', e => { state.product = e.target.value; updatePrice(); });
  });

  // Cadre
  document.querySelectorAll('input[name="frame"]').forEach(r => {
    r.addEventListener('change', e => { state.frame = e.target.value; updatePrice(); });
  });

  // Design selector (formulaire)
  document.querySelectorAll('.ds-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.design = btn.dataset.design;
      window.setDesign(state.design);
      document.getElementById('designBadge').textContent = DESIGN_NAMES[state.design];
      // Sync section designs
      document.querySelectorAll('.design-card').forEach(c => {
        c.classList.toggle('active', c.dataset.design === state.design);
      });
      scheduleRender();
    });
  });

  // Design cards (section designs)
  document.querySelectorAll('.design-card').forEach(card => {
    card.addEventListener('click', () => {
      const d = card.dataset.design;
      document.querySelector(`.ds-btn[data-design="${d}"]`)?.click();
      document.getElementById('configurator')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Ajouter étape
  document.getElementById('addStepBtn').addEventListener('click', () => {
    if (state.steps.length >= 5) return;
    addStep();
  });

  updatePrice();
  scheduleRender();
});

function addStep(defaults = {}) {
  if (state.steps.length >= 5) return;
  const idx = state.steps.length;
  const step = {
    date: defaults.date || '',
    title: defaults.title || '',
    description: defaults.description || '',
    picto: defaults.picto || 'heart',
    imageUrl: null,
  };
  state.steps.push(step);
  renderCard(idx, step);
  updateAddBtn();
  scheduleRender();
}

function renderCard(idx, step) {
  const container = document.getElementById('stepsContainer');
  const card = document.createElement('div');
  card.className = 'step-card';
  card.dataset.idx = idx;

  const canRemove = state.steps.length > 3;

  card.innerHTML = `
    <div class="step-head">
      <span class="step-num">Moment ${idx+1}</span>
      ${canRemove ? `<button class="btn-remove" data-idx="${idx}">✕</button>` : ''}
    </div>
    <div class="step-grid">
      <div>
        <label class="step-label">Date</label>
        <input class="step-input" data-field="date" data-idx="${idx}" placeholder="14 FÉV. 2020" value="${step.date}" maxlength="20" />
      </div>
      <div>
        <label class="step-label">Picto</label>
        <div class="picto-row">
          ${PICTOS.map(p => `<button class="picto-btn ${p.key===step.picto?'active':''}" data-picto="${p.key}" data-idx="${idx}" title="${p.l}">${p.e}</button>`).join('')}
        </div>
      </div>
      <div>
        <label class="step-label">Titre</label>
        <input class="step-input" data-field="title" data-idx="${idx}" placeholder="Notre rencontre" value="${step.title}" maxlength="40" />
      </div>
      <div>
        <label class="step-label">Description</label>
        <input class="step-input" data-field="description" data-idx="${idx}" placeholder="Une soirée entre amis…" value="${step.description}" maxlength="60" />
      </div>
      <div class="step-full">
        <label class="step-label">Photo</label>
        <div class="upload-area" data-idx="${idx}">
          <input type="file" accept="image/*" data-idx="${idx}" class="file-input" />
          <div class="upload-ph">
            <div style="font-size:20px">📷</div>
            <div class="upload-txt">Cliquer pour ajouter une photo</div>
          </div>
          <img class="upload-thumb" data-idx="${idx}" src="" alt="" />
        </div>
      </div>
    </div>
  `;

  container.appendChild(card);

  // Inputs texte
  card.querySelectorAll('.step-input').forEach(input => {
    input.addEventListener('input', e => {
      state.steps[parseInt(e.target.dataset.idx)][e.target.dataset.field] = e.target.value;
      scheduleRender();
    });
  });

  // Pictos
  card.querySelectorAll('.picto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      state.steps[i].picto = btn.dataset.picto;
      card.querySelectorAll('.picto-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scheduleRender();
    });
  });

  // Upload
  card.querySelector('.file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    const i = parseInt(e.target.dataset.idx);
    if (!file) return;

    const area = card.querySelector('.upload-area');
    const thumb = card.querySelector('.upload-thumb');
    area.style.opacity = '0.5';
    card.querySelector('.upload-txt').textContent = 'Upload…';

    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      state.steps[i].imageUrl = data.url;
      thumb.src = data.url;
      thumb.style.display = 'block';
      card.querySelector('.upload-ph').style.display = 'none';
      scheduleRender();
    } catch (err) {
      alert('Erreur upload : ' + err.message);
      card.querySelector('.upload-txt').textContent = 'Cliquer pour ajouter une photo';
    } finally {
      area.style.opacity = '1';
    }
  });

  // Supprimer
  const removeBtn = card.querySelector('.btn-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => removeStep(parseInt(removeBtn.dataset.idx)));
  }
}

function removeStep(idx) {
  if (state.steps.length <= 3) return;
  state.steps.splice(idx, 1);
  document.getElementById('stepsContainer').innerHTML = '';
  state.steps.forEach((s, i) => renderCard(i, s));
  updateAddBtn();
  scheduleRender();
}

function updateAddBtn() {
  const btn = document.getElementById('addStepBtn');
  btn.disabled = state.steps.length >= 5;
  btn.textContent = state.steps.length >= 5 ? '✓ Maximum 5 moments atteint' : '+ Ajouter un moment';
}

window.getFormState = () => ({ ...state, steps: state.steps.map(s => ({...s})) });
