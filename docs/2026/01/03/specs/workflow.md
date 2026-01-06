# Workflow et Règles Métier - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions - Business Workflow
- **Version**: 1.0
- **Date**: 2026-01-03
- **Scope**: Cycle de vie complet d'une prescription médicale

---

## Vue d'Ensemble du Workflow

### Objectif Métier
Gérer le cycle de vie complet d'une prescription médicale depuis la consultation médicale jusqu'à l'obtention des résultats d'analyses, en garantissant la traçabilité et le respect des processus hospitaliers.

### Acteurs Impliqués
1. **Médecin (DOCTOR)**: Crée et envoie les prescriptions
2. **Biologiste (BIOLOGIST)**: Traite les analyses au laboratoire
3. **Secrétaire (SECRETARY)**: Consulte pour information patient
4. **Administrateur (ADMIN)**: Supervise et corrige si nécessaire

### Workflow Principal
```
[Consultation] → [Prescription CREATED] → [SENT_TO_LAB] → [IN_PROGRESS] → [COMPLETED] → [Résultats Jour 5]
```

---

## Diagramme de Machine à États

### États (Status)

```
┌──────────┐
│ CREATED  │ ← État initial après création par le médecin
└─────┬────┘
      │
      │ Action: Médecin envoie au laboratoire
      ▼
┌──────────────┐
│ SENT_TO_LAB  │ ← Prescription en attente de traitement
└──────┬───────┘
       │
       │ Action: Biologiste commence l'analyse
       ▼
┌──────────────┐
│ IN_PROGRESS  │ ← Analyse en cours au laboratoire
└──────┬───────┘
       │
       │ Action: Biologiste termine l'analyse
       ▼
┌──────────┐
│COMPLETED │ ← Résultats prêts, peut recevoir un Result (Jour 5)
└──────────┘
```

### Transitions Autorisées

| État Actuel | État Suivant | Acteur Autorisé | Condition |
|-------------|--------------|-----------------|-----------|
| CREATED | SENT_TO_LAB | DOCTOR (créateur), ADMIN | Prescription validée |
| SENT_TO_LAB | IN_PROGRESS | BIOLOGIST, ADMIN | Biologiste prend en charge |
| IN_PROGRESS | COMPLETED | BIOLOGIST, ADMIN | Analyses terminées |
| * | * | ADMIN | Override complet (correction d'erreur) |

### Transitions Interdites (sauf ADMIN)

❌ **Retours en arrière**:
- SENT_TO_LAB → CREATED
- IN_PROGRESS → SENT_TO_LAB
- COMPLETED → IN_PROGRESS

❌ **Sauts d'étapes**:
- CREATED → IN_PROGRESS
- CREATED → COMPLETED
- SENT_TO_LAB → COMPLETED

**Rationale**: Garantir la traçabilité du processus et empêcher les modifications non autorisées.

---

## Workflow Détaillé par Acteur

### 1. Workflow Médecin (DOCTOR)

#### Phase 1: Après Consultation Patient

**Contexte**: Le médecin vient de terminer un rendez-vous avec un patient (Appointment status: COMPLETED)

**Actions**:
1. Accéder au dossier patient
2. Créer une nouvelle prescription
3. Saisir les analyses demandées (texte libre)
4. Sauvegarder → Status: CREATED

**Règles Métier**:
- ✅ Le patient doit exister dans le système
- ✅ Le médecin doit être authentifié avec rôle DOCTOR
- ✅ Le texte de prescription doit contenir au minimum 10 caractères
- ✅ Le médecin est automatiquement enregistré comme prescripteur (doctorId)
- ✅ La prescription est créée avec status CREATED

**Validation**:
```typescript
IF patient.exists() === false
  THEN throw Error("Patient introuvable")

IF text.length < 10
  THEN throw Error("Le texte de la prescription est trop court")

IF session.userId.role !== "DOCTOR" AND session.userId.role !== "ADMIN"
  THEN throw Error("Permissions insuffisantes")
```

**Résultat**:
- Prescription enregistrée dans la base de données
- ID unique (UUID) généré
- Dates createdAt et updatedAt enregistrées
- Message: "Prescription créée avec succès"

---

#### Phase 2: Envoi au Laboratoire

**Contexte**: Le médecin a créé la prescription et souhaite lancer les analyses

**Actions**:
1. Consulter la liste de ses prescriptions
2. Filtrer par status CREATED (optionnel)
3. Sélectionner la prescription à envoyer
4. Cliquer sur "Envoyer au laboratoire"
5. Confirmer l'action

**Règles Métier**:
- ✅ La prescription doit être au status CREATED
- ✅ Seul le médecin créateur ou un ADMIN peut envoyer
- ✅ La transition est irréversible (sauf ADMIN)
- ✅ La date updatedAt est mise à jour

**Validation**:
```typescript
IF prescription.status !== "CREATED"
  THEN throw Error("La prescription doit être au statut CREATED")

IF prescription.doctorId !== session.userId AND session.userId.role !== "ADMIN"
  THEN throw Error("Vous ne pouvez envoyer que vos propres prescriptions")
```

**Résultat**:
- Status passe à SENT_TO_LAB
- updatedAt mis à jour
- Message: "Prescription envoyée au laboratoire"
- La prescription apparaît maintenant dans la file d'attente du laboratoire

---

#### Phase 3: Suivi de Prescription

**Contexte**: Le médecin souhaite suivre l'avancement de ses prescriptions

**Actions**:
1. Accéder à la liste de ses prescriptions
2. Filtrer par patient ou par status
3. Consulter les détails d'une prescription

**Informations Visibles**:
- Texte de la prescription
- Patient concerné (nom, prénom, date de naissance)
- Status actuel (badge coloré)
- Dates de création et dernière modification
- Résultat (si status COMPLETED et Result existe - Jour 5)

**Règles Métier**:
- ✅ Le médecin voit toutes ses prescriptions
- ✅ Les prescriptions sont triées par date (plus récentes en premier)
- ✅ Le médecin ne peut plus modifier une prescription une fois envoyée (sauf ADMIN)
- ✅ Les informations patient sont affichées pour contexte

**Actions Possibles selon Status**:
- CREATED: Modifier texte, Envoyer au laboratoire, Supprimer (ADMIN)
- SENT_TO_LAB: Consulter uniquement
- IN_PROGRESS: Consulter uniquement
- COMPLETED: Consulter, Voir résultat (si existe)

---

### 2. Workflow Biologiste (BIOLOGIST)

#### Phase 1: Réception des Prescriptions

**Contexte**: Le biologiste arrive au laboratoire et consulte les prescriptions en attente

**Actions**:
1. Accéder à la vue "Laboratoire"
2. Consulter la liste des prescriptions avec status SENT_TO_LAB
3. Trier par date d'arrivée (plus anciennes en premier généralement)
4. Lire les détails des analyses demandées

**Informations Visibles**:
- Texte de la prescription (analyses à réaliser)
- Patient (nom, prénom, date de naissance)
- Médecin prescripteur (nom, email)
- Date de prescription
- Date d'envoi au laboratoire

**Règles Métier**:
- ✅ Le biologiste voit TOUTES les prescriptions SENT_TO_LAB (pas de filtrage par médecin)
- ✅ Les prescriptions sont en file d'attente (FIFO généralement)
- ✅ Aucune modification du texte de prescription n'est possible
- ✅ Le biologiste peut consulter l'historique patient si nécessaire

---

#### Phase 2: Traitement de l'Analyse

**Contexte**: Le biologiste commence à travailler sur une prescription

**Actions**:
1. Sélectionner une prescription SENT_TO_LAB
2. Cliquer sur "Commencer l'analyse"
3. Confirmer l'action
4. Réaliser les analyses en laboratoire (hors système)

**Règles Métier**:
- ✅ La prescription doit être au status SENT_TO_LAB
- ✅ Le biologiste (ou ADMIN) peut mettre en cours
- ✅ La transition est irréversible (sauf ADMIN)
- ✅ Une prescription IN_PROGRESS est "verrouillée" à ce biologiste (logique future)

**Validation**:
```typescript
IF prescription.status !== "SENT_TO_LAB"
  THEN throw Error("La prescription doit être au statut SENT_TO_LAB")

IF session.userId.role !== "BIOLOGIST" AND session.userId.role !== "ADMIN"
  THEN throw Error("Permissions insuffisantes")
```

**Résultat**:
- Status passe à IN_PROGRESS
- updatedAt mis à jour
- Message: "Analyse en cours"
- La prescription disparaît de la file d'attente SENT_TO_LAB
- La prescription apparaît dans la liste "En cours"

---

#### Phase 3: Finalisation de l'Analyse

**Contexte**: Le biologiste a terminé les analyses et souhaite marquer la prescription comme terminée

**Actions**:
1. Consulter la liste des prescriptions IN_PROGRESS
2. Sélectionner la prescription terminée
3. Cliquer sur "Terminer l'analyse"
4. Confirmer l'action

**Règles Métier**:
- ✅ La prescription doit être au status IN_PROGRESS
- ✅ Le biologiste (ou ADMIN) peut finaliser
- ✅ La transition est irréversible (sauf ADMIN)
- ✅ Cette action prépare l'ajout d'un Result (Jour 5)

**Validation**:
```typescript
IF prescription.status !== "IN_PROGRESS"
  THEN throw Error("La prescription doit être au statut IN_PROGRESS")

IF session.userId.role !== "BIOLOGIST" AND session.userId.role !== "ADMIN"
  THEN throw Error("Permissions insuffisantes")
```

**Résultat**:
- Status passe à COMPLETED
- updatedAt mis à jour
- Message: "Analyse terminée"
- La prescription est prête à recevoir un Result (module Jour 5)
- Le médecin peut consulter le statut COMPLETED

**Prochaine Étape (Jour 5)**:
- Le biologiste ajoutera un Result lié à cette prescription
- Le médecin pourra consulter les résultats détaillés
- Workflow complet: Prescription COMPLETED → Result créé

---

### 3. Workflow Secrétaire (SECRETARY)

#### Rôle Consultatif Uniquement

**Contexte**: Un patient appelle pour demander le statut de ses analyses

**Actions**:
1. Accéder à la liste des prescriptions
2. Filtrer par patient (recherche par nom ou ID)
3. Consulter le status de la prescription
4. Informer le patient

**Informations Visibles**:
- Toutes les prescriptions du patient
- Status actuel de chaque prescription
- Médecin prescripteur
- Date de prescription

**Règles Métier**:
- ✅ Accès en lecture seule (aucune modification possible)
- ✅ Peut voir toutes les prescriptions (tous médecins)
- ✅ Ne peut pas créer, modifier ou supprimer
- ✅ Interface affiche uniquement les informations, pas de boutons d'action

**Réponses Type au Patient**:
- CREATED: "Votre prescription a été créée, elle sera bientôt envoyée au laboratoire"
- SENT_TO_LAB: "Votre prescription est en attente de traitement au laboratoire"
- IN_PROGRESS: "Vos analyses sont en cours, merci de patienter"
- COMPLETED: "Vos analyses sont terminées, veuillez contacter votre médecin pour les résultats"

---

### 4. Workflow Administrateur (ADMIN)

#### Supervision et Correction

**Contexte**: L'administrateur identifie une erreur ou doit corriger des données

**Actions Possibles**:
1. **Consulter toutes les prescriptions** (vue globale)
2. **Modifier le texte d'une prescription** (correction d'erreur de saisie)
3. **Modifier le status** (override des règles de transition)
4. **Modifier les associations** (patient, médecin)
5. **Supprimer une prescription** (cas d'erreur grave)

**Règles Métier**:
- ✅ L'ADMIN outrepasse toutes les règles de transition
- ✅ L'ADMIN peut modifier n'importe quelle prescription
- ✅ L'ADMIN peut supprimer définitivement (cascade sur Result)
- ⚠️ Ces actions doivent être utilisées avec précaution
- ⚠️ Recommandation: logger toutes les actions ADMIN (future improvement)

**Cas d'Usage Typiques**:

**Cas 1: Erreur de Saisie**
- Médecin a saisi le mauvais texte de prescription
- ADMIN corrige le texte sans changer le status
- Message: "Prescription modifiée avec succès"

**Cas 2: Mauvais Patient**
- Prescription associée au mauvais patient
- ADMIN modifie le patientId
- Vérification que le nouveau patient existe
- Message: "Prescription modifiée avec succès"

**Cas 3: Statut Bloqué**
- Prescription bloquée au mauvais statut suite à un bug
- ADMIN force le statut correct
- Ex: IN_PROGRESS → SENT_TO_LAB (normalement interdit)
- Message: "Prescription modifiée avec succès"

**Cas 4: Doublon ou Erreur Grave**
- Prescription créée par erreur
- ADMIN supprime définitivement
- Si un Result existe, il est aussi supprimé (cascade)
- Message: "Prescription supprimée avec succès"

**Validation (même pour ADMIN)**:
```typescript
IF modifying patientId AND patient.exists() === false
  THEN throw Error("Patient introuvable")

IF modifying doctorId AND doctor.exists() === false
  THEN throw Error("Médecin introuvable")

IF modifying doctorId AND doctor.role !== "DOCTOR"
  THEN throw Error("L'utilisateur doit avoir le rôle DOCTOR")
```

---

## Règles Métier Globales

### RG-001: Intégrité Référentielle

**Patient**:
- Un patient doit exister avant qu'une prescription ne lui soit associée
- Si un patient est supprimé, toutes ses prescriptions sont supprimées (CASCADE)

**Médecin**:
- Un médecin doit exister et avoir le rôle DOCTOR
- Si un médecin est supprimé, toutes ses prescriptions sont supprimées (CASCADE)

**Result (Jour 5)**:
- Une prescription COMPLETED peut avoir un résultat (0 ou 1)
- Si une prescription est supprimée, son résultat est supprimé (CASCADE)

---

### RG-002: Validation des Transitions

**Fonction Utilitaire Recommandée**:
```typescript
function validateStatusTransition(
  currentStatus: PrescriptionStatus,
  newStatus: PrescriptionStatus,
  userRole: Role
): boolean {
  // ADMIN outrepasse toutes les règles
  if (userRole === Role.ADMIN) {
    return true;
  }

  // Définir les transitions autorisées
  const allowedTransitions = {
    CREATED: {
      nextStatus: 'SENT_TO_LAB',
      allowedRoles: [Role.DOCTOR, Role.ADMIN]
    },
    SENT_TO_LAB: {
      nextStatus: 'IN_PROGRESS',
      allowedRoles: [Role.BIOLOGIST, Role.ADMIN]
    },
    IN_PROGRESS: {
      nextStatus: 'COMPLETED',
      allowedRoles: [Role.BIOLOGIST, Role.ADMIN]
    },
    COMPLETED: {
      nextStatus: null,  // État final
      allowedRoles: []
    }
  };

  const transition = allowedTransitions[currentStatus];

  // Vérifier si la transition est autorisée
  if (transition.nextStatus !== newStatus) {
    throw new BadRequestException(
      `Transition de statut invalide: ${currentStatus} → ${newStatus}`
    );
  }

  // Vérifier si le rôle est autorisé
  if (!transition.allowedRoles.includes(userRole)) {
    throw new ForbiddenException(
      'Vous n\'avez pas les permissions pour cette transition'
    );
  }

  return true;
}
```

---

### RG-003: Permissions par Action

| Action | ADMIN | DOCTOR | BIOLOGIST | SECRETARY |
|--------|-------|--------|-----------|-----------|
| Créer prescription | ✓ | ✓ | ✗ | ✗ |
| Consulter prescriptions | ✓ | ✓ | ✓ | ✓ |
| Modifier texte | ✓ | ✓* | ✗ | ✗ |
| CREATED → SENT_TO_LAB | ✓ | ✓* | ✗ | ✗ |
| SENT_TO_LAB → IN_PROGRESS | ✓ | ✗ | ✓ | ✗ |
| IN_PROGRESS → COMPLETED | ✓ | ✗ | ✓ | ✗ |
| Supprimer prescription | ✓ | ✗ | ✗ | ✗ |

*DOCTOR: uniquement ses propres prescriptions

---

### RG-004: Validation des Données

**Texte de Prescription**:
- Minimum: 10 caractères
- Maximum: 10 000 caractères
- Type: String (TEXT en base de données)
- Format: Texte libre, pas de standardisation pour MVP

**IDs (UUID v4)**:
- Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Validation: class-validator @IsUUID()
- Génération: automatique via Prisma @default(uuid())

**Dates**:
- createdAt: automatique via @default(now())
- updatedAt: automatique via @updatedAt
- Format: ISO 8601 (DateTime Prisma)

---

### RG-005: Messages Utilisateur

Tous les messages doivent être en français et explicites:

**Succès**:
- "Prescription créée avec succès"
- "Prescription envoyée au laboratoire"
- "Prescription modifiée avec succès"
- "Analyse en cours"
- "Analyse terminée"
- "Prescription supprimée avec succès"

**Erreurs**:
- "Patient introuvable"
- "Médecin introuvable ou rôle incorrect"
- "Le texte de la prescription est obligatoire"
- "Prescription avec l'ID {id} introuvable"
- "Transition de statut invalide: {from} → {to}"
- "Vous ne pouvez modifier que vos propres prescriptions"
- "Vous n'avez pas les permissions nécessaires"
- "Vous devez être connecté"

---

## Scénarios de Cas Limites

### Scénario 1: Prescription Créée mais Jamais Envoyée

**Situation**: Un médecin crée une prescription mais oublie de l'envoyer au laboratoire

**Status**: CREATED (bloqué)

**Impact**:
- La prescription n'apparaît pas dans la file du laboratoire
- Le patient ne reçoit pas ses analyses

**Résolution**:
- Le médecin peut consulter ses prescriptions avec filtre status=CREATED
- Le médecin envoie la prescription au laboratoire
- Ou: ADMIN identifie et envoie (ou supprime si obsolète)

**Prévention**:
- Interface frontend affiche clairement les prescriptions CREATED
- Notification (future improvement) pour prescriptions CREATED > 24h

---

### Scénario 2: Biologiste Commence mais ne Termine Jamais

**Situation**: Un biologiste met une prescription IN_PROGRESS mais ne la finalise jamais

**Status**: IN_PROGRESS (bloqué)

**Impact**:
- La prescription reste bloquée
- Le médecin ne peut pas consulter les résultats
- Le patient est en attente

**Résolution**:
- Supervision par ADMIN pour identifier les prescriptions IN_PROGRESS > 72h
- ADMIN force le statut à COMPLETED ou retour à SENT_TO_LAB

**Prévention**:
- Dashboard administrateur avec métriques (future improvement)
- Rappels automatiques pour prescriptions IN_PROGRESS > 48h

---

### Scénario 3: Médecin Supprimé avec Prescriptions Actives

**Situation**: Un médecin quitte l'hôpital et son compte est supprimé

**Impact**: CASCADE DELETE active

**Conséquence**:
- Toutes les prescriptions du médecin sont supprimées
- Les résultats associés sont aussi supprimés
- Perte de données patient

**Résolution Recommandée**:
- **Ne jamais supprimer physiquement un médecin**
- Utiliser un flag "active: false" ou "deleted_at" (soft delete)
- Modifier le schéma Prisma pour inclure soft delete (future improvement)

**Workflow Alternatif**:
1. ADMIN désactive le compte médecin (flag active: false)
2. Les prescriptions restent en base
3. Le médecin ne peut plus se connecter
4. Les prescriptions affichent "[Médecin inactif]" dans l'interface

---

### Scénario 4: Patient Supprimé avec Prescriptions Actives

**Situation**: Un patient est supprimé par erreur ou pour raison administrative

**Impact**: CASCADE DELETE active

**Conséquence**:
- Toutes les prescriptions du patient sont supprimées
- Les résultats associés sont aussi supprimés
- Perte de données médicales

**Résolution**:
- Même stratégie que pour médecin: soft delete recommandé
- Confirmation obligatoire avant suppression
- Backup automatique avant suppression (future improvement)

---

### Scénario 5: Transition Invalide Tentée

**Situation**: Un biologiste tente de passer directement de CREATED à IN_PROGRESS

**Status Actuel**: CREATED

**Status Demandé**: IN_PROGRESS

**Validation**:
```typescript
validateStatusTransition('CREATED', 'IN_PROGRESS', Role.BIOLOGIST)
// → throw BadRequestException("Transition invalide")
```

**Résultat**:
- HTTP 400 Bad Request
- Message: "Transition de statut invalide: CREATED → IN_PROGRESS"
- La prescription reste au statut CREATED
- Aucune modification en base de données

**Action Correcte**:
1. Médecin envoie au labo: CREATED → SENT_TO_LAB
2. Biologiste commence: SENT_TO_LAB → IN_PROGRESS

---

### Scénario 6: Concurrence (Deux Biologistes)

**Situation**: Deux biologistes tentent de mettre la même prescription IN_PROGRESS simultanément

**Status Actuel**: SENT_TO_LAB

**Requêtes Simultanées**:
- Biologiste A: PATCH /prescriptions/xxx { status: 'IN_PROGRESS' }
- Biologiste B: PATCH /prescriptions/xxx { status: 'IN_PROGRESS' }

**Résultat avec Transaction Prisma**:
1. Une requête est exécutée en premier (A)
2. Status passe à IN_PROGRESS
3. La deuxième requête (B) échoue:
   - Validation: currentStatus est maintenant IN_PROGRESS
   - Transition SENT_TO_LAB → IN_PROGRESS impossible
   - HTTP 400 "Transition invalide"

**Gestion Frontend**:
- Biologiste B reçoit une erreur
- Message: "Cette prescription a déjà été prise en charge"
- Biologiste B sélectionne une autre prescription

**Amélioration Future**:
- Locking optimiste avec version number
- Affichage en temps réel de qui travaille sur quoi (WebSocket)

---

## Intégration avec Modules Adjacents

### Lien avec Module Appointments (Jour 3)

**Workflow Typique**:
```
1. Patient prend rendez-vous → Appointment SCHEDULED
2. Médecin consulte patient → Appointment COMPLETED
3. Médecin crée prescription → Prescription CREATED
4. Suite du workflow prescriptions...
```

**Champs Optionnels (future improvement)**:
```typescript
// Ajout potentiel au schéma
model Prescription {
  appointmentId String?
  appointment   Appointment? @relation(...)
}
```

**Bénéfice**:
- Traçabilité complète: rendez-vous → consultation → prescription → résultats
- Historique patient enrichi

---

### Lien avec Module Results (Jour 5 - À venir)

**Préparation du Workflow**:
```
Prescription COMPLETED → Biologiste crée Result → Médecin consulte Result
```

**Relation Prisma (déjà définie)**:
```prisma
model Prescription {
  result Result?  // One-to-one
}

model Result {
  prescriptionId String       @unique
  prescription   Prescription @relation(...)
}
```

**Workflow Complet Jour 5**:
1. Prescription au statut COMPLETED
2. Biologiste clique "Ajouter résultat"
3. Biologiste saisit les résultats détaillés (texte)
4. Result créé et lié à la prescription
5. Médecin consulte la prescription
6. Médecin voit le résultat attaché

**Contrainte**:
- Un Result ne peut être créé que si prescription.status === 'COMPLETED'
- Une prescription ne peut avoir qu'un seul Result (relation one-to-one)

---

## Métriques et KPIs (Hors MVP, Documentation Complète)

### Métriques de Performance

**Temps Moyen par Phase**:
- Création → Envoi au labo: < 5 minutes (action médecin)
- Envoi → Prise en charge: objectif < 2 heures
- Prise en charge → Terminé: objectif < 24 heures
- Total (Création → COMPLETED): objectif < 48 heures

**Métriques de Flux**:
- Nombre de prescriptions CREATED non envoyées > 24h
- Nombre de prescriptions SENT_TO_LAB en attente
- Nombre de prescriptions IN_PROGRESS > 48h
- Nombre de prescriptions COMPLETED sans Result

### Dashboard Administrateur (Future)

**Vue d'Ensemble**:
- Total prescriptions par statut (pie chart)
- Prescriptions par médecin (bar chart)
- Temps moyen par phase (line chart)
- Alertes pour prescriptions bloquées

**Alertes**:
- 🔴 Critique: Prescription IN_PROGRESS > 72h
- 🟠 Attention: Prescription SENT_TO_LAB > 12h
- 🟡 Info: Prescription CREATED > 24h

---

## Checklist de Validation du Workflow

### Pour le Développeur

**Backend**:
- [ ] Fonction validateStatusTransition implémentée
- [ ] Guards appliqués correctement sur chaque endpoint
- [ ] Vérification de propriété (doctorId) pour modifications
- [ ] Cascade delete configuré correctement
- [ ] Messages d'erreur en français et explicites
- [ ] Dates createdAt/updatedAt gérées automatiquement

**Frontend**:
- [ ] Badges colorés pour différencier les statuts (CREATED: gris, SENT_TO_LAB: bleu, IN_PROGRESS: orange, COMPLETED: vert)
- [ ] Boutons d'action conditionnels selon rôle et statut
- [ ] Confirmation dialogs pour actions critiques (envoi, finalisation, suppression)
- [ ] Messages de succès/erreur affichés clairement
- [ ] Filtres fonctionnels pour chaque rôle

### Pour le Testeur

**Tests Fonctionnels**:
- [ ] Workflow complet CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED
- [ ] Tentative de transition invalide rejetée
- [ ] Permissions par rôle validées
- [ ] DOCTOR ne peut modifier que ses prescriptions
- [ ] BIOLOGIST peut traiter toutes les prescriptions
- [ ] SECRETARY en lecture seule
- [ ] ADMIN peut tout faire

**Tests de Cas Limites**:
- [ ] Patient inexistant → erreur
- [ ] Médecin inexistant → erreur
- [ ] Transition interdite → erreur
- [ ] Utilisateur non autorisé → 403
- [ ] Session expirée → 401
- [ ] Prescription inexistante → 404

---

## Évolutions Futures Recommandées

### Court Terme (Post-MVP)

1. **Soft Delete**:
   - Ajouter flag `deleted` ou `deletedAt`
   - Éviter perte de données historiques

2. **Audit Trail**:
   - Logger toutes les modifications avec userId, timestamp
   - Table PrescriptionHistory

3. **Notifications**:
   - Email au médecin quand prescription COMPLETED
   - Alerte biologiste pour nouvelle prescription SENT_TO_LAB

### Moyen Terme

4. **Template de Prescriptions**:
   - Prescriptions pré-remplies pour analyses courantes
   - Gain de temps pour médecins

5. **Catalogue d'Analyses**:
   - Standardisation des analyses
   - Sélection multiple plutôt que texte libre

6. **Planning Laboratoire**:
   - Affectation automatique aux biologistes
   - Gestion de charge de travail

### Long Terme

7. **Intégration Équipements**:
   - Interface avec machines d'analyse
   - Import automatique de résultats

8. **IA et Prédictions**:
   - Suggestion d'analyses basée sur motif de consultation
   - Détection d'anomalies dans résultats

9. **Statistiques Avancées**:
   - Rapports par médecin, patient, type d'analyse
   - Export vers systèmes de facturation

---

## Conclusion

Le workflow du module Prescriptions suit une machine à états stricte avec 4 états (CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED) et des transitions unidirectionnelles validées par des règles métier.

**Points Clés**:
- ✅ Traçabilité complète du cycle de vie
- ✅ Permissions granulaires par rôle
- ✅ Validation côté serveur de toutes les transitions
- ✅ Préparation pour module Results (Jour 5)
- ✅ Gestion d'erreurs robuste avec messages explicites

**Prochaines Étapes**:
1. Architecture technique (spec-architect)
2. Implémentation backend (PrescriptionsModule, Service, Controller)
3. Implémentation frontend (Liste, Formulaire, Filtres)
4. Tests et validation
5. Intégration avec Results (Jour 5)

---

**Document généré le**: 2026-01-03
**Version Workflow**: 1.0
**Prochaine étape**: Rapport d'Analyse Final
