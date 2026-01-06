# Guide d'Installation - MVP Système de Gestion Hospitalière

## 📋 Prérequis

Ce guide décrit l'installation complète de l'environnement de développement sur **macOS**.

### Outils à installer
- ✅ Node.js (v18 ou supérieur)
- ✅ PostgreSQL (v14 ou supérieur)
- ✅ npm ou yarn (gestionnaire de paquets)
- ✅ Git (optionnel, pour versionner le code)

---

## 🔧 Étape 1 : Installation de Node.js

### Option A : Via Homebrew (recommandé)

1. Installer Homebrew (si ce n'est pas déjà fait) :
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Installer Node.js :
```bash
brew install node@18
```

3. Vérifier l'installation :
```bash
node --version  # Doit afficher v18.x.x ou supérieur
npm --version   # Doit afficher 9.x.x ou supérieur
```

### Option B : Via le site officiel

1. Télécharger Node.js depuis https://nodejs.org/
2. Installer le fichier `.pkg` téléchargé
3. Vérifier l'installation (même commande que ci-dessus)

---

## 🐘 Étape 2 : Installation de PostgreSQL

### Via Homebrew (recommandé)

1. Installer PostgreSQL :
```bash
brew install postgresql@14
```

2. Démarrer PostgreSQL :
```bash
brew services start postgresql@14
```

3. Vérifier que PostgreSQL est bien démarré :
```bash
psql --version  # Doit afficher PostgreSQL 14.x
```

### Créer la base de données

1. Se connecter à PostgreSQL :
```bash
psql postgres
```

2. Créer un utilisateur et une base de données :
```sql
CREATE USER hospital_user WITH PASSWORD 'hospital_password';
CREATE DATABASE hospital_mvp OWNER hospital_user;
GRANT ALL PRIVILEGES ON DATABASE hospital_mvp TO hospital_user;
\q
```

3. Tester la connexion :
```bash
psql -U hospital_user -d hospital_mvp -h localhost
# Mot de passe : hospital_password
```

---

## 📁 Étape 3 : Initialisation du projet

### 3.1 Créer la structure du monorepo

À partir du dossier racine (`MEDECINE APP`), exécuter :

```bash
# Créer les dossiers principaux
mkdir -p backend/src backend/prisma
mkdir -p frontend/src frontend/public frontend/electron
mkdir -p docs/wireframes docs/screenshots

# Créer le fichier .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Environment variables
.env
.env.local
backend/.env
frontend/.env

# Build outputs
backend/dist/
frontend/dist/
frontend/out/

# Database
backend/prisma/migrations/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF
```

### 3.2 Initialiser le package.json racine

```bash
# À la racine du projet
npm init -y
```

Éditer `package.json` pour ajouter les scripts :
```json
{
  "name": "hospital-mvp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:seed": "cd backend && npx prisma db seed",
    "db:studio": "cd backend && npx prisma studio"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Installer `concurrently` (pour lancer backend et frontend en parallèle) :
```bash
npm install
```

---

## 🔧 Étape 4 : Configuration du Backend

### 4.1 Initialiser le projet NestJS

```bash
cd backend
npm install -g @nestjs/cli
nest new . --skip-git
```

Quand demandé, choisir **npm** comme gestionnaire de paquets.

### 4.2 Installer les dépendances backend

```bash
# Prisma ORM
npm install @prisma/client
npm install -D prisma

# Authentification
npm install bcrypt express-session
npm install -D @types/bcrypt @types/express-session

# Validation
npm install class-validator class-transformer

# CORS
npm install cors
npm install -D @types/cors
```

### 4.3 Initialiser Prisma

```bash
npx prisma init
```

Cela crée :
- `prisma/schema.prisma`
- `.env` avec `DATABASE_URL`

### 4.4 Configurer le fichier `.env`

Éditer `backend/.env` :
```env
DATABASE_URL="postgresql://hospital_user:hospital_password@localhost:5432/hospital_mvp?schema=public"
SESSION_SECRET="hospital-secret-key-change-in-production-12345"
PORT=3000
```

### 4.5 Copier le schéma Prisma

Copier le contenu du fichier `schema.prisma` (à la racine du projet) vers `backend/prisma/schema.prisma`.

### 4.6 Créer la migration initiale

```bash
npx prisma migrate dev --name init
```

Cette commande :
- Crée les tables dans PostgreSQL
- Génère le Prisma Client

### 4.7 Vérifier la base de données

Ouvrir Prisma Studio pour voir les tables :
```bash
npx prisma studio
```

Un navigateur s'ouvre sur `http://localhost:5555` avec l'interface Prisma Studio.

---

## 🎨 Étape 5 : Configuration du Frontend

### 5.1 Initialiser le projet React + Vite

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
```

### 5.2 Installer les dépendances frontend

```bash
# Material-UI
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# React Router
npm install react-router-dom

# Axios (client HTTP)
npm install axios

# Date picker (Material-UI)
npm install @mui/x-date-pickers dayjs

# Electron
npm install -D electron electron-builder concurrently wait-on cross-env
```

### 5.3 Configurer Electron

Créer `frontend/electron/main.js` :
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // En développement : charge depuis Vite
  // En production : charge le build
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### 5.4 Modifier `frontend/package.json`

Ajouter dans `"scripts"` :
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"cross-env BROWSER=none npm run dev\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron electron/main.js\"",
    "electron:build": "npm run build && electron-builder"
  },
  "main": "electron/main.js"
}
```

---

## 🚀 Étape 6 : Démarrer le projet

### Option A : Tout démarrer depuis la racine (recommandé)

Depuis la **racine du projet** :

1. Installer toutes les dépendances :
```bash
npm run install:all
```

2. Démarrer backend et frontend en parallèle :
```bash
npm run dev
```

- Backend : http://localhost:3000
- Frontend : http://localhost:5173

### Option B : Démarrer séparément

**Terminal 1 - Backend :**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Electron (optionnel) :**
```bash
cd frontend
npm run electron:dev
```

---

## 🗃️ Étape 7 : Peupler la base de données (Seed)

### Créer le fichier de seed

Créer `backend/prisma/seed.ts` :
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des utilisateurs
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const biologistPassword = await bcrypt.hash('biologist123', 10);
  const secretaryPassword = await bcrypt.hash('secretary123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const doctor = await prisma.user.create({
    data: {
      name: 'Dr. Martin',
      email: 'doctor@hospital.com',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const biologist = await prisma.user.create({
    data: {
      name: 'Marie Biologiste',
      email: 'biologist@hospital.com',
      password: biologistPassword,
      role: 'BIOLOGIST',
    },
  });

  const secretary = await prisma.user.create({
    data: {
      name: 'Sophie Secrétaire',
      email: 'secretary@hospital.com',
      password: secretaryPassword,
      role: 'SECRETARY',
    },
  });

  console.log('✅ Users created');

  // Créer des patients
  const patient1 = await prisma.patient.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: new Date('1980-05-15'),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      firstName: 'Marie',
      lastName: 'Martin',
      birthDate: new Date('1990-03-20'),
    },
  });

  console.log('✅ Patients created');

  // Créer des rendez-vous
  await prisma.appointment.create({
    data: {
      date: new Date('2026-01-05T10:00:00'),
      motif: 'Consultation de suivi',
      patientId: patient1.id,
      doctorId: doctor.id,
      status: 'SCHEDULED',
    },
  });

  await prisma.appointment.create({
    data: {
      date: new Date('2026-01-05T14:00:00'),
      motif: 'Première consultation',
      patientId: patient2.id,
      doctorId: doctor.id,
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Appointments created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Configurer Prisma pour le seed

Ajouter dans `backend/package.json` :
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Installer `ts-node` :
```bash
cd backend
npm install -D ts-node
```

### Exécuter le seed

```bash
cd backend
npx prisma db seed
```

Vérifier dans Prisma Studio :
```bash
npx prisma studio
```

---

## 🧪 Étape 8 : Tester l'installation

### Vérifier que tout fonctionne

1. **Backend** : http://localhost:3000
   - Tester : http://localhost:3000/api (devrait retourner "Hello World" ou une erreur de route)

2. **Frontend** : http://localhost:5173
   - L'application React doit se charger

3. **PostgreSQL** :
```bash
psql -U hospital_user -d hospital_mvp -h localhost -c "SELECT * FROM users;"
```
   - Doit afficher les 4 utilisateurs créés par le seed

4. **Electron** (optionnel) :
```bash
cd frontend
npm run electron:dev
```
   - Une fenêtre Electron doit s'ouvrir avec l'application React

---

## 📦 Résumé des commandes utiles

### Développement
```bash
# Depuis la racine
npm run dev                 # Démarre backend + frontend

# Depuis backend/
npm run start:dev           # Démarre seulement le backend
npx prisma studio           # Ouvre Prisma Studio

# Depuis frontend/
npm run dev                 # Démarre seulement le frontend
npm run electron:dev        # Démarre Electron + Vite
```

### Base de données
```bash
# Depuis backend/
npx prisma migrate dev      # Crée/applique les migrations
npx prisma db seed          # Peuple la DB avec des données
npx prisma studio           # Interface graphique pour la DB
npx prisma generate         # Regénère le Prisma Client
```

### Build & Production
```bash
# Depuis la racine
npm run build:backend       # Build le backend
npm run build:frontend      # Build le frontend

# Depuis frontend/
npm run electron:build      # Package l'app Electron (macOS, Windows, Linux)
```

---

## 🔑 Comptes de test

Après le seed, vous pouvez vous connecter avec :

| Rôle       | Email                    | Mot de passe   |
|------------|--------------------------|----------------|
| Admin      | admin@hospital.com       | admin123       |
| Médecin    | doctor@hospital.com      | doctor123      |
| Biologiste | biologist@hospital.com   | biologist123   |
| Secrétaire | secretary@hospital.com   | secretary123   |

---

## ❓ Dépannage

### Problème : PostgreSQL ne démarre pas
```bash
# Vérifier le statut
brew services list

# Redémarrer PostgreSQL
brew services restart postgresql@14
```

### Problème : Port 3000 déjà utilisé
Modifier le port dans `backend/.env` :
```env
PORT=3001
```

### Problème : Erreur "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
npm install @prisma/client
```

### Problème : Frontend ne se connecte pas au backend
Vérifier que `withCredentials: true` est bien configuré dans `frontend/src/services/api.ts` :
```typescript
axios.defaults.withCredentials = true;
```

---

## 📚 Prochaines étapes

Une fois l'installation terminée, vous pouvez :
1. ✅ Commencer le développement selon le planning (7 jours)
2. ✅ Lire `ARCHITECTURE.md` pour comprendre la structure
3. ✅ Consulter `API.md` pour les spécifications des endpoints
4. ✅ Suivre `WIREFRAMES.md` pour l'implémentation de l'UI

---

**Date de création :** 02/01/2026
**Version :** 1.0
