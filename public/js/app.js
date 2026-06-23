/**
 * app.js — Orchestration principale : scènes, zoom, checkout, nav
 */

let currentScene = 'salon';
let previewScene = 'poster';
let renderPending = false;

// ── Render centrale ──────────────────────────────────────────
async function appRender() {
  if (renderPending) return;
  renderPending = true;
  try {
    const data = window.getFormState();

    // 1. Preview principale (configurateur)
    const previewCanvas = document.getElementById('posterCanvas');
    if (previewCanvas) {
      previewCanvas.width = 320; previewCanvas.height = 440;
      await window.Scenes.renderScene(previewCanvas, previewScene, data.frame, data);
    }

    // 2. Mockup hero principal
    const mockupCanvas = document.getElementById('mockupCanvas');
    if (mockupCanvas) {
      await window.Scenes.renderScene(mockupCanvas, currentScene, data.frame, data);
      const label = document.getElementById('mockupLabel');
      const sceneNames = { salon:'Salon', chambre:'Chambre', couloir:'Couloir', poster:'Affiche seule' };
      const designNames = { classique:'Classique', or:'Doré', sombre:'Sombre', botanik:'Botanik', vintage:'Vintage' };
      if (label) label.textContent = `${sceneNames[currentScene]} — Design ${designNames[data.design]}`;
    }

    // 3. Vignettes hero
    document.querySelectorAll('.thumb-canvas').forEach(async tc => {
      tc.width = 80; tc.height = 60;
      await window.Scenes.renderScene(tc, tc.dataset.scene, data.frame, data);
    });

  } finally {
    renderPending = false;
  }
}

window.AppRender = appRender;

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // NAV scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Burger mobile
  document.getElementById('navBurger')?.addEventListener('click', () => {
    nav?.classList.toggle('nav-open');
  });

  // ── Scènes hero ──
  document.querySelectorAll('.thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScene = btn.dataset.scene;
      appRender();
    });
  });

  // ── Scènes preview configurateur ──
  document.querySelectorAll('.scene-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      previewScene = btn.dataset.scene;
      appRender();
    });
  });

  // ── Zoom hero ──
  const zoomModal  = document.getElementById('zoomModal');
  const zoomCanvas = document.getElementById('zoomCanvas');
  const zoomClose  = document.getElementById('zoomClose');
  const zoomOverlay= document.getElementById('zoomOverlay');

  async function openZoom() {
    if (!zoomModal || !zoomCanvas) return;
    zoomModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    zoomCanvas.width = 480; zoomCanvas.height = 678;
    const data = window.getFormState();
    // Affiche seule zoomée
    const ctx = zoomCanvas.getContext('2d');
    ctx.fillStyle = '#F5F0EB'; ctx.fillRect(0,0,480,678);
    const fr = FRAME_CFG_ZOOM[data.frame];
    const ft = fr ? fr.t : 0;
    if (fr) drawFrameZoom(ctx, 20, 20, 440, 638, data.frame);
    await window.Poster.drawPoster(ctx, 20+ft, 20+ft, 440-ft*2, 638-ft*2, data);
  }

  function closeZoom() {
    zoomModal?.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('zoomBtn')?.addEventListener('click', openZoom);
  document.getElementById('previewZoomBtn')?.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);
  zoomOverlay?.addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  // ── Checkout ──
  document.getElementById('orderBtn')?.addEventListener('click', async () => {
    const state = window.getFormState();
    const errs = validateOrder(state);
    if (errs.length) { alert('Erreurs :\n\n' + errs.map(e=>'• '+e).join('\n')); return; }

    showLoading('Préparation de votre commande…');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      showLoading('Redirection vers le paiement sécurisé…');
      window.location.href = data.url;
    } catch(err) {
      hideLoading(); alert('Erreur : ' + err.message);
    }
  });

  // ── Success / Cancel ──
  const params = new URLSearchParams(window.location.search);
  if (params.get('session_id')) {
    document.getElementById('successOverlay').style.display = 'flex';
  }

  // Premier rendu
  setTimeout(appRender, 100);
});

// ── Validation ───────────────────────────────────────────────
function validateOrder(state) {
  const e = [];
  if (!state.partner1.trim()) e.push('Prénom 1 requis');
  if (!state.partner2.trim()) e.push('Prénom 2 requis');
  if (state.steps.length < 3)  e.push('Minimum 3 moments requis');
  state.steps.forEach((s,i) => {
    if (!s.date.trim())  e.push(`Moment ${i+1} : date manquante`);
    if (!s.title.trim()) e.push(`Moment ${i+1} : titre manquant`);
    if (!s.imageUrl)     e.push(`Moment ${i+1} : photo manquante`);
  });
  return e;
}

// ── Loading ──────────────────────────────────────────────────
function showLoading(msg) {
  const el = document.getElementById('loadingMsg');
  if (el) el.textContent = msg;
  document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// ── Frame config pour zoom ───────────────────────────────────
const FRAME_CFG_ZOOM = {
  none:   null,
  black:  { t: 18 }, white: { t: 18 }, wood: { t: 20 }, canvas: { t: 14 },
};

function drawFrameZoom(ctx, x, y, w, h, key) {
  const t = FRAME_CFG_ZOOM[key]?.t || 0;
  const colors = { black:{o:'#111',i:'#000',hi:'#333'}, white:{o:'#F0F0F0',i:'#E0E0E0',hi:'#FFF'}, wood:{o:'#8B6343',i:'#6B4A2A',hi:'#A07848'}, canvas:{o:'#C8B898',i:'#B0A080',hi:'#D8C8A8'} };
  const c = colors[key]; if (!c) return;
  ctx.fillStyle = c.o; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c.hi;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.lineTo(x+w-t,y+t); ctx.lineTo(x+t,y+t); ctx.lineTo(x+t,y+h-t); ctx.lineTo(x,y+h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c.i;
  ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x+t,y+h-t); ctx.lineTo(x+w-t,y+h-t); ctx.lineTo(x+w-t,y+t); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#000'; ctx.fillRect(x+t, y+t, w-t*2, h-t*2);
}
