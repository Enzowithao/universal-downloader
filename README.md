# 🎥 Universal Downloader

**L'outil ultime pour télécharger vos contenus préférés en haute qualité.**
Compatible avec YouTube, TikTok, X (Twitter) et plus encore. Sans publicité, sans limite, 100% gratuit.

![Aperçu du projet](https://via.placeholder.com/800x400?text=Universal+Downloader+Preview)
*(Tu pourras remplacer ce lien par une capture d'écran de ton site plus tard !)*

## ✨ Fonctionnalités (v1.5)

- 🚀 **Détection Automatique** : Collez un lien, le site reconnaît la plateforme instantanément.
- ✏️ **Édition de Titre** : Renommez vos fichiers avant le téléchargement pour une bibliothèque propre.
- 🎵 **Mode Audiophile** :
  - Conversion MP3 haute qualité (320kbps).
  - **Incrustation automatique de la pochette (Cover Art)** et des métadonnées.
- 🎬 **Vidéo HD** : Support MP4 jusqu'à 4K et gestion des formats verticaux (Shorts/TikTok).
- 🎨 **Expérience Utilisateur** :
  - Feedback visuel en temps réel (téléchargement, conversion, envoi).
  - Design sombre, animations fluides et confettis de célébration 🎉.
  - Historique local sauvegardé.

## 🛠️ Stack Technique

- **Frontend** : Next.js 14, Tailwind CSS, Framer Motion, Sonner.
- **Backend** : FastAPI (Python), yt-dlp, FFmpeg, AtomicParsley.

## 📦 Installation & Lancement

Pré-requis système (pour Linux/Ubuntu) :
Ce projet nécessite FFmpeg (traitement vidéo), Node.js (décryptage YouTube) et AtomicParsley (métadonnées MP3).

```bash
sudo apt update
sudo apt install ffmpeg nodejs atomicparsley
```

### 1. Cloner le projet

```bash
git clone https://github.com/Enzowithao/universal-downloader.git
cd universal-downloader
```

### 2. Lancer le Backend (Python)

```bash
cd backend

# Créer un environnement virtuel (recommandé)
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install fastapi "uvicorn[standard]" yt-dlp

# Lancer le serveur
mkdir downloads # Important : créer le dossier de stockage temporaire
uvicorn main:app --reload
```

Le backend sera accessible sur `http://127.0.0.1:8000`

### 3. Lancer le Frontend (React)

Ouvrez un nouveau terminal :

```bash
cd frontend
npm install
npm run dev
```

Ouvrez `http://localhost:3000` dans votre navigateur.

---

Conçu avec ❤️ par **Enzo**.
