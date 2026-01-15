# Architecture du MVP Système de Gestion Hospitalière

## 📋 Vue d'ensemble

Ce document décrit l'architecture technique du MVP (7 jours) du système de gestion hospitalière.

**Workflow métier principal :**
Prise de rendez-vous → Consultation médicale → Prescription → Résultat de laboratoire → Retour au médecin

---

## 🏗️ Architecture Technique

### Type d'application
**Application desktop client-serveur (réseau local)** en architecture **Monorepo**

### Stack Technique

#### Frontend
- **Electron** : Conteneur desktop multiplateforme
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Material-UI (MUI)** : Bibliothèque de composants UI
- **React Router** : Navigation
- **Axios** : Client HTTP pour l'API

#### Backend
- **Node.js** : Runtime JavaScript
- **NestJS** : Framework backend structuré
- **TypeScript** : Typage statique
- **Express** : Serveur HTTP (intégré dans NestJS)
- **express-session** : Gestion des sessions d'authentification

#### Base de données
- **PostgreSQL** : Base de données relationnelle
- **Prisma** : ORM (Object-Relational Mapping)

---

## 📁 Structure du Monorepo

```
medecine-app/
├── backend/
│   ├── src/
│   │   ├── auth/               # Module d'authentification
│   │   ├── users/              # Gestion des utilisateurs
│   │   ├── patients/           # Gestion des patients
│   │   ├── appointments/       # Gestion des rendez-vous
│   │   ├── prescriptions/      # Gestion des prescriptions
│   │   ├── results/            # Gestion des résultats
│   │   ├── app.module.ts       # Module racine
│   │   └── main.ts             # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma de la base de données
│   │   └── seed.ts             # Données de démonstration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/                 # Fichiers statiques
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── common/         # Composants génériques (Button, Table, etc.)
│   │   │   ├── layout/         # Layout, Header, Sidebar
│   │   │   └── forms/          # Formulaires réutilisables
│   │   ├── pages/              # Pages de l'application
│   │   │   ├── Login/          # Page de connexion
│   │   │   ├── Dashboard/      # Tableau de bord par rôle
│   │   │   ├── Patients/       # Liste et gestion des patients
│   │   │   ├── Appointments/   # Liste et gestion des rendez-vous
│   │   │   ├── Prescriptions/  # Liste et création de prescriptions
│   │   │   └── Results/        # Saisie et consultation des résultats
│   │   ├── services/           # Services API (axios)
│   │   ├── types/              # Types TypeScript
│   │   ├── context/            # Context API (AuthContext, etc.)
│   │   ├── styles/             # Styles globaux
│   │   ├── App.tsx             # Composant racine
│   │   └── main.tsx            # Point d'entrée React
│   ├── electron/
│   │   └── main.js             # Processus principal Electron
│   ├── package.json
│   └── tsconfig.json
│
├── README.md                   # Documentation principale
├── ARCHITECTURE.md             # Architecture technique
├── API.md                      # Spécification de l'API
├── WIREFRAMES.md               # Maquettes et interfaces
├── INSTALL.md                  # Guide d'installation
├── STRUCTURE.md                # Structure détaillée
├── package.json                # Scripts racine du monorepo
└── .gitignore
```

---

## 🗄️ Modèle de Données (Prisma Schema)

### Entités principales

#### User
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   // Hashé avec bcrypt
  role      Role     @default(DOCTOR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  appointmentsAsDoctor Appointment[]  @relation("DoctorAppointments")
  prescriptions        Prescription[] @relation("DoctorPrescriptions")
}

enum Role {
  ADMIN
  DOCTOR
  BIOLOGIST
  SECRETARY
}
```

#### Patient
```prisma
model Patient {
  id           String   @id @default(uuid())
  firstName    String
  lastName     String
  birthDate    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  appointments  Appointment[]
  prescriptions Prescription[]
}
```

#### Appointment
```prisma
model Appointment {
  id        String   @id @default(uuid())
  date      DateTime
  motif     String   // Raison du rendez-vous
  status    AppointmentStatus @default(SCHEDULED)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id])

  doctorId  String
  doctor    User    @relation("DoctorAppointments", fields: [doctorId], references: [id])
}

enum AppointmentStatus {
  SCHEDULED   // Planifié
  COMPLETED   // Terminé
  CANCELLED   // Annulé
}
```

#### Prescription
```prisma
model Prescription {
  id        String            @id @default(uuid())
  text      String            @db.Text  // Détails de la prescription
  status    PrescriptionStatus @default(CREATED)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  // Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id])

  doctorId  String
  doctor    User    @relation("DoctorPrescriptions", fields: [doctorId], references: [id])

  result    Result?  // Une prescription peut avoir un résultat
}

enum PrescriptionStatus {
  CREATED       // Créée par le médecin
  SENT_TO_LAB   // Envoyée au laboratoire
  IN_PROGRESS   // En cours d'analyse
  COMPLETED     // Résultat disponible
}
```

#### Result
```prisma
model Result {
  id             String   @id @default(uuid())
  text           String   @db.Text  // Résultats détaillés
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  prescriptionId String   @unique
  prescription   Prescription @relation(fields: [prescriptionId], references: [id])
}
```

---

## 🔐 Authentification

### Méthode choisie : **Sessions simples**

#### Flux d'authentification
1. **Login** : L'utilisateur envoie email + password
2. **Vérification** : Backend vérifie les credentials (password hashé avec bcrypt)
3. **Session** : Si valide, création d'une session avec `express-session`
4. **Cookie** : Cookie de session renvoyé au client
5. **Requêtes protégées** : Le cookie est automatiquement envoyé avec chaque requête

#### Configuration express-session
```typescript
// Exemple de configuration dans main.ts
app.use(
  session({
    secret: 'hospital-mvp-secret-key',  // À remplacer par variable d'environnement
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,  // 24 heures
      httpOnly: true,
      secure: false  // true en production avec HTTPS
    }
  })
);
```

#### Guards NestJS
- **AuthGuard** : Vérifie qu'un utilisateur est connecté
- **RolesGuard** : Vérifie que l'utilisateur a le bon rôle

---

## 🌐 API REST - Routes principales

### Auth
```
POST   /api/auth/login          # Connexion
POST   /api/auth/logout         # Déconnexion
GET    /api/auth/me             # Récupérer l'utilisateur connecté
```

### Users
```
GET    /api/users               # Liste des utilisateurs (ADMIN)
POST   /api/users               # Créer un utilisateur (ADMIN)
GET    /api/users/:id           # Détails d'un utilisateur
PATCH  /api/users/:id           # Modifier un utilisateur (ADMIN)
DELETE /api/users/:id           # Supprimer un utilisateur (ADMIN)
```

### Patients
```
GET    /api/patients            # Liste des patients
POST   /api/patients            # Créer un patient (SECRETARY)
GET    /api/patients/:id        # Détails d'un patient
PATCH  /api/patients/:id        # Modifier un patient (SECRETARY)
```

### Appointments
```
GET    /api/appointments        # Liste des RDV (filtrable par médecin, patient)
POST   /api/appointments        # Créer un RDV (SECRETARY)
GET    /api/appointments/:id    # Détails d'un RDV
PATCH  /api/appointments/:id    # Modifier un RDV
DELETE /api/appointments/:id    # Annuler un RDV
```

### Prescriptions
```
GET    /api/prescriptions       # Liste des prescriptions
POST   /api/prescriptions       # Créer une prescription (DOCTOR)
GET    /api/prescriptions/:id   # Détails d'une prescription
PATCH  /api/prescriptions/:id   # Modifier le statut (DOCTOR, BIOLOGIST)
```

### Results
```
GET    /api/results             # Liste des résultats
POST   /api/results             # Créer un résultat (BIOLOGIST)
GET    /api/results/:id         # Détails d'un résultat
PATCH  /api/results/:id         # Modifier un résultat (BIOLOGIST)
```

---

## 🔄 Workflow des Statuts de Prescription

```
CREATED (Médecin)
   ↓
SENT_TO_LAB (Secrétariat ou automatique)
   ↓
IN_PROGRESS (Biologiste commence l'analyse)
   ↓
COMPLETED (Biologiste valide le résultat)
```

### Transitions autorisées
- **DOCTOR** : CREATED
- **BIOLOGIST** : SENT_TO_LAB → IN_PROGRESS → COMPLETED
- Quand un `Result` est créé, le statut passe automatiquement à `COMPLETED`

---

## 🎨 Interface Utilisateur (Material-UI)

### Thème Material-UI
- **Palette** : Couleurs médicales professionnelles (bleu/blanc)
- **Typography** : Police claire et lisible
- **Spacing** : Espacement cohérent pour une UX agréable

### Pages principales par rôle

#### Tous les rôles
- **Login** : Page de connexion simple

#### SECRETARY (Secrétariat)
- **Dashboard** : Vue d'ensemble des RDV du jour
- **Patients** : Liste et formulaire de création/modification
- **Appointments** : Calendrier et formulaire de création de RDV

#### DOCTOR (Médecin)
- **Dashboard** : Mes RDV du jour
- **Appointments** : Liste de mes RDV
- **Prescriptions** : Créer et consulter mes prescriptions
- **Results** : Consulter les résultats de mes prescriptions

#### BIOLOGIST (Biologiste)
- **Dashboard** : Prescriptions en attente
- **Prescriptions** : Liste des prescriptions SENT_TO_LAB
- **Results** : Saisir et valider les résultats

#### ADMIN (Administrateur)
- **Dashboard** : Statistiques globales
- **Users** : Gestion des comptes utilisateurs

### Composants Material-UI utilisés
- `AppBar`, `Drawer`, `Toolbar` : Navigation
- `Table`, `TableContainer` : Listes
- `TextField`, `Select`, `DatePicker` : Formulaires
- `Button`, `IconButton` : Actions
- `Card`, `CardContent` : Conteneurs
- `Dialog` : Modales
- `Snackbar` : Notifications

---

## 🚀 Critères de Réussite

1. ✅ **Scénario complet démontrable** sans erreur
2. ✅ **Séparation claire des rôles** utilisateurs
3. ✅ **Temps de réponse** < 2 secondes en local
4. ✅ **Démo fluide** sur au moins deux postes clients
5. ✅ **Interface utilisateur soignée** avec Material-UI

---

## 📅 Planning de Développement

| Jour | Tâches |
|------|--------|
| **Jour 1** | Setup backend, base de données, modèles Prisma et seed |
| **Jour 2** | Authentification et gestion des rôles |
| **Jour 3** | Gestion des patients et rendez-vous (API + UI) |
| **Jour 4** | Création des prescriptions (médecin) |
| **Jour 5** | Saisie des résultats (biologiste) et retour médecin |
| **Jour 6** | Interface utilisateur et intégration Electron |
| **Jour 7** | Préparation des données et scénario de démonstration |

---

## 🔒 Hors Périmètre MVP

- Dossier médical complet et historique détaillé
- Stockage et gestion des documents médicaux (PDF, images)
- Notifications temps réel (WebSocket)
- Audit RGPD, chiffrement avancé, conformité légale complète
- Gestion avancée du planning (vue calendrier)
- Export de données
- Impression de documents

---

**Date de création :** 02/01/2026
**Version :** 1.0
**Auteur :** MVP Gestion Hospitalière
