# User Stories - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions (Jour 4)
- **Version**: 1.0
- **Date**: 2026-01-03
- **Format**: EARS (Easy Approach to Requirements Syntax)

## Vue d'Ensemble des Epics

### Epic 1: Gestion des Prescriptions par les Médecins
Permettre aux médecins de créer, consulter et envoyer des prescriptions au laboratoire

### Epic 2: Traitement des Prescriptions par les Biologistes
Permettre aux biologistes de gérer la file d'attente du laboratoire et traiter les prescriptions

### Epic 3: Administration et Supervision
Permettre aux administrateurs de gérer et corriger les prescriptions en cas d'erreur

---

## Epic 1: Gestion des Prescriptions par les Médecins

### Story: US-001 - Création d'une Prescription Médicale

**As a** Médecin (DOCTOR)
**I want** créer une nouvelle prescription pour un patient
**So that** je puisse prescrire les analyses de laboratoire nécessaires après une consultation

**Acceptance Criteria** (EARS format):

- **WHEN** je suis connecté en tant que médecin **THEN** j'ai accès au formulaire de création de prescription
- **WHEN** je sélectionne un patient existant **THEN** ses informations (nom, prénom, date de naissance) sont affichées pour confirmation
- **WHEN** je saisis le texte de la prescription (analyses demandées) **THEN** le champ accepte du texte libre avec validation de longueur
- **WHEN** je soumets le formulaire avec tous les champs valides **THEN** la prescription est créée avec le statut CREATED
- **WHEN** la prescription est créée **THEN** je suis automatiquement enregistré comme le médecin prescripteur
- **WHEN** la prescription est créée **THEN** je reçois un message de confirmation "Prescription créée avec succès"
- **WHEN** la prescription est créée **THEN** elle apparaît dans ma liste de prescriptions
- **IF** le patient n'existe pas **THEN** je reçois un message d'erreur "Patient introuvable"
- **IF** le texte de prescription est vide **THEN** je reçois un message d'erreur "Le texte de la prescription est obligatoire"
- **FOR** chaque prescription créée **VERIFY** qu'un ID unique (UUID) est généré
- **FOR** chaque prescription créée **VERIFY** que les dates de création et mise à jour sont enregistrées

**Technical Notes**:
- Endpoint: `POST /api/prescriptions`
- DTO: CreatePrescriptionDto { text: string, patientId: string }
- Le doctorId est extrait de la session (userId)
- Validation avec class-validator
- Réponse: `{ data: Prescription, message: 'Prescription créée avec succès' }`

**Dependencies**:
- Module Patients: le patient doit exister
- Module Auth: l'utilisateur doit être authentifié avec rôle DOCTOR

**Story Points**: 5
**Priority**: HIGH

---

### Story: US-002 - Consultation de Mes Prescriptions

**As a** Médecin (DOCTOR)
**I want** consulter la liste de toutes les prescriptions que j'ai créées
**So that** je puisse suivre l'avancement des analyses de mes patients

**Acceptance Criteria** (EARS format):

- **WHEN** j'accède à la liste des prescriptions **THEN** je vois toutes les prescriptions avec leurs statuts
- **WHEN** je consulte la liste **THEN** les prescriptions sont triées par date (plus récentes en premier)
- **WHEN** je consulte une prescription **THEN** je vois les informations patient (nom, prénom, date de naissance)
- **WHEN** je consulte une prescription **THEN** je vois le statut actuel (CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED)
- **WHEN** je filtre par patient **THEN** seules les prescriptions de ce patient sont affichées
- **WHEN** je filtre par statut **THEN** seules les prescriptions avec ce statut sont affichées
- **WHEN** je clique sur une prescription **THEN** je vois les détails complets (texte, dates, patient, statut)
- **IF** je n'ai créé aucune prescription **THEN** je vois un message "Aucune prescription trouvée"
- **FOR** chaque prescription affichée **VERIFY** que le médecin associé est bien moi
- **FOR** chaque prescription **VERIFY** que les données patient sont complètes et correctes

**Technical Notes**:
- Endpoint: `GET /api/prescriptions?doctorId={userId}`
- Endpoint: `GET /api/prescriptions/:id`
- Filtres optionnels: doctorId, patientId, status
- Include patient et doctor dans la réponse
- Pas de pagination pour MVP (liste complète)

**Dependencies**:
- Module Auth: authentification requise

**Story Points**: 3
**Priority**: HIGH

---

### Story: US-003 - Envoi d'une Prescription au Laboratoire

**As a** Médecin (DOCTOR)
**I want** envoyer une prescription au laboratoire
**So that** les biologistes puissent commencer les analyses demandées

**Acceptance Criteria** (EARS format):

- **WHEN** je consulte une prescription avec statut CREATED **THEN** je vois un bouton "Envoyer au laboratoire"
- **WHEN** je clique sur "Envoyer au laboratoire" **THEN** je reçois une demande de confirmation
- **WHEN** je confirme l'envoi **THEN** le statut de la prescription passe à SENT_TO_LAB
- **WHEN** le statut passe à SENT_TO_LAB **THEN** je reçois un message "Prescription envoyée au laboratoire"
- **WHEN** une prescription est au statut SENT_TO_LAB **THEN** le bouton "Envoyer au laboratoire" n'est plus visible
- **IF** la prescription n'est pas au statut CREATED **THEN** l'action est bloquée avec un message d'erreur
- **IF** je ne suis pas le médecin créateur **THEN** l'action est bloquée (sauf si admin)
- **FOR** chaque envoi **VERIFY** que la date de mise à jour est enregistrée
- **FOR** chaque envoi **VERIFY** que la transition de statut est irréversible

**Technical Notes**:
- Endpoint: `PATCH /api/prescriptions/:id`
- Body: `{ status: 'SENT_TO_LAB' }`
- Validation: statut actuel doit être CREATED
- Guard: AuthGuard + RolesGuard (DOCTOR, ADMIN)
- Frontend: bouton conditionnel selon statut

**Dependencies**:
- US-001: prescription doit exister

**Story Points**: 3
**Priority**: HIGH

---

## Epic 2: Traitement des Prescriptions par les Biologistes

### Story: US-004 - Vue File d'Attente du Laboratoire

**As a** Biologiste (BIOLOGIST)
**I want** voir toutes les prescriptions envoyées au laboratoire
**So that** je puisse organiser mon travail et traiter les analyses en attente

**Acceptance Criteria** (EARS format):

- **WHEN** je suis connecté en tant que biologiste **THEN** j'accède à la vue "Laboratoire"
- **WHEN** j'accède à la vue Laboratoire **THEN** je vois toutes les prescriptions avec statut SENT_TO_LAB et IN_PROGRESS
- **WHEN** je consulte la liste **THEN** les prescriptions SENT_TO_LAB apparaissent en priorité
- **WHEN** je consulte une prescription **THEN** je vois le médecin prescripteur et les informations patient
- **WHEN** je consulte une prescription **THEN** je vois le texte complet des analyses demandées
- **WHEN** je filtre par statut SENT_TO_LAB **THEN** je vois uniquement les prescriptions en attente de traitement
- **WHEN** je filtre par statut IN_PROGRESS **THEN** je vois uniquement les prescriptions en cours d'analyse
- **IF** aucune prescription n'est en attente **THEN** je vois un message "Aucune prescription en attente"
- **FOR** chaque prescription **VERIFY** que les informations patient et médecin sont affichées clairement
- **FOR** la liste **VERIFY** que l'ordre chronologique est respecté

**Technical Notes**:
- Endpoint: `GET /api/prescriptions?status=SENT_TO_LAB`
- Endpoint: `GET /api/prescriptions?status=IN_PROGRESS`
- Frontend: onglets ou filtres pour séparer les statuts
- Badges de couleur pour différencier les statuts

**Dependencies**:
- US-003: prescriptions doivent être envoyées au laboratoire

**Story Points**: 3
**Priority**: HIGH

---

### Story: US-005 - Mise en Cours de Traitement

**As a** Biologiste (BIOLOGIST)
**I want** marquer une prescription comme étant en cours d'analyse
**So that** je puisse indiquer que j'ai commencé à travailler dessus

**Acceptance Criteria** (EARS format):

- **WHEN** je consulte une prescription avec statut SENT_TO_LAB **THEN** je vois un bouton "Commencer l'analyse"
- **WHEN** je clique sur "Commencer l'analyse" **THEN** le statut passe à IN_PROGRESS
- **WHEN** le statut passe à IN_PROGRESS **THEN** je reçois un message "Analyse en cours"
- **WHEN** une prescription est IN_PROGRESS **THEN** elle disparaît de la file d'attente (SENT_TO_LAB)
- **WHEN** une prescription est IN_PROGRESS **THEN** elle apparaît dans ma liste "En cours"
- **IF** la prescription n'est pas au statut SENT_TO_LAB **THEN** l'action est bloquée
- **IF** je ne suis pas biologiste ou admin **THEN** l'action est refusée
- **FOR** chaque mise en cours **VERIFY** que la date de mise à jour est enregistrée
- **FOR** chaque mise en cours **VERIFY** que la transition est irréversible

**Technical Notes**:
- Endpoint: `PATCH /api/prescriptions/:id`
- Body: `{ status: 'IN_PROGRESS' }`
- Validation: statut actuel doit être SENT_TO_LAB
- Guard: AuthGuard + RolesGuard (BIOLOGIST, ADMIN)

**Dependencies**:
- US-003: prescription doit être envoyée au laboratoire

**Story Points**: 3
**Priority**: HIGH

---

### Story: US-006 - Finalisation de l'Analyse

**As a** Biologiste (BIOLOGIST)
**I want** marquer une prescription comme terminée
**So that** je puisse indiquer que les résultats sont prêts

**Acceptance Criteria** (EARS format):

- **WHEN** je consulte une prescription avec statut IN_PROGRESS **THEN** je vois un bouton "Terminer l'analyse"
- **WHEN** je clique sur "Terminer l'analyse" **THEN** le statut passe à COMPLETED
- **WHEN** le statut passe à COMPLETED **THEN** je reçois un message "Analyse terminée"
- **WHEN** une prescription est COMPLETED **THEN** elle disparaît de ma liste "En cours"
- **WHEN** une prescription est COMPLETED **THEN** elle apparaît dans la liste "Terminées"
- **WHEN** une prescription est COMPLETED **THEN** un résultat peut y être attaché (préparation Jour 5)
- **IF** la prescription n'est pas au statut IN_PROGRESS **THEN** l'action est bloquée
- **IF** je ne suis pas biologiste ou admin **THEN** l'action est refusée
- **FOR** chaque finalisation **VERIFY** que la date de mise à jour est enregistrée
- **FOR** chaque finalisation **VERIFY** que la transition est irréversible

**Technical Notes**:
- Endpoint: `PATCH /api/prescriptions/:id`
- Body: `{ status: 'COMPLETED' }`
- Validation: statut actuel doit être IN_PROGRESS
- Guard: AuthGuard + RolesGuard (BIOLOGIST, ADMIN)
- Cette action prépare l'ajout de Result (Jour 5)

**Dependencies**:
- US-005: prescription doit être en cours

**Story Points**: 3
**Priority**: HIGH

---

## Epic 3: Administration et Supervision

### Story: US-007 - Vue Globale pour Administrateurs

**As a** Administrateur (ADMIN)
**I want** voir toutes les prescriptions du système sans filtrage
**So that** je puisse superviser l'ensemble du workflow et identifier les problèmes

**Acceptance Criteria** (EARS format):

- **WHEN** je suis connecté en tant qu'admin **THEN** j'accède à la vue complète des prescriptions
- **WHEN** je consulte la liste **THEN** je vois TOUTES les prescriptions de tous les médecins
- **WHEN** je consulte la liste **THEN** je peux filtrer par médecin, patient ou statut
- **WHEN** je consulte une prescription **THEN** je vois tous les détails (médecin, patient, statut, dates, texte)
- **WHEN** je filtre par statut **THEN** je peux voir les prescriptions de tous les statuts
- **WHEN** je recherche par patient **THEN** je vois toutes les prescriptions de ce patient (tous médecins)
- **IF** aucune prescription n'existe **THEN** je vois un message "Aucune prescription dans le système"
- **FOR** chaque prescription **VERIFY** que toutes les informations sont visibles
- **FOR** la liste complète **VERIFY** que les performances restent acceptables (< 300ms)

**Technical Notes**:
- Endpoint: `GET /api/prescriptions` (sans filtre doctorId)
- Guard: AuthGuard uniquement (tous les rôles peuvent consulter)
- Frontend: affichage conditionnel selon rôle
- Pagination future si volume > 1000 prescriptions

**Dependencies**:
- Module Auth: authentification requise

**Story Points**: 2
**Priority**: MEDIUM

---

### Story: US-008 - Gestion et Correction des Prescriptions

**As a** Administrateur (ADMIN)
**I want** modifier ou supprimer des prescriptions
**So that** je puisse corriger les erreurs et maintenir l'intégrité des données

**Acceptance Criteria** (EARS format):

- **WHEN** je consulte une prescription en tant qu'admin **THEN** je vois des options "Modifier" et "Supprimer"
- **WHEN** je clique sur "Modifier" **THEN** j'accède à un formulaire de modification
- **WHEN** je modifie le texte de la prescription **THEN** la modification est enregistrée
- **WHEN** je modifie le statut **THEN** je peux choisir n'importe quel statut (override des règles)
- **WHEN** je sauvegarde une modification **THEN** je reçois un message "Prescription modifiée avec succès"
- **WHEN** je clique sur "Supprimer" **THEN** je reçois une demande de confirmation
- **WHEN** je confirme la suppression **THEN** la prescription est supprimée définitivement
- **WHEN** une prescription est supprimée **THEN** je reçois un message "Prescription supprimée avec succès"
- **IF** je ne suis pas admin **THEN** ces options ne sont pas visibles
- **IF** une prescription a un résultat associé **THEN** la suppression supprime aussi le résultat (cascade)
- **FOR** chaque modification **VERIFY** que la date de mise à jour est modifiée
- **FOR** chaque suppression **VERIFY** que l'opération est irréversible

**Technical Notes**:
- Endpoint: `PATCH /api/prescriptions/:id` (admin peut tout modifier)
- Endpoint: `DELETE /api/prescriptions/:id`
- DTO: UpdatePrescriptionDto { text?, status?, patientId?, doctorId? }
- Guard: AuthGuard + RolesGuard (ADMIN uniquement)
- Cascade delete géré par Prisma
- Frontend: confirmation dialog pour suppression

**Dependencies**:
- Toutes les autres user stories (gestion globale)

**Story Points**: 5
**Priority**: LOW (correction d'erreurs uniquement)

---

## Story: US-009 - Vue en Lecture Seule pour Secrétaires

**As a** Secrétaire (SECRETARY)
**I want** consulter les prescriptions
**So that** je puisse répondre aux questions des patients sur le statut de leurs analyses

**Acceptance Criteria** (EARS format):

- **WHEN** je suis connecté en tant que secrétaire **THEN** j'ai accès à la liste des prescriptions
- **WHEN** je consulte la liste **THEN** je vois toutes les prescriptions avec leurs statuts
- **WHEN** je consulte une prescription **THEN** je vois les informations patient, médecin et statut
- **WHEN** j'essaie de créer une prescription **THEN** l'option n'est pas disponible
- **WHEN** j'essaie de modifier une prescription **THEN** l'option n'est pas disponible
- **WHEN** je filtre par patient **THEN** je peux voir toutes les prescriptions d'un patient
- **IF** je tente d'accéder à un endpoint de modification **THEN** je reçois une erreur 403 Forbidden
- **FOR** chaque prescription **VERIFY** que je peux voir le statut actuel
- **FOR** l'interface **VERIFY** qu'aucun bouton d'action n'est affiché

**Technical Notes**:
- Endpoint: `GET /api/prescriptions` (lecture seule)
- Endpoint: `GET /api/prescriptions/:id` (lecture seule)
- Guard: AuthGuard uniquement (authentification suffisante)
- Frontend: affichage conditionnel, pas de boutons d'action
- Rôle principalement informatif

**Dependencies**:
- Module Auth: authentification requise

**Story Points**: 2
**Priority**: LOW

---

## User Story Mapping

### Phase 1: Core Functionality (Sprint 1 - Jour 4 Matin)
- US-001: Création de prescription (DOCTOR)
- US-002: Consultation de prescriptions (DOCTOR)
- US-003: Envoi au laboratoire (DOCTOR)

**Valeur métier**: Médecins peuvent prescrire et envoyer au laboratoire
**Estimation totale**: 11 points

### Phase 2: Laboratory Workflow (Sprint 2 - Jour 4 Après-midi)
- US-004: Vue file d'attente (BIOLOGIST)
- US-005: Mise en cours (BIOLOGIST)
- US-006: Finalisation (BIOLOGIST)

**Valeur métier**: Biologistes peuvent traiter les prescriptions
**Estimation totale**: 9 points

### Phase 3: Administration & Support (Sprint 3 - Si temps restant)
- US-007: Vue globale (ADMIN)
- US-008: Gestion et correction (ADMIN)
- US-009: Vue lecture seule (SECRETARY)

**Valeur métier**: Administration et support des utilisateurs
**Estimation totale**: 9 points

---

## Acceptance Criteria Templates

### Template pour Actions de Modification de Statut
```
- WHEN utilisateur avec rôle approprié modifie le statut
  THEN la transition est validée selon les règles métier
- IF statut actuel ne permet pas la transition
  THEN erreur 400 Bad Request avec message explicite
- FOR chaque transition
  VERIFY que updatedAt est mis à jour automatiquement
```

### Template pour Validation de Permissions
```
- WHEN utilisateur avec rôle autorisé effectue l'action
  THEN l'action est exécutée avec succès
- IF utilisateur n'a pas le rôle requis
  THEN erreur 403 Forbidden "Vous n'avez pas les permissions nécessaires"
- FOR chaque endpoint protégé
  VERIFY que AuthGuard et RolesGuard sont appliqués
```

### Template pour Validation de Données
```
- WHEN données valides sont soumises
  THEN l'entité est créée/modifiée avec succès
- IF données invalides sont soumises
  THEN erreur 400 Bad Request avec détails de validation
- FOR chaque champ requis
  VERIFY que la validation class-validator fonctionne
```

---

## Estimation et Priorisation

### Résumé des Story Points

| Epic | Stories | Points | Priority |
|------|---------|--------|----------|
| Epic 1: Médecins | US-001, US-002, US-003 | 11 | HIGH |
| Epic 2: Biologistes | US-004, US-005, US-006 | 9 | HIGH |
| Epic 3: Admin | US-007, US-008, US-009 | 9 | MEDIUM/LOW |
| **TOTAL** | **9 stories** | **29 points** | - |

### Recommandation d'Implémentation

**Jour 4 - Matin (4h)**
1. US-001 (5 points) - Création prescription
2. US-002 (3 points) - Consultation
3. US-003 (3 points) - Envoi au laboratoire

**Jour 4 - Après-midi (4h)**
4. US-004 (3 points) - Vue biologiste
5. US-005 (3 points) - Mise en cours
6. US-006 (3 points) - Finalisation

**Optionnel si temps restant**
7. US-007 (2 points) - Vue admin
8. US-009 (2 points) - Vue secrétaire
9. US-008 (5 points) - Gestion admin (si nécessaire)

---

## Définition de Done (DoD)

Pour qu'une user story soit considérée comme terminée:

### Backend
- [ ] Endpoint(s) implémenté(s) dans PrescriptionsController
- [ ] Logique métier dans PrescriptionsService
- [ ] DTOs créés avec validation class-validator
- [ ] Guards appliqués correctement (AuthGuard, RolesGuard)
- [ ] Gestion d'erreurs avec messages en français
- [ ] Format de réponse standardisé { data, message? }
- [ ] Testé manuellement avec Postman/curl

### Frontend
- [ ] Interface utilisateur créée avec Material-UI
- [ ] Intégration avec API backend
- [ ] Affichage conditionnel selon rôle utilisateur
- [ ] Messages de confirmation/erreur affichés
- [ ] Navigation fonctionnelle
- [ ] Testé manuellement dans le navigateur

### Documentation
- [ ] Code commenté si logique complexe
- [ ] Endpoints documentés (si API.md existe)
- [ ] Pas d'erreurs TypeScript
- [ ] Code suit les conventions du projet

### Validation
- [ ] Tous les critères d'acceptance validés
- [ ] Transitions de statut testées
- [ ] Permissions par rôle testées
- [ ] Validation des données testée
- [ ] Pas de régression sur modules existants

---

## Notes pour l'Implémentation

### Patterns à Réutiliser
Suivre les patterns établis dans le module Appointments:
- Structure de module NestJS (module, controller, service)
- DTOs avec class-validator
- Guards pour authentification et permissions
- Gestion d'erreurs avec exceptions NestJS
- Format de réponse standardisé
- Include des relations Prisma

### Points d'Attention
1. **Validation des transitions de statut**: créer une méthode utilitaire pour valider les transitions autorisées
2. **Performance**: utiliser les index Prisma sur patientId, doctorId, status
3. **Sécurité**: ne jamais exposer les mots de passe dans les réponses (select explicite)
4. **UX**: badges colorés pour différencier visuellement les statuts
5. **Messages**: tous les messages en français pour cohérence

### Dépendances Frontend
- Material-UI: Table, Button, Chip (badges), Dialog, TextField, Select
- React Router: pour navigation entre vues
- AuthContext: pour récupérer le rôle utilisateur
- Axios: pour appels API avec withCredentials: true

---

**Document généré le**: 2026-01-03
**Total User Stories**: 9
**Total Story Points**: 29
**Prochaine étape**: API Requirements Specification

