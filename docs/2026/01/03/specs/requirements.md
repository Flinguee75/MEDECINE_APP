# Spécifications des Exigences - Module Prescriptions (Jour 4)

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions
- **Version**: 1.0
- **Date**: 2026-01-03
- **Auteur**: Requirements Analysis Specialist
- **Statut**: Draft for Review

## Résumé Exécutif

Le module Prescriptions est le composant central du workflow médical du système hospitalier. Il permet aux médecins de créer des prescriptions d'analyses médicales pour leurs patients, aux biologistes de traiter ces prescriptions au laboratoire, et à tous les acteurs concernés de suivre le cycle de vie complet d'une prescription depuis sa création jusqu'à l'obtention des résultats.

Ce module s'intègre étroitement avec les modules Patients et Appointments existants et prépare le terrain pour le module Results (Jour 5).

## Parties Prenantes

### Utilisateurs Primaires

#### 1. Médecins (DOCTOR)
- **Besoins**: Créer des prescriptions après une consultation, spécifier les analyses requises, suivre le statut des prescriptions, consulter l'historique des prescriptions par patient
- **Objectifs métier**: Prescrire des analyses médicales efficacement, suivre l'avancement des résultats
- **Fréquence d'utilisation**: Quotidienne, 10-30 prescriptions/jour

#### 2. Biologistes (BIOLOGIST)
- **Besoins**: Recevoir les prescriptions envoyées au laboratoire, mettre à jour le statut des prescriptions en cours de traitement, marquer les prescriptions comme terminées
- **Objectifs métier**: Gérer la file d'attente du laboratoire, suivre l'avancement des analyses
- **Fréquence d'utilisation**: Quotidienne, 20-50 prescriptions/jour

#### 3. Secrétaires (SECRETARY)
- **Besoins**: Consulter les prescriptions pour information, aider les patients à comprendre le statut
- **Objectifs métier**: Support administratif et informationnel
- **Fréquence d'utilisation**: Occasionnelle, consultation uniquement

### Utilisateurs Secondaires

#### 4. Administrateurs (ADMIN)
- **Besoins**: Accès complet à toutes les prescriptions, capacité de correction en cas d'erreur
- **Objectifs métier**: Gestion et supervision du système
- **Fréquence d'utilisation**: Occasionnelle, pour administration et correction

## Exigences Fonctionnelles

### FR-001: Création de Prescription
**Description**: Un médecin peut créer une nouvelle prescription pour un patient existant
**Priority**: HIGH
**Acceptance Criteria**:
- [x] Le médecin doit être authentifié avec le rôle DOCTOR
- [x] La prescription doit être associée à un patient existant dans le système
- [x] La prescription doit contenir un texte descriptif (analyses demandées)
- [x] La prescription est créée avec le statut CREATED par défaut
- [x] Le médecin créateur est automatiquement associé à la prescription
- [x] Les dates de création et mise à jour sont enregistrées automatiquement
- [x] Un ID unique (UUID) est généré pour chaque prescription

**Business Rules**:
- Le patient doit exister dans la base de données
- Le texte de prescription ne peut pas être vide
- Le texte peut contenir jusqu'à plusieurs milliers de caractères (type TEXT)

### FR-002: Consultation des Prescriptions
**Description**: Les utilisateurs peuvent consulter la liste des prescriptions selon leurs permissions
**Priority**: HIGH
**Acceptance Criteria**:
- [x] Tous les utilisateurs authentifiés peuvent consulter les prescriptions
- [x] Les prescriptions sont triées par date de création (plus récentes en premier)
- [x] Les informations patient et médecin sont incluses dans chaque prescription
- [x] Le statut actuel de chaque prescription est visible
- [x] Les détails complets d'une prescription sont accessibles par ID

**Business Rules**:
- Les données patient retournées incluent: id, firstName, lastName, birthDate
- Les données médecin retournées incluent: id, name, email (pas de mot de passe)
- Les mots de passe ne sont jamais exposés dans les réponses API

### FR-003: Filtrage des Prescriptions
**Description**: Les utilisateurs peuvent filtrer les prescriptions selon plusieurs critères
**Priority**: MEDIUM
**Acceptance Criteria**:
- [x] Filtrage par ID de patient
- [x] Filtrage par ID de médecin
- [x] Filtrage par statut (CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED)
- [x] Les filtres peuvent être combinés
- [x] Les résultats filtrés respectent l'ordre chronologique inversé

**Business Rules**:
- Les filtres sont optionnels (query parameters)
- Si aucun filtre n'est spécifié, toutes les prescriptions sont retournées
- Les valeurs de filtre invalides sont ignorées ou retournent une erreur appropriée

### FR-004: Envoi au Laboratoire
**Description**: Un médecin peut envoyer une prescription au laboratoire
**Priority**: HIGH
**Acceptance Criteria**:
- [x] Seul un médecin (DOCTOR) ou admin (ADMIN) peut effectuer cette action
- [x] La prescription doit être au statut CREATED
- [x] Le statut passe à SENT_TO_LAB après l'action
- [x] Un message de confirmation est retourné
- [x] La date de mise à jour est automatiquement enregistrée

**Business Rules**:
- Transition autorisée: CREATED → SENT_TO_LAB uniquement
- Une fois envoyée, la prescription ne peut pas revenir au statut CREATED
- Seul le médecin créateur ou un admin peut envoyer au laboratoire

### FR-005: Mise en Cours de Traitement
**Description**: Un biologiste peut marquer une prescription comme étant en cours d'analyse
**Priority**: HIGH
**Acceptance Criteria**:
- [x] Seul un biologiste (BIOLOGIST) ou admin (ADMIN) peut effectuer cette action
- [x] La prescription doit être au statut SENT_TO_LAB
- [x] Le statut passe à IN_PROGRESS après l'action
- [x] Un message de confirmation est retourné
- [x] La date de mise à jour est automatiquement enregistrée

**Business Rules**:
- Transition autorisée: SENT_TO_LAB → IN_PROGRESS uniquement
- Cette action indique que le biologiste a commencé l'analyse
- Une prescription IN_PROGRESS ne peut pas revenir à SENT_TO_LAB

### FR-006: Finalisation de Prescription
**Description**: Un biologiste peut marquer une prescription comme terminée
**Priority**: HIGH
**Acceptance Criteria**:
- [x] Seul un biologiste (BIOLOGIST) ou admin (ADMIN) peut effectuer cette action
- [x] La prescription doit être au statut IN_PROGRESS
- [x] Le statut passe à COMPLETED après l'action
- [x] Un message de confirmation est retourné
- [x] La date de mise à jour est automatiquement enregistrée

**Business Rules**:
- Transition autorisée: IN_PROGRESS → COMPLETED uniquement
- Une prescription COMPLETED indique que les résultats sont prêts
- Cette action prépare l'ajout d'un Result (Jour 5)

### FR-007: Modification de Prescription (ADMIN uniquement)
**Description**: Un administrateur peut modifier les détails d'une prescription en cas d'erreur
**Priority**: LOW
**Acceptance Criteria**:
- [x] Seul un admin (ADMIN) peut modifier une prescription
- [x] Le texte de la prescription peut être modifié
- [x] Le statut peut être modifié (pour correction d'erreurs)
- [x] Les associations patient/médecin peuvent être modifiées
- [x] La date de mise à jour est automatiquement enregistrée

**Business Rules**:
- Cette fonction est pour correction d'erreurs uniquement
- Les médecins ne peuvent pas modifier leurs propres prescriptions après création
- Les biologistes ne peuvent modifier que le statut (via transitions)

### FR-008: Suppression de Prescription (ADMIN uniquement)
**Description**: Un administrateur peut supprimer une prescription en cas d'erreur grave
**Priority**: LOW
**Acceptance Criteria**:
- [x] Seul un admin (ADMIN) peut supprimer une prescription
- [x] La suppression est physique (suppression de la base de données)
- [x] Grâce au cascade, les résultats associés sont supprimés automatiquement
- [x] Un message de confirmation est retourné

**Business Rules**:
- Cette fonction est pour correction d'erreurs graves uniquement
- La suppression est définitive et irréversible
- Utiliser avec précaution dans un environnement de production

## Exigences Non-Fonctionnelles

### NFR-001: Performance
**Description**: Temps de réponse et capacité de traitement
**Metrics**:
- Temps de réponse API < 200ms pour 95% des requêtes
- Liste de prescriptions avec filtres < 300ms
- Création de prescription < 150ms
- Mise à jour de statut < 100ms
- Capacité de gérer 100+ prescriptions créées par jour

### NFR-002: Sécurité
**Description**: Protection des données médicales sensibles
**Requirements**:
- Authentification obligatoire via session pour tous les endpoints
- Contrôle d'accès basé sur les rôles (RBAC)
- Les mots de passe des utilisateurs ne sont jamais exposés dans les réponses
- Session-based authentication avec cookies httpOnly
- Validation stricte des entrées avec class-validator
- Protection contre les injections SQL via Prisma ORM

### NFR-003: Intégrité des Données
**Description**: Garantir la cohérence et la validité des données
**Requirements**:
- Les IDs utilisent des UUIDs (pas d'auto-increment)
- Cascade delete activé: si un patient est supprimé, ses prescriptions sont supprimées
- Cascade delete activé: si un médecin est supprimé, ses prescriptions sont supprimées
- Contraintes de clés étrangères sur patientId et doctorId
- Index sur patientId, doctorId, status pour performance des requêtes filtrées
- Validation du statut via enum PrescriptionStatus

### NFR-004: Maintenabilité
**Description**: Code facile à maintenir et à étendre
**Requirements**:
- Architecture modulaire NestJS (PrescriptionsModule)
- Séparation des responsabilités: Controller (routes) / Service (logique métier)
- DTOs pour validation des entrées
- Gestion centralisée des erreurs avec exceptions NestJS
- Code TypeScript avec typage strict
- Réutilisation des patterns existants (Appointments, Patients)

### NFR-005: Utilisabilité (Frontend)
**Description**: Interface intuitive pour les utilisateurs
**Requirements**:
- Affichage conditionnel selon le rôle de l'utilisateur
- Messages de confirmation clairs pour chaque action
- Messages d'erreur descriptifs en français
- Filtres faciles à utiliser (dropdowns, autocomplete)
- Indicateurs visuels de statut (badges colorés)
- Design cohérent avec Material-UI

### NFR-006: Compatibilité
**Description**: Intégration avec l'écosystème existant
**Requirements**:
- Compatible avec Prisma ORM v6.x (pas v7+)
- PostgreSQL comme base de données
- Session-based authentication (pas JWT)
- Format de réponse API standardisé: `{ data: ..., message?: '...' }`
- CORS configuré pour frontend sur http://localhost:5173
- Credentials: true pour support des cookies de session

### NFR-007: Testabilité
**Description**: Code facile à tester
**Requirements**:
- Services injectables avec dépendances mockables
- PrismaService injectable pour tests unitaires
- DTOs validables indépendamment
- Guards testables séparément
- Pas de logique métier dans les controllers

## Contraintes Techniques

### Contraintes de Stack
- **Backend**: NestJS (framework imposé)
- **ORM**: Prisma v6.x (éviter v7+ pour compatibilité migrations)
- **Base de données**: PostgreSQL
- **Validation**: class-validator et class-transformer
- **Authentication**: express-session (pas JWT)
- **Frontend**: React + TypeScript + Material-UI + Vite

### Contraintes d'Architecture
- Architecture monorepo (backend et frontend dans le même repo)
- Module NestJS autonome avec service et controller
- Réutilisation de PrismaModule global
- Réutilisation de AuthGuard et RolesGuard existants
- Pas de modification du schéma Prisma (déjà défini)

### Contraintes de Temps
- Développement sur 1 journée (Jour 4 du MVP)
- Priorité aux fonctionnalités essentielles
- Pas de fonctionnalités avancées (export, notifications, etc.)

### Contraintes de Scope MVP
- Desktop uniquement (min-width: 1024px, pas de responsive mobile)
- Pas de WebSocket ou temps réel
- Pas de gestion de fichiers/documents attachés
- Pas d'envoi d'emails
- Pas de calendrier avancé
- Pas d'export de données
- Pas de fonctionnalité d'impression
- Pas de GDPR compliance avancée
- Pas de 2FA ou reset password

## Dépendances

### Dépendances avec Modules Existants

#### Module Patients (Jour 2)
- **Relation**: Chaque prescription est associée à un patient
- **Contrainte**: Le patient doit exister avant création de prescription
- **API**: Utilise la table `patients` pour validation et récupération des données

#### Module Users (Jour 1 - Auth)
- **Relation**: Chaque prescription est associée à un médecin (User avec role DOCTOR)
- **Contrainte**: Le médecin doit exister et avoir le rôle DOCTOR
- **API**: Utilise la table `users` pour validation et récupération des données

#### Module Appointments (Jour 3)
- **Relation**: Les prescriptions sont généralement créées suite à un rendez-vous
- **Workflow**: Appointment (COMPLETED) → Prescription (CREATED)
- **Note**: Pas de contrainte technique, mais workflow métier logique

#### Module Auth (Jour 1)
- **Dépendance**: AuthGuard pour vérifier l'authentification
- **Dépendance**: RolesGuard pour vérifier les permissions
- **Dépendance**: Session management pour identifier l'utilisateur

### Dépendances avec Modules Futurs

#### Module Results (Jour 5 - À venir)
- **Préparation**: Le statut COMPLETED indique qu'un résultat peut être ajouté
- **Relation**: One-to-one entre Prescription et Result
- **Champ**: `result Result?` déjà défini dans le schéma Prisma

## Hypothèses

### Hypothèses Techniques
1. La base de données PostgreSQL est déjà configurée et accessible
2. Les tables `users`, `patients` sont déjà créées et peuplées
3. Le système de session fonctionne correctement
4. Les Guards (AuthGuard, RolesGuard) fonctionnent comme attendu
5. Prisma Client est généré et à jour

### Hypothèses Métier
1. Un médecin peut créer plusieurs prescriptions pour le même patient
2. Une prescription ne peut être créée que par un médecin
3. Les transitions de statut sont unidirectionnelles (pas de retour en arrière)
4. Les biologistes traitent les prescriptions dans l'ordre d'arrivée
5. Le texte de prescription est en format libre (pas de standardisation)
6. Une prescription sans résultat est valide (résultats ajoutés Jour 5)

### Hypothèses Utilisateur
1. Les médecins connaissent les IDs des patients (via sélection frontend)
2. Les biologistes comprennent le workflow de statuts
3. Les utilisateurs ont accès à un navigateur desktop moderne
4. Les utilisateurs parlent français (messages en français)

## Hors Scope (Out of Scope)

### Fonctionnalités Non Incluses
- Template de prescriptions prédéfinis
- Catalogue d'analyses médicales standardisé
- Tarification des analyses
- Gestion de stock de réactifs/équipements
- Planning du laboratoire
- Affectation automatique aux biologistes
- Notifications push ou email
- Historique de modifications (audit trail)
- Commentaires ou notes sur prescriptions
- Pièces jointes ou documents scannés
- Signature électronique
- Validation par un superviseur
- Statistiques et rapports avancés
- Export PDF ou CSV
- Impression directe
- Intégration avec systèmes externes (laboratoires tiers)
- Support multilingue
- Mode hors-ligne
- Application mobile

### Optimisations Non Prioritaires
- Cache Redis pour sessions
- Cache de requêtes fréquentes
- Pagination côté serveur (liste complète pour MVP)
- Rate limiting API
- Compression de réponses
- CDN pour assets
- Monitoring APM
- Logging structuré avancé

## Critères de Succès

### Critères Fonctionnels
- [x] Un médecin peut créer une prescription pour un patient
- [x] Un médecin peut envoyer une prescription au laboratoire
- [x] Un biologiste peut voir les prescriptions à traiter
- [x] Un biologiste peut mettre à jour le statut des prescriptions
- [x] Tous les utilisateurs peuvent consulter les prescriptions
- [x] Les filtres fonctionnent correctement (patient, médecin, statut)
- [x] Les transitions de statut sont validées et respectées
- [x] Les permissions par rôle sont appliquées

### Critères Techniques
- [x] Tous les endpoints retournent le format standardisé
- [x] Les erreurs sont gérées avec messages en français
- [x] Les Guards protègent correctement les routes
- [x] Les DTOs valident correctement les entrées
- [x] Le code suit les patterns NestJS établis
- [x] Le code est compatible avec le schéma Prisma existant

### Critères de Qualité
- [x] Code TypeScript sans erreurs de compilation
- [x] Respect des conventions de nommage du projet
- [x] Réutilisation maximale du code existant
- [x] Documentation inline pour fonctions complexes
- [x] Messages d'erreur clairs et actionnables

## Risques et Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Conflits de statut simultanés | Medium | Low | Transactions Prisma, validation stricte des transitions |
| Performance avec grand nombre de prescriptions | Medium | Medium | Indexation appropriée déjà en place, filtres optimisés |
| Confusion utilisateur sur workflow de statuts | High | Medium | UI claire avec badges colorés, messages explicites |
| Erreur de validation de rôles | High | Low | Réutilisation des Guards testés existants |
| Incompatibilité avec modules existants | High | Low | Suivre strictement les patterns établis |
| Données patient/médecin invalides | Medium | Medium | Validation stricte avec vérification d'existence |
| Schéma Prisma modifié accidentellement | High | Low | Pas de migration, utilisation du schéma existant |

## Standards de Qualité SMART

### Specific (Spécifique)
Chaque exigence définit clairement:
- Qui peut effectuer l'action (rôle)
- Quelle action est effectuée
- Sur quelle entité (prescription, statut)
- Avec quelles contraintes (statut actuel, validations)

### Measurable (Mesurable)
- Temps de réponse API: < 200ms (95e percentile)
- Capacité: 100+ prescriptions/jour
- Taux de succès des transitions de statut: 100%
- Couverture de code: suivre standards projet

### Achievable (Réalisable)
- Utilisation de patterns éprouvés (Appointments module)
- Schéma Prisma déjà défini et migré
- Guards et authentification déjà fonctionnels
- Stack technique maîtrisée
- Scope limité au MVP essentiel

### Relevant (Pertinent)
- Aligné avec workflow métier hospitalier
- Répond aux besoins des 3 rôles principaux
- Prépare le module Results (Jour 5)
- Essentiel pour le flux complet du système

### Time-bound (Temporellement défini)
- Développement: Jour 4 (1 journée)
- Intégration avec modules existants immédiate
- Tests et validation le même jour
- Déploiement avec l'ensemble du MVP (Jour 7)

## Traçabilité

### Mapping Exigences → User Stories
- FR-001 → US-001 (Création prescription par médecin)
- FR-002, FR-003 → US-002 (Consultation par médecin)
- FR-004 → US-003 (Envoi au laboratoire)
- FR-002, FR-003 → US-004 (Vue biologiste)
- FR-005 → US-005 (Mise en cours)
- FR-006 → US-006 (Finalisation)
- FR-002, FR-003 → US-007 (Vue admin)
- FR-007, FR-008 → US-008 (Gestion admin)

### Mapping Exigences → Composants Techniques
- FR-001, FR-004, FR-007 → PrescriptionsController.create(), update()
- FR-002, FR-003 → PrescriptionsController.findAll(), findOne()
- FR-005, FR-006 → PrescriptionsController.updateStatus()
- FR-008 → PrescriptionsController.remove()
- Tous → PrescriptionsService (logique métier)
- Tous → CreatePrescriptionDto, UpdatePrescriptionDto (validation)

## Glossaire

- **Prescription**: Document médical spécifiant les analyses de laboratoire demandées par un médecin
- **Statut**: État actuel dans le cycle de vie d'une prescription (CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED)
- **Transition de statut**: Passage d'un statut à un autre selon des règles définies
- **Cascade delete**: Suppression automatique des entités liées lors de la suppression d'une entité parente
- **UUID**: Identifiant unique universel (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **DTO**: Data Transfer Object, objet définissant la structure et validation des données
- **Guard**: Mécanisme de protection des routes dans NestJS
- **Session**: Mécanisme d'authentification stockant l'ID utilisateur côté serveur
- **RBAC**: Role-Based Access Control, contrôle d'accès basé sur les rôles

## Validation et Approbation

### Checklist de Complétude
- [x] Tous les types d'utilisateurs identifiés
- [x] Tous les scénarios d'usage couverts
- [x] Toutes les exigences fonctionnelles définies
- [x] Toutes les exigences non-fonctionnelles définies
- [x] Toutes les contraintes techniques documentées
- [x] Tous les risques identifiés avec mitigations
- [x] Toutes les dépendances documentées
- [x] Tous les critères de succès mesurables
- [x] Conformité SMART vérifiée
- [x] Traçabilité établie

### Prêt pour Phase Suivante
Ce document de requirements est prêt pour être utilisé par:
- **spec-architect**: Pour concevoir l'architecture technique détaillée
- **spec-planner**: Pour créer le plan de tâches et estimations
- **spec-developer**: Pour l'implémentation (avec architecture)

---

**Document généré le**: 2026-01-03
**Prochain jalon**: Architecture System Design (spec-architect)
**Contact**: Requirements Analysis Team
