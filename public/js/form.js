/**
 * form.js v3 — Gestion formulaire sans conflits de noms
 */

const FORM_PICTOS = [
  { key:'heart', e:'♥', l:'Amour' }, { key:'wine', e:'♦', l:'Dîner' },
  { key:'plane', e:'▲', l:'Voyage'}, { key:'house', e:'■', l:'Maison'},
  { key:'ring',  e:'★', l:'Bague' }, { key:'star',  e:'✦', l:'Spécial'},
  { key:'music', e:'♪', l:'Musique'},
];

const FRAME_SURCHARGES = { none:0, black:8, white:8, wood:10, canvas:20 };
const FORMAT_PRICES    = { A3:39.90, A4:29.90 };
const DESIGN_LABELS    = { classique:'Classique', or:'Doré', sombre:'Sombre', botanik:'Botanik', vintage:'Vintage' };

const formState = {
  partner1: '', partner2: '',
  product: 'A3', frame: 'none', design: 'classique',
  steps: [],
};

window.getFormState = () => ({
  ...formState,
  steps: formState.steps.map(s => ({...s})),
});

let renderTimer = null;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => window.AppRender && window.AppRender(), 120);
}

function updatePrice() {
  const base  = FORMAT_PRICES[formState.product] || 39.90;
  const extra = FRAME_SURCHARGES[formState.frame] || 0;
  const el = document.getElementById('priceDisplay');
  if (el) el.textContent = (base + extra).toFixed(2).replace('.', ',') + ' €';
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 3 étapes exemple
  addFormStep({ date:'14 FÉV. 2020', title:'Notre rencontre',   description:'Une soirée entre amis…', picto:'heart' });
  addFormStep({ date:'12 JUIL. 2021', title:'Premier voyage',    description:'Barcelone, juste nous deux.', picto:'plane' });
  addFormStep({ date:'25 DÉC. 2022', title:'Notre chez-nous',   description:'On a posé nos valises.', picto:'house' });

  // Prénoms
  ['partner1','partner2'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      formState[id] = e.target.value; scheduleRender();
    });
  });

  // Format
  document.querySelectorAll('input[name="product"]').forEach(r =>
    r.addEventListener('change', e => { formState.product = e.target.value; updatePrice(); scheduleRender(); })
  );

  // Cadre
  document.querySelectorAll('input[name="frame"]').forEach(r =>
    r.addEventListener('change', e => { formState.frame = e.target.value; updatePrice(); scheduleRender(); })
  );

  // Design buttons
  document.querySelectorAll('.db').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.db').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      formState.design = btn.dataset.design;
      // Sync section designs
      document.querySelectorAll('.design-card').forEach(c =>
        c.classList.toggle('active', c.dataset.design === formState.design)
      );
      const pdn = document.getElementById('previewDesignName');
      if (pdn) pdn.textContent = DESIGN_LABELS[formState.design] || formState.design;
      scheduleRender();
    });
  });

  // Design cards (section)
  document.querySelectorAll('.design-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelector(`.db[data-design="${card.dataset.design}"]`)?.click();
      document.getElementById('configurator')?.scrollIntoView({ behavior:'smooth' });
    });
    card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') card.click(); });
  });

  // Ajouter étape
  document.getElementById('addStepBtn')?.addEventListener('click', () => {
    if (formState.steps.length < 5) addFormStep();
  });

  updatePrice();
  scheduleRender();
});

function addFormStep(defaults = {}) {
  if (formState.steps.length >= 5) return;
  const idx = formState.steps.length;
  const step = {
    date: defaults.date || '', title: defaults.title || '',
    description: defaults.description || '', picto: defaults.picto || 'heart',
    imageUrl: null,
  };
  formState.steps.push(step);
  buildStepCard(idx, step);
  syncAddBtn();
  scheduleRender();
}

function buildStepCard(idx, step) {
  const wrap = document.getElementById('stepsContainer');
  if (!wrap) return;
  const card = document.createElement('div');
  card.className = 'step-card'; card.dataset.idx = idx;
  const canDel = formState.steps.length > 3;

  card.innerHTML = `
    <div class="step-head">
      <span class="step-tag">Moment ${idx+1}</span>
      ${canDel ? `<button class="step-del" data-idx="${idx}" aria-label="Supprimer">✕</button>` : ''}
    </div>
    <div class="step-fields">
      <div>
        <label class="step-lbl">Date</label>
        <input class="step-inp" data-field="date" data-idx="${idx}" placeholder="14 FÉV. 2020" value="${escHtml(step.date)}" maxlength="20"/>
      </div>
      <div>
        <label class="step-lbl">Picto</label>
        <div class="picto-row">
          ${FORM_PICTOS.map(p=>`<button class="picto-btn${p.key===step.picto?' active':''}" data-picto="${p.key}" data-idx="${idx}" title="${p.l}">${p.e}</button>`).join('')}
        </div>
      </div>
      <div>
        <label class="step-lbl">Titre</label>
        <input class="step-inp" data-field="title" data-idx="${idx}" placeholder="Notre rencontre" value="${escHtml(step.title)}" maxlength="40"/>
      </div>
      <div>
        <label class="step-lbl">Description</label>
        <input class="step-inp" data-field="description" data-idx="${idx}" placeholder="Une soirée entre amis…" value="${escHtml(step.description)}" maxlength="60"/>
      </div>
      <div class="step-full">
        <label class="step-lbl">Photo</label>
        <div class="upload-zone">
          <input type="file" accept="image/*" data-idx="${idx}" class="file-inp"/>
          <div class="upload-placeholder">
            <span style="font-size:22px">📷</span>
            <span class="upload-hint">Cliquer pour ajouter une photo</span>
          </div>
          <img class="upload-preview" data-idx="${idx}" src="" alt=""/>
        </div>
      </div>
    </div>`;

  wrap.appendChild(card);

  card.querySelectorAll('.step-inp').forEach(inp =>
    inp.addEventListener('input', e => {
      formState.steps[+e.target.dataset.idx][e.target.dataset.field] = e.target.value;
      scheduleRender();
    })
  );

  card.querySelectorAll('.picto-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      formState.steps[+btn.dataset.idx].picto = btn.dataset.picto;
      card.querySelectorAll('.picto-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scheduleRender();
    })
  );

  card.querySelector('.file-inp').addEventListener('change', async e => {
    const file = e.target.files[0]; const i = +e.target.dataset.idx;
    if (!file) return;
    const zone = card.querySelector('.upload-zone');
    const hint = card.querySelector('.upload-hint');
    const prev = card.querySelector('.upload-preview');
    zone.style.opacity = '0.5'; hint.textContent = 'Upload en cours…';
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await fetch('/api/upload/image', { method:'POST', body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      formState.steps[i].imageUrl = data.url;
      prev.src = data.url; prev.style.display = 'block';
      card.querySelector('.upload-placeholder').style.display = 'none';
      scheduleRender();
    } catch(err) {
      alert('Erreur upload : ' + err.message);
      hint.textContent = 'Cliquer pour ajouter une photo';
    } finally { zone.style.opacity = '1'; }
  });

  card.querySelector('.step-del')?.addEventListener('click', () => {
    if (formState.steps.length <= 3) return;
    formState.steps.splice(+card.dataset.idx, 1);
    document.getElementById('stepsContainer').innerHTML = '';
    formState.steps.forEach((s,i) => buildStepCard(i, s));
    syncAddBtn(); scheduleRender();
  });
}

function syncAddBtn() {
  const btn = document.getElementById('addStepBtn');
  if (!btn) return;
  btn.disabled = formState.steps.length >= 5;
  btn.textContent = formState.steps.length >= 5 ? '✓ Maximum 5 moments' : '+ Ajouter un moment';
}

function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
