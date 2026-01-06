# MVP Système de Gestion Hospitalière

## 📖 Vue d'ensemble

Ce projet est un **MVP (Minimum Viable Product)** d'un système de gestion hospitalière développé en **7 jours**. Il permet de gérer le workflow complet : **Prise de rendez-vous → Consultation médicale → Prescription → Résultat de laboratoire → Retour au médecin**.

### Stack technique
- **Frontend** : Electron + React + TypeScript + Material-UI
- **Backend** : Node.js + NestJS + Prisma
- **Base de données** : PostgreSQL
- **Architecture** : Monorepo client-serveur (réseau local)

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js v18+
- PostgreSQL v14+
- npm ou yarn

### Installation complète

Suivez le guide d'installation détaillé : **[INSTALL.md](./INSTALL.md)**

**Résumé des étapes :**

1. **Installer les outils** (Node.js, PostgreSQL)
2. **Créer la base de données** PostgreSQL
3. **Installer les dépendances** :
   ```bash
   npm run install:all
   ```
4. **Configurer les variables d'environnement** (`.env`)
5. **Créer la base de données** :
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. **Démarrer l'application** :
   ```bash
   npm run dev
   ```

**Accès :**
- Backend : http://localhost:3000
- Frontend : http://localhost:5173

---

## 📚 Documentation

### Documents d'architecture et de conception

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Architecture technique complète du projet |
| **[API.md](./API.md)** | Spécification de toutes les routes API REST |
| **[schema.prisma](./schema.prisma)** | Schéma de base de données Prisma |
| **[STRUCTURE.md](./STRUCTURE.md)** | Structure détaillée du monorepo |
| **[WIREFRAMES.md](./WIREFRAMES.md)** | Maquettes et design des interfaces |
| **[INSTALL.md](./INSTALL.md)** | Guide d'installation complet |

### Workflow métier

```
┌─────────────────────────────────────────────────────────────┐
│                     WORKFLOW MÉTIER                         │
└─────────────────────────────────────────────────────────────┘

1️⃣  SECRÉTARIAT          Crée un patient et un rendez-vous
                         ↓
2️⃣  MÉDECIN              Consulte le patient et crée une prescription
                         ↓
3️⃣  SECRÉTARIAT/AUTO     La prescription est envoyée au laboratoire (SENT_TO_LAB)
                         ↓
4️⃣  BIOLOGISTE           Reçoit la prescription et commence l'analyse (IN_PROGRESS)
                         ↓
5️⃣  BIOLOGISTE           Saisit et valide les résultats (COMPLETED)
                         ↓
6️⃣  MÉDECIN              Consulte les résultats et poursuit le suivi
```

---

## 👥 Profils utilisateurs

Le système gère **4 rôles** avec des permissions différentes :

### 🔑 ADMIN (Administrateur)
- Gestion complète des utilisateurs (créer, modifier, supprimer)
- Accès à toutes les sections en lecture
- **Login** : `admin@hospital.com` / `admin123`

### 🩺 DOCTOR (Médecin)
- Consulter les rendez-vous
- Créer et consulter des prescriptions
- Consulter les résultats de laboratoire
- **Login** : `doctor@hospital.com` / `doctor123`

### 🔬 BIOLOGIST (Biologiste)
- Consulter les prescriptions envoyées au laboratoire
- Changer le statut des prescriptions (IN_PROGRESS)
- Saisir et valider les résultats
- **Login** : `biologist@hospital.com` / `biologist123`

### 📋 SECRETARY (Secrétariat)
- Créer et gérer les patients
- Créer et gérer les rendez-vous
- **Login** : `secretary@hospital.com` / `secretary123`

---

## 🗄️ Modèle de données

### Entités principales

```
User (Utilisateurs)
├── id, name, email, password, role
└── Relations: Appointments (doctor), Prescriptions (doctor)

Patient
├── id, firstName, lastName, birthDate
└── Relations: Appointments, Prescriptions

Appointment (Rendez-vous)
├── id, date, motif, status
└── Relations: Patient, Doctor (User)

Prescription
├── id, text, status, createdAt
├── Status: CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED
└── Relations: Patient, Doctor (User), Result

Result (Résultat)
├── id, text, createdAt
└── Relations: Prescription (one-to-one)
```

**Schéma complet** : Voir [schema.prisma](./schema.prisma)

---

## 🎨 Interface utilisateur

L'interface utilise **Material-UI** pour un design moderne et professionnel.

### Thème
- **Couleur principale** : Bleu médical (#1976D2)
- **Font** : Roboto
- **Responsive** : Desktop uniquement (largeur min: 1024px)

### Pages principales

| Rôle | Pages accessibles |
|------|-------------------|
| **SECRETARY** | Dashboard, Patients, Rendez-vous |
| **DOCTOR** | Dashboard, Patients (lecture), Rendez-vous, Prescriptions, Résultats |
| **BIOLOGIST** | Dashboard, Prescriptions (filtrées), Résultats |
| **ADMIN** | Dashboard, Utilisateurs, Toutes les pages (lecture) |

**Maquettes détaillées** : Voir [WIREFRAMES.md](./WIREFRAMES.md)

---

## 🛠️ Commandes utiles

### Développement

```bash
# Démarrer backend + frontend
npm run dev

# Démarrer seulement le backend
npm run dev:backend

# Démarrer seulement le frontend
npm run dev:frontend
```

### Base de données

```bash
# Appliquer les migrations
npm run db:migrate

# Peupler la DB avec des données de test
npm run db:seed

# Ouvrir Prisma Studio (interface graphique)
npm run db:studio
```

### Build & Production

```bash
# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Package l'application Electron
cd frontend && npm run electron:build
```

---

## 📅 Planning de développement (7 jours)

| Jour | Objectifs | Fichiers à créer |
|------|-----------|------------------|
| **Jour 1** | Setup backend, DB, Prisma, seed | Backend structure, Prisma schema |
| **Jour 2** | Authentification et rôles | AuthModule, UsersModule, Guards |
| **Jour 3** | Gestion patients et RDV | PatientsModule, AppointmentsModule + UI |
| **Jour 4** | Création de prescriptions | PrescriptionsModule + UI médecin |
| **Jour 5** | Saisie des résultats | ResultsModule + UI biologiste |
| **Jour 6** | Interface utilisateur et Electron | Finalisation UI, intégration Electron |
| **Jour 7** | Tests, seed et démo | Scénario complet, documentation |

---

## ✅ Critères de réussite

Le MVP sera considéré comme réussi si :

1. ✅ **Scénario complet démontrable** : Du rendez-vous au résultat sans erreur
2. ✅ **Séparation des rôles** : Chaque utilisateur a accès uniquement à ses fonctionnalités
3. ✅ **Performances** : Temps de réponse < 2 secondes en local
4. ✅ **Démo fluide** : Fonctionne sur au moins 2 postes clients
5. ✅ **Interface soignée** : UI professionnelle avec Material-UI

---

## 🚫 Hors périmètre MVP

Les fonctionnalités suivantes ne sont **pas incluses** dans ce MVP :

- Dossier médical complet et historique détaillé
- Stockage et gestion de documents médicaux (PDF, images)
- Notifications temps réel (WebSocket)
- Audit RGPD et conformité légale complète
- Gestion avancée du planning (vue calendrier)
- Export de données
- Impression de documents
- Version mobile

---

## 🧪 Scénario de démonstration

### Scénario complet à tester

1. **Connexion** : Se connecter en tant que `secretary@hospital.com`
2. **Créer un patient** : "Jean Dupont", né le 15/05/1980
3. **Créer un RDV** : Pour Jean Dupont avec Dr. Martin le 05/01/2026 à 10h00
4. **Déconnexion** et reconnexion en tant que `doctor@hospital.com`
5. **Consulter les RDV** : Voir le RDV avec Jean Dupont
6. **Créer une prescription** : "Analyse sanguine : NFS, glycémie à jeun"
7. **Déconnexion** et reconnexion en tant que `biologist@hospital.com`
8. **Voir les prescriptions** en attente (statut SENT_TO_LAB ou IN_PROGRESS)
9. **Saisir les résultats** : "NFS: 5.2M/μL, Glycémie: 0.95g/L - Résultats normaux"
10. **Déconnexion** et reconnexion en tant que `doctor@hospital.com`
11. **Consulter les résultats** : Voir les résultats saisis par le biologiste
12. ✅ **Workflow complet validé !**

---

## 🤝 Contribution

Ce projet est un MVP à vocation éducative et de démonstration.

### Structure du code

- **Backend** : Suivre l'architecture modulaire de NestJS
- **Frontend** : Composants React réutilisables
- **Base de données** : Migrations Prisma pour tout changement de schéma

---

## 📞 Support

Pour toute question ou problème :

1. Consulter la documentation dans les fichiers `.md`
2. Vérifier la section **Dépannage** dans [INSTALL.md](./INSTALL.md)
3. Consulter les logs :
   - Backend : Console du terminal
   - Frontend : Console du navigateur (F12)

---

## 📄 Licence

Ce projet est développé dans un cadre éducatif et de démonstration.

---

## 🎯 Prochaines étapes

Une fois l'architecture validée et l'installation terminée, vous pouvez :

1. ✅ Commencer le développement du backend (Jour 1)
2. ✅ Créer les modules NestJS selon la structure définie
3. ✅ Implémenter l'authentification (Jour 2)
4. ✅ Développer l'interface utilisateur (Jours 3-6)
5. ✅ Tester le workflow complet (Jour 7)

**Bonne chance pour le développement ! 🚀**

---

**Projet** : MVP Système de Gestion Hospitalière
**Durée** : 7 jours
**Version** : 1.0
**Date** : 02/01/2026
