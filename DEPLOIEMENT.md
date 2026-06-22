# 🚀 Guide de déploiement — Timeline Poster sur Hostinger

## Structure des fichiers

```
timeline-poster/
├── server/
│   ├── index.js              ← Serveur Express (point d'entrée)
│   ├── routes/
│   │   ├── upload.js         ← POST /api/upload/image
│   │   ├── checkout.js       ← POST /api/checkout (crée session Stripe)
│   │   └── webhook.js        ← POST /webhook (Stripe → PDF → Gelato)
│   └── services/
│       ├── pdfGenerator.js   ← Génère le PDF haute définition
│       ├── storage.js        ← Upload/download Supabase
│       └── gelato.js         ← Appel API Gelato
├── public/
│   ├── index.html            ← Page de commande
│   ├── css/style.css
│   └── js/
│       ├── canvas.js         ← Preview temps réel
│       ├── form.js           ← Formulaire dynamique
│       └── checkout.js       ← Validation + redirection Stripe
├── .env                      ← Variables secrètes (NE PAS commiter)
└── package.json
```

---

## Étape 1 — Supabase (stockage fichiers)

1. Créer un compte gratuit sur https://supabase.com
2. Créer un nouveau projet
3. Dans **Storage** → créer un bucket `timeline-posters`
4. Rendre le bucket **public** (onglet Policies → Allow public read)
5. Copier dans `.env` :
   - `SUPABASE_URL` → Settings > API > Project URL
   - `SUPABASE_SERVICE_KEY` → Settings > API > service_role key (⚠️ pas la anon key)

---

## Étape 2 — Stripe

1. Créer un compte sur https://stripe.com
2. Dans **Développeurs** → Clés API → copier `STRIPE_SECRET_KEY`
3. Activer **Stripe Checkout** avec collecte d'adresse de livraison
4. Dans **Webhooks** → Ajouter un endpoint :
   - URL : `https://tondomaine.com/webhook`
   - Événement : `checkout.session.completed`
   - Copier `STRIPE_WEBHOOK_SECRET`

---

## Étape 3 — Gelato

1. Créer un compte imprimeur sur https://dashboard.gelato.com
2. **API** → Générer une clé API → copier dans `GELATO_API_KEY`
3. Récupérer ton Store ID → copier dans `GELATO_STORE_ID`
4. ⚠️ Vérifier les UIDs produits dans le catalogue Gelato :
   - Aller sur https://dashboard.gelato.com/product-catalog
   - Chercher "Poster A3" et copier l'UID exact
   - Mettre à jour `GELATO_PRODUCTS` dans `server/services/gelato.js`

---

## Étape 4 — Déploiement Hostinger (VPS)

```bash
# 1. Se connecter en SSH
ssh root@ton-ip-hostinger

# 2. Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Installer PM2 (gestionnaire de processus)
npm install -g pm2

# 4. Uploader ton projet (depuis ta machine locale)
# Option A : via Git
git clone https://github.com/toi/timeline-poster.git /var/www/timeline-poster

# Option B : via SFTP (FileZilla)
# → Uploader le dossier dans /var/www/timeline-poster

# 5. Installer les dépendances
cd /var/www/timeline-poster
npm install

# 6. Créer le fichier .env
cp .env.example .env
nano .env  # Remplir toutes les valeurs

# 7. Démarrer avec PM2
pm2 start server/index.js --name timeline-poster
pm2 save
pm2 startup  # Redémarrage auto au reboot

# 8. Configurer Nginx (reverse proxy)
sudo nano /etc/nginx/sites-available/timeline-poster
```

**Config Nginx :**
```nginx
server {
    listen 80;
    server_name tondomaine.com www.tondomaine.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/timeline-poster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 9. Certificat SSL (HTTPS gratuit)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tondomaine.com -d www.tondomaine.com
```

---

## Étape 5 — Test du flux complet

```bash
# Test local avant déploiement
npm run dev

# Test webhook Stripe en local
stripe listen --forward-to localhost:3000/webhook
```

Checklist avant la première vente :
- [ ] Supabase bucket public ✓
- [ ] Stripe webhook configuré sur ton domaine ✓
- [ ] Gelato : UIDs produits vérifiés ✓
- [ ] Test commande en mode Stripe "test" (carte 4242 4242 4242 4242) ✓
- [ ] PDF généré visible dans Supabase Storage ✓
- [ ] Commande créée dans Gelato dashboard ✓
- [ ] Passer Stripe en mode "live" ✓

---

## Flux automatique (aucune action humaine)

```
Client remplit le formulaire
        ↓
Photos uploadées sur Supabase
        ↓
Client paie sur Stripe Checkout (adresse collectée automatiquement)
        ↓
Stripe envoie webhook → /webhook
        ↓
Données décodées des métadonnées Stripe
        ↓
PDF haute définition généré (pdfkit)
        ↓
PDF uploadé sur Supabase (URL publique)
        ↓
Commande créée chez Gelato via API
        ↓
Gelato imprime + livre chez le client
```

**Zéro action manuelle. 100% automatique.**
