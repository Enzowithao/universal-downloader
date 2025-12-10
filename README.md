# 🎥 Universal Downloader (v3.5)

**L'outil ultime pour télécharger vos contenus préférés en haute qualité.**
Compatible avec YouTube, TikTok, X (Twitter) et Instagram. Sans publicité, sans limite, 100% gratuit, et maintenant **ultra-sécurisé**.

![Aperçu du projet](https://via.placeholder.com/800x400?text=Universal+Downloader+v3.5)

## ✨ Nouveautés v3.5 (VPS Ready)

- 🔒 **Accès Sécurisé** : Protection complète du site par mot de passe administrateur.
- 🕵️ **Mode Furtif** : Configuration SEO (robots.txt, meta tags) pour empêcher l'indexation par Google.
- 🚀 **VPS Ready** : Fichiers de configuration PM2 et Nginx inclus pour un déploiement professionnel.
- 🎨 **Interface Épurée** : Suppression des références Spotify, intégration des vrais logos sociaux.
- 🛠️ **Correctifs** : Résolution des bugs de playlists et du support Instagram/TikTok.

## 🌟 Fonctionnalités Principales

- 🚀 **Détection Automatique** : Collez un lien, le site reconnaît la plateforme instantanément.
- ✏️ **Édition de Titre** : Renommez vos fichiers avant le téléchargement.
- 🎵 **Mode Audiophile** : Conversion MP3 320kbps avec incrustation automatique de la pochette.
- 🎬 **Vidéo HD** : Support MP4 jusqu'à 4K et gestion des formats verticaux.
- ⚡ **Batch Download** : Téléchargement de playlists complètes.

## 🛠️ Stack Technique

- **Frontend** : Next.js 14, Tailwind CSS, Framer Motion.
- **Backend** : FastAPI (Python), yt-dlp, FFmpeg.
- **Sécurité** : Middleware Next.js, Auth par Cookie HttpOnly.

## 📦 Installation & Lancement

Pré-requis : `FFmpeg`, `Node.js`, `Python 3.10+`.

### 1. Cloner le projet

```bash
git clone https://github.com/Enzowithao/universal-downloader.git
cd universal-downloader
```

### 2. Configuration Sécurité

Créez un fichier `.env` dans le dossier `universal-downloader/frontend` :

```env
APP_PASSWORD=VotreMotDePasseSuperSecret
```

### 3. Lancer le Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Lancer le Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

## ☁️ Déploiement VPS (Production)

Le projet inclut une configuration prête à l'emploi pour PM2 et Nginx.

1.  **PM2** : Utilisez `ecosystem.config.js` à la racine pour lancer les deux services (Frontend + Backend) simultanément.
2.  **Nginx** : Utilisez le modèle `nginx.conf` pour configurer votre Reverse Proxy et sécuriser les ports.
3.  **Variable Admin** : Assurez-vous que `APP_PASSWORD` est défini dans `ecosystem.config.js` lors du déploiement.

---

Conçu avec ❤️ par **Enzo**.
