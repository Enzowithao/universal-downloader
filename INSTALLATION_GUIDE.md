# 📥 Guide d'Installation Complet - Universal Downloader

Bienvenue ! Ce guide va t'expliquer pas à pas comment installer **Universal Downloader** sur ton ordinateur, que tu sois sur **Windows** ou **Linux**.

---

## 📋 Partie 1 : Les Pré-requis

Avant de télécharger le projet, tu dois installer quelques outils indispensables.

### 1. Git (Pour récupérer le code)
C'est l'outil qui permet de télécharger le projet depuis GitHub.
- **Windows** : [Télécharger Git ici](https://git-scm.com/download/win). Installe-le en laissant toutes les options par défaut.
- **Linux** (Debian/Ubuntu) :
  ```bash
  sudo apt update
  sudo apt install git
  ```

### 2. Python (Pour le "Cerveau" du site)
Le backend fonctionne avec Python. Il te faut la version 3.10 ou plus récente.
- **Windows** : [Télécharger Python](https://www.python.org/downloads/).
  > ⚠️ **TRES IMPORTANT** : Lors de l'installation, coche la case **"Add Python to PATH"** en bas de la première fenêtre. Sinon, ça ne marchera pas !
- **Linux** : Généralement déjà installé. Vérifie avec `python3 --version`. Si besoin : `sudo apt install python3 python3-pip`.

### 3. Node.js (Pour l'Interface)
C'est ce qui fait tourner le site web (le Frontend).
- **Windows** : [Télécharger Node.js (LTS)](https://nodejs.org/). Prends la version "LTS" (Long Term Support).
- **Linux** :
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 4. FFmpeg (Crucial pour la vidéo HD) ❤️
C'est l'outil magique qui permet de coller l'audio et la vidéo ensemble pour avoir de la HD (1080p et +).
- **Linux** : Facile ! Tape juste :
  ```bash
  sudo apt install ffmpeg
  ```
- **Windows** : C'est un peu plus manuel.
  1. Télécharge le fichier `.zip` ici : [FFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z).
  2. Extrais le dossier (tu auras besoin de 7-Zip ou WinRAR).
  3. Renomme le dossier extrait en `ffmpeg` et déplace-le dans ton disque `C:\` (pour avoir `C:\ffmpeg`).
  4. Ouvre le menu Démarrer, tape "Variables d'environnement" et ouvre l'option.
  5. Dans "Variables système", trouve la ligne `Path` et clique sur "Modifier".
  6. Clique sur "Nouveau" et colle : `C:\ffmpeg\bin`.
  7. Valide tout en cliquant sur OK.
  8. Vérifie en ouvrant un CMD et en tapant `ffmpeg -version`. Si ça affiche du texte, c'est gagné !

---

## 🚀 Partie 2 : Installation du Projet

Maintenant que tout est prêt, on attaque !

### Étape 1 : Récupérer le code
Ouvre ton terminal (CMD ou PowerShell sur Windows, Terminal sur Linux).

```bash
# Va sur ton bureau (optionnel, mais pratique)
cd Desktop  # ou 'cd Bureau'

# Clone le projet
git clone https://github.com/Enzowithao/universal-downloader.git

# Entre dans le dossier
cd universal-downloader
```

---

### Étape 2 : Préparer le Backend (Serveur)

C'est la partie qui télécharge les vidéos. On va l'installer dans une petite "bulle" (environnement virtuel) pour pa tout mélanger.

#### 🐧 Sur Linux / Mac :
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 🪟 Sur Windows (PowerShell) :
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```
*(Si Windows te dit que l'exécution de scripts est désactivée, lance PowerShell en Admin et tape : `Set-ExecutionPolicy RemoteSigned`)*

---

### Étape 3 : Préparer le Frontend (Site Web)

Ouvre **un nouveau terminal** (ne ferme pas l'autre !) et retourne dans le dossier du projet.

```bash
cd universal-downloader
cd frontend
npm install
```
*Cela va télécharger toutes les librairies nécessaires (React, Next.js...). Ça peut prendre 1 à 2 minutes.*

---

## ▶️ Partie 3 : Lancer l'Application

Tout est installé ? Parfait ! Voici comment lancer le projet à chaque fois que tu veux l'utiliser.

Tu as besoin de **DEUX terminaux** ouverts en même temps.

### Terminal 1 : Le Backend 🐍
```bash
# Linux
cd backend
source venv/bin/activate
python main.py

# Windows
cd backend
.\venv\Scripts\Activate
python main.py
```
> Tu verras le message : `Uvicorn running on http://0.0.0.0:8000`. Laisse cette fenêtre ouverte !

### Terminal 2 : Le Frontend 🎨
```bash
cd frontend
npm run dev
```
> Tu verras le message : `Ready in ...`

🎉 **C'est fini !** Ouvre ton navigateur et va sur : **[http://localhost:3000](http://localhost:3000)**

---

## ❓ FAQ & Problèmes

**Q : Ça me dit "ffmpeg not found" dans la console du backend ?**
R : Ça veut dire que FFmpeg n'est pas installé ou pas dans le PATH. Relis la partie 1 point 4, c'est l'erreur la plus classique. Sans ça, tu n'auras pas de 1080p, juste du 720p maximum.

**Q : Je peux fermer les terminaux ?**
R : Non ! Tant que tu veux utiliser le site, les deux fenêtres noires doivent rester ouvertes. C'est elles qui font tourner le moteur.

**Q : Comment je fais pour arrêter ?**
R : Dans les terminaux, fais `CTRL + C` pour stopper les processus.
