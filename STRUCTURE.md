# Structure Détaillée du Monorepo

## 📂 Vue d'ensemble

Ce document décrit l'organisation complète des dossiers et fichiers du projet en architecture **Monorepo**.

```
hospital-mvp/
├── backend/                    # Serveur NestJS + API REST
├── frontend/                   # Application Electron + React
├── docs/                       # Documentation du projet
├── .gitignore                  # Fichiers à ignorer par Git
├── README.md                   # Documentation principale
├── ARCHITECTURE.md             # Architecture technique
├── API.md                      # Spécification de l'API
├── STRUCTURE.md                # Ce fichier
├── INSTALL.md                  # Guide d'installation
└── package.json                # Scripts racine du monorepo
```

---

## 🔧 Backend (NestJS)

```
backend/
├── src/
│   ├── auth/                           # Module d'authentification
│   │   ├── auth.controller.ts          # Routes /auth
│   │   ├── auth.service.ts             # Logique d'authentification
│   │   ├── auth.module.ts              # Module NestJS
│   │   ├── guards/
│   │   │   ├── auth.guard.ts           # Vérifie si l'utilisateur est connecté
│   │   │   └── roles.guard.ts          # Vérifie les rôles utilisateur
│   │   └── decorators/
│   │       ├── current-user.decorator.ts  # Récupère l'utilisateur connecté
│   │       └── roles.decorator.ts         # Décorateur pour définir les rôles requis
│   │
│   ├── users/                          # Module utilisateurs
│   │   ├── users.controller.ts         # Routes /users
│   │   ├── users.service.ts            # CRUD utilisateurs
│   │   ├── users.module.ts             # Module NestJS
│   │   └── dto/
│   │       ├── create-user.dto.ts      # DTO pour créer un utilisateur
│   │       └── update-user.dto.ts      # DTO pour modifier un utilisateur
│   │
│   ├── patients/                       # Module patients
│   │   ├── patients.controller.ts      # Routes /patients
│   │   ├── patients.service.ts         # CRUD patients
│   │   ├── patients.module.ts          # Module NestJS
│   │   └── dto/
│   │       ├── create-patient.dto.ts   # DTO pour créer un patient
│   │       └── update-patient.dto.ts   # DTO pour modifier un patient
│   │
│   ├── appointments/                   # Module rendez-vous
│   │   ├── appointments.controller.ts  # Routes /appointments
│   │   ├── appointments.service.ts     # CRUD rendez-vous
│   │   ├── appointments.module.ts      # Module NestJS
│   │   └── dto/
│   │       ├── create-appointment.dto.ts
│   │       └── update-appointment.dto.ts
│   │
│   ├── prescriptions/                  # Module prescriptions
│   │   ├── prescriptions.controller.ts # Routes /prescriptions
│   │   ├── prescriptions.service.ts    # CRUD prescriptions + gestion des statuts
│   │   ├── prescriptions.module.ts     # Module NestJS
│   │   └── dto/
│   │       ├── create-prescription.dto.ts
│   │       └── update-prescription.dto.ts
│   │
│   ├── results/                        # Module résultats
│   │   ├── results.controller.ts       # Routes /results
│   │   ├── results.service.ts          # CRUD résultats
│   │   ├── results.module.ts           # Module NestJS
│   │   └── dto/
│   │       ├── create-result.dto.ts
│   │       └── update-result.dto.ts
│   │
│   ├── app.module.ts                   # Module racine de l'application
│   └── main.ts                         # Point d'entrée du serveur
│
├── prisma/
│   ├── schema.prisma                   # Schéma de la base de données
│   ├── migrations/                     # Migrations Prisma (générées auto)
│   └── seed.ts                         # Script pour peupler la DB avec des données de démo
│
├── test/                               # Tests e2e (optionnel pour MVP)
├── .env                                # Variables d'environnement (DATABASE_URL, etc.)
├── .env.example                        # Exemple de fichier .env
├── package.json                        # Dépendances backend
├── tsconfig.json                       # Configuration TypeScript
└── nest-cli.json                       # Configuration NestJS
```

### Fichiers importants backend

#### `src/main.ts`
Point d'entrée du serveur. Configure :
- Le port (3000)
- Les sessions avec `express-session`
- CORS pour permettre les requêtes du frontend
- Validation globale avec `class-validator`

#### `src/app.module.ts`
Module racine qui importe tous les modules de l'application :
- AuthModule
- UsersModule
- PatientsModule
- AppointmentsModule
- PrescriptionsModule
- ResultsModule
- PrismaModule (service pour interagir avec la DB)

#### `.env`
Variables d'environnement :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_mvp"
SESSION_SECRET="hospital-secret-key-change-in-production"
PORT=3000
```

---

## 🎨 Frontend (Electron + React)

```
frontend/
├── public/
│   ├── index.html                      # Template HTML principal
│   └── assets/                         # Images, icônes
│
├── src/
│   ├── components/                     # Composants réutilisables
│   │   ├── common/                     # Composants génériques
│   │   │   ├── Button.tsx              # Bouton personnalisé
│   │   │   ├── Table.tsx               # Table réutilisable
│   │   │   ├── Card.tsx                # Carte MUI customisée
│   │   │   ├── FormField.tsx           # Champ de formulaire
│   │   │   └── Loader.tsx              # Indicateur de chargement
│   │   │
│   │   ├── layout/                     # Composants de mise en page
│   │   │   ├── Header.tsx              # En-tête avec titre et bouton déconnexion
│   │   │   ├── Sidebar.tsx             # Menu latéral (navigation par rôle)
│   │   │   └── Layout.tsx              # Wrapper principal (Header + Sidebar + Content)
│   │   │
│   │   └── forms/                      # Formulaires réutilisables
│   │       ├── PatientForm.tsx         # Formulaire patient
│   │       ├── AppointmentForm.tsx     # Formulaire rendez-vous
│   │       ├── PrescriptionForm.tsx    # Formulaire prescription
│   │       └── ResultForm.tsx          # Formulaire résultat
│   │
│   ├── pages/                          # Pages de l'application
│   │   ├── Login/
│   │   │   └── Login.tsx               # Page de connexion
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx           # Tableau de bord principal (affiche selon le rôle)
│   │   │   ├── DoctorDashboard.tsx     # Dashboard médecin
│   │   │   ├── BiologistDashboard.tsx  # Dashboard biologiste
│   │   │   ├── SecretaryDashboard.tsx  # Dashboard secrétariat
│   │   │   └── AdminDashboard.tsx      # Dashboard admin
│   │   │
│   │   ├── Patients/
│   │   │   ├── PatientsList.tsx        # Liste des patients
│   │   │   ├── PatientDetails.tsx      # Détails d'un patient
│   │   │   └── CreatePatient.tsx       # Création de patient
│   │   │
│   │   ├── Appointments/
│   │   │   ├── AppointmentsList.tsx    # Liste des RDV
│   │   │   ├── AppointmentDetails.tsx  # Détails d'un RDV
│   │   │   └── CreateAppointment.tsx   # Création de RDV
│   │   │
│   │   ├── Prescriptions/
│   │   │   ├── PrescriptionsList.tsx   # Liste des prescriptions
│   │   │   ├── PrescriptionDetails.tsx # Détails d'une prescription
│   │   │   └── CreatePrescription.tsx  # Création de prescription
│   │   │
│   │   └── Results/
│   │       ├── ResultsList.tsx         # Liste des résultats
│   │       ├── ResultDetails.tsx       # Détails d'un résultat
│   │       └── CreateResult.tsx        # Création de résultat (biologiste)
│   │
│   ├── services/                       # Services pour appeler l'API
│   │   ├── api.ts                      # Configuration Axios
│   │   ├── authService.ts              # Auth (login, logout, me)
│   │   ├── usersService.ts             # API Users
│   │   ├── patientsService.ts          # API Patients
│   │   ├── appointmentsService.ts      # API Appointments
│   │   ├── prescriptionsService.ts     # API Prescriptions
│   │   └── resultsService.ts           # API Results
│   │
│   ├── types/                          # Types TypeScript
│   │   ├── User.ts                     # Type User + Role enum
│   │   ├── Patient.ts                  # Type Patient
│   │   ├── Appointment.ts              # Type Appointment + Status enum
│   │   ├── Prescription.ts             # Type Prescription + Status enum
│   │   └── Result.ts                   # Type Result
│   │
│   ├── context/                        # Context API React
│   │   └── AuthContext.tsx             # Gestion de l'utilisateur connecté
│   │
│   ├── hooks/                          # Custom React Hooks
│   │   ├── useAuth.ts                  # Hook pour accéder au AuthContext
│   │   └── useApi.ts                   # Hook pour simplifier les appels API
│   │
│   ├── styles/                         # Styles globaux
│   │   ├── theme.ts                    # Thème Material-UI personnalisé
│   │   └── global.css                  # Styles CSS globaux
│   │
│   ├── utils/                          # Utilitaires
│   │   ├── formatDate.ts               # Formater les dates
│   │   └── constants.ts                # Constantes (URLs, etc.)
│   │
│   ├── App.tsx                         # Composant racine (Router + AuthProvider)
│   ├── main.tsx                        # Point d'entrée React
│   └── routes.tsx                      # Configuration des routes
│
├── electron/
│   ├── main.js                         # Processus principal Electron
│   ├── preload.js                      # Script de preload (optionnel)
│   └── icon.png                        # Icône de l'application
│
├── .env                                # Variables d'environnement frontend
├── .env.example                        # Exemple de fichier .env
├── package.json                        # Dépendances frontend
├── tsconfig.json                       # Configuration TypeScript
├── vite.config.ts                      # Configuration Vite (bundler)
└── electron-builder.json               # Configuration pour packager l'app Electron
```

### Fichiers importants frontend

#### `src/App.tsx`
Composant racine qui configure :
- Le thème Material-UI
- Le contexte d'authentification
- Le routeur React Router

#### `src/services/api.ts`
Configuration Axios avec :
- Base URL : `http://localhost:3000/api`
- Credentials : `withCredentials: true` (pour les cookies de session)
- Intercepteurs pour gérer les erreurs d'authentification

#### `src/context/AuthContext.tsx`
Fournit à toute l'application :
- L'utilisateur connecté (`user`)
- Les fonctions `login()` et `logout()`
- L'état de chargement (`loading`)

#### `electron/main.js`
Configure la fenêtre Electron :
- Taille : 1280x800
- Charge l'application React (via Vite en dev, build en prod)

---

## 📁 Dossier docs/

```
docs/
├── wireframes/                 # Maquettes des interfaces
│   ├── login.png
│   ├── doctor-dashboard.png
│   ├── secretary-dashboard.png
│   └── biologist-dashboard.png
│
└── screenshots/                # Captures d'écran de la démo finale
```

---

## 🔧 Fichiers racine

### `package.json` (racine)
Scripts pour gérer le monorepo :
```json
{
  "name": "hospital-mvp",
  "version": "1.0.0",
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
  }
}
```

### `.gitignore`
```gitignore
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
```

---

## 📊 Diagramme de dépendances des modules

```
┌──────────────┐
│  app.module  │
└──────┬───────┘
       │
       ├─────► AuthModule ──────► UsersModule, PrismaModule
       │
       ├─────► UsersModule ──────► PrismaModule
       │
       ├─────► PatientsModule ───► PrismaModule
       │
       ├─────► AppointmentsModule ─► PrismaModule, PatientsModule, UsersModule
       │
       ├─────► PrescriptionsModule ─► PrismaModule, PatientsModule, UsersModule
       │
       └─────► ResultsModule ─────► PrismaModule, PrescriptionsModule
```

---

## 🚀 Ordre de création des fichiers (Développement)

### Phase 1 : Backend (Jours 1-2)
1. ✅ Créer la structure backend
2. ✅ Configurer Prisma et la DB
3. ✅ Créer les modules de base (Users, Auth)
4. ✅ Implémenter l'authentification

### Phase 2 : Backend + Frontend (Jours 3-5)
5. ✅ Modules Patients et Appointments
6. ✅ Modules Prescriptions et Results
7. ✅ Frontend : Login + Dashboard
8. ✅ Frontend : Pages patients/appointments
9. ✅ Frontend : Pages prescriptions/results

### Phase 3 : Intégration (Jours 6-7)
10. ✅ Intégration Electron
11. ✅ Tests du workflow complet
12. ✅ Seed de données de démonstration
13. ✅ Documentation finale

---

**Date de création :** 02/01/2026
**Version :** 1.0
