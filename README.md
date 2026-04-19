# 💎 Budget Liquid Glass

Application de budget personnelle avec design Liquid Glass, navigation par mois/année, et installation PWA sur iPhone.

---

## 🚀 Déploiement sur Vercel (5 minutes)

### Méthode 1 — Glisser-déposer (la plus simple)

1. Va sur **[vercel.com](https://vercel.com)** et crée un compte gratuit
2. Sur le dashboard, clique **"Add New Project"**
3. Clique **"Browse"** ou glisse ce dossier `budget-app` dans la zone de dépôt
4. Vercel détecte automatiquement React → clique **"Deploy"**
5. En 2 minutes tu as une URL du type `budget-xxx.vercel.app`

### Méthode 2 — Via GitHub (recommandée pour les mises à jour)

1. Crée un repo sur [github.com](https://github.com) et pousse ce dossier
2. Connecte ton repo à Vercel
3. Chaque push = déploiement automatique

---

## 📱 Installer sur iPhone (PWA)

Une fois l'app déployée sur Vercel :

1. Ouvre l'URL dans **Safari** (pas Chrome)
2. Appuie sur l'icône **Partager** ↑ (bas de l'écran)
3. Défile et appuie sur **"Sur l'écran d'accueil"**
4. Nomme-la **"Budget"** → **Ajouter**

L'app apparaît comme une vraie app native, sans barre Safari, en plein écran.

---

## ✨ Fonctionnalités

- **Salaire net** configurable et persistant
- **Charges fixes** ajoutables/supprimables (loyer, abonnements, crédits…)
- **Dépenses** par catégorie avec note et date
- **Navigation** mois par mois et vue annuelle
- **Graphiques** évolution 6 mois, épargne mensuelle
- **Bilan épargne** : réel vs budgété, cumul, projection
- **Données persistantes** via localStorage (restent entre les sessions)
- **Design Liquid Glass** avec backdrop-filter, reflets, blobs animés
- **Typographie DM Sans** (Helvetica-like)

---

## 🛠 Développement local

```bash
npm install
npm start
```

Ouvre http://localhost:3000
