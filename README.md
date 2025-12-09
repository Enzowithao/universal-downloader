# 🎥 Universal Downloader

**L'outil ultime pour télécharger vos contenus préférés en haute qualité.**
Compatible avec YouTube, TikTok, X (Twitter) et plus encore. Sans publicité, sans limite, 100% gratuit.

![Aperçu du projet](https://via.placeholder.com/800x400?text=Universal+Downloader+Preview)
*(Tu pourras remplacer ce lien par une capture d'écran de ton site plus tard !)*

## ✨ Fonctionnalités

- 🚀 **Détection Automatique** : Collez un lien, le site reconnaît la plateforme instantanément.
- ⚡ **Téléchargements Rapides** : Moteur basé sur `yt-dlp` pour des performances maximales.
- 🎬 **Multi-Formats** :
  - Vidéo MP4 (jusqu'à 4K)
  - Audio MP3 (320kbps avec métadonnées)
  - Support des vidéos verticales (TikTok/Shorts)
- 🎨 **Interface Premium** : Design sombre, animations fluides, confettis et historique local.
- 🛡️ **Respect de la vie privée** : Aucun log conservé, nettoyage automatique des fichiers sur le serveur.

## 🛠️ Stack Technique

Ce projet utilise une architecture moderne :

- **Frontend** : [Next.js 14](https://nextjs.org/) (React), Tailwind CSS, Framer Motion, Sonner.
- **Backend** : [FastAPI](https://fastapi.tiangolo.com/) (Python), yt-dlp, FFmpeg.

## 📦 Installation & Lancement

Si vous voulez lancer ce projet sur votre machine :

### 1. Cloner le projet
```bash
git clone [https://github.com/Enzowithao/universal-downloader.git](https://github.com/Enzowithao/universal-downloader.git)
cd universal-downloader

2. Lancer le Backend (Python)
Bash

cd backend
# Créer un environnement virtuel (recommandé)
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install fastapi "uvicorn[standard]" yt-dlp

# Lancer le serveur
mkdir downloads # Important : créer le dossier de stockage temporaire
uvicorn main:app --reload
Le backend sera accessible sur http://127.0.0.1:8000

3. Lancer le Frontend (React)
Ouvrez un nouveau terminal :

Bash

cd frontend
npm install
npm run dev
Ouvrez http://localhost:3000 dans votre navigateur.

Conçu avec ❤️ par Enzo.


---

Une fois collé, n'oublie pas d'envoyer la mise à jour sur GitHub :

```bash
git add .
git commit -m "Correction du README"
git push
