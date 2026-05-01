# 🚀 Comment déployer l'appli — pas à pas

## Étape 1 — Créer le repo GitHub (à faire une seule fois)

1. Va sur **https://github.com**
2. Crée un compte gratuit si tu n'en as pas (avec ton email)
3. Une fois connecté, clique sur le bouton **+** en haut à droite → **New repository**
4. Remplis :
   - **Repository name** : budget-app
   - Laisse tout le reste par défaut
   - Public ou Private au choix
5. Clique **Create repository** en bas

## Étape 2 — Uploader les fichiers sur GitHub

1. Sur la page qui vient de s'ouvrir, clique sur le lien bleu **uploading an existing file** (au milieu de la page)
2. **Sur ton ordinateur** : dézippe `budget-app-v16.zip` (double-clic dessus)
3. Tu obtiens un dossier `budget-app`. **OUVRE-LE.**
4. **Sélectionne tout son contenu** (Cmd+A sur Mac) : package.json, README.md, netlify.toml, dossier public, dossier src, etc.
5. **Glisse-dépose ces fichiers** (pas le dossier `budget-app`, mais son contenu) dans la zone de upload GitHub
6. En bas, clique le bouton vert **Commit changes**

## Étape 3 — Connecter Netlify à GitHub

1. Va sur **https://app.netlify.com**
2. Clique sur ton site `adorable-marshmallow-13fbf7`
3. Va dans **Site configuration** (icône engrenage à gauche)
4. Section **Build & deploy** → **Continuous deployment** → bouton **Link repository**
5. Choisis **GitHub** → autorise Netlify
6. Sélectionne ton repo **budget-app**
7. Vérifie que c'est bien rempli :
   - Branch : main
   - Build command : npm run build
   - Publish directory : build
8. Clique **Deploy**

Le build prend 2-3 minutes. À la fin, ton site sera live.

## Étape 4 — Sur ton iPhone

Comme avant : Safari → URL Netlify → Partager → Sur l'écran d'accueil

---

## Pour les futures mises à jour

Plus besoin de zip. Quand je te livre une nouvelle version :

1. Va sur ton repo GitHub `budget-app`
2. Pour chaque fichier modifié (généralement `src/App.jsx`) :
   - Clique sur le fichier → icône **crayon** en haut à droite
   - Sélectionne tout (Cmd+A) → colle le nouveau contenu
   - **Commit changes** en bas
3. Netlify détecte et redéploie tout seul en 2 minutes
4. Sur iPhone : ferme et relance l'app

---

## Si quelque chose ne marche pas

Va sur Netlify → onglet **Deploys** :
- Vert **Published** = OK
- Rouge **Failed** = clique dessus, regarde le log, copie l'erreur
- Jaune **Building** = patiente

Envoie-moi l'erreur exacte si besoin.
