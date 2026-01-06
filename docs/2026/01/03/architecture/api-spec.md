# Spécification API Détaillée - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions API Specification
- **Version**: 1.0
- **Date**: 2026-01-03
- **Format**: OpenAPI 3.0
- **Base URL**: http://localhost:3000/api

---

## OpenAPI Specification (YAML)

```yaml
openapi: 3.0.0
info:
  title: Hospital Management System - Prescriptions API
  version: 1.0.0
  description: API complète pour la gestion des prescriptions médicales
  contact:
    name: Development Team
    email: dev@hospital.com

servers:
  - url: http://localhost:3000/api
    description: Development server

tags:
  - name: Prescriptions
    description: Gestion des prescriptions médicales

paths:
  /prescriptions:
    get:
      tags:
        - Prescriptions
      summary: Lister les prescriptions
      description: Récupérer la liste des prescriptions avec filtres optionnels
      operationId: listPrescriptions
      security:
        - sessionAuth: []
      parameters:
        - name: patientId
          in: query
          description: Filtrer par ID patient
          required: false
          schema:
            type: string
            format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        - name: doctorId
          in: query
          description: Filtrer par ID médecin
          required: false
          schema:
            type: string
            format: uuid
          example: "789e0123-e89b-12d3-a456-426614174000"
        - name: status
          in: query
          description: Filtrer par statut
          required: false
          schema:
            $ref: '#/components/schemas/PrescriptionStatus'
      responses:
        '200':
          description: Liste des prescriptions récupérée avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PrescriptionWithRelations'
              examples:
                success:
                  value:
                    data:
                      - id: "550e8400-e29b-41d4-a716-446655440000"
                        text: "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total"
                        status: "SENT_TO_LAB"
                        patientId: "123e4567-e89b-12d3-a456-426614174000"
                        doctorId: "789e0123-e89b-12d3-a456-426614174000"
                        createdAt: "2026-01-03T10:30:00.000Z"
                        updatedAt: "2026-01-03T10:35:00.000Z"
                        patient:
                          id: "123e4567-e89b-12d3-a456-426614174000"
                          firstName: "Marie"
                          lastName: "Dupont"
                          birthDate: "1985-05-15T00:00:00.000Z"
                        doctor:
                          id: "789e0123-e89b-12d3-a456-426614174000"
                          name: "Dr. Jean Martin"
                          email: "doctor@hospital.com"
                          role: "DOCTOR"
                emptyList:
                  value:
                    data: []
        '401':
          $ref: '#/components/responses/UnauthorizedError'

    post:
      tags:
        - Prescriptions
      summary: Créer une prescription
      description: Créer une nouvelle prescription pour un patient (DOCTOR, ADMIN uniquement)
      operationId: createPrescription
      security:
        - sessionAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePrescriptionDto'
            examples:
              validRequest:
                value:
                  text: "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total, HDL, LDL, triglycérides"
                  patientId: "123e4567-e89b-12d3-a456-426614174000"
      responses:
        '201':
          description: Prescription créée avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/PrescriptionWithRelations'
                  message:
                    type: string
              examples:
                success:
                  value:
                    data:
                      id: "550e8400-e29b-41d4-a716-446655440000"
                      text: "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total"
                      status: "CREATED"
                      patientId: "123e4567-e89b-12d3-a456-426614174000"
                      doctorId: "789e0123-e89b-12d3-a456-426614174000"
                      createdAt: "2026-01-03T10:30:00.000Z"
                      updatedAt: "2026-01-03T10:30:00.000Z"
                      patient:
                        id: "123e4567-e89b-12d3-a456-426614174000"
                        firstName: "Marie"
                        lastName: "Dupont"
                        birthDate: "1985-05-15T00:00:00.000Z"
                      doctor:
                        id: "789e0123-e89b-12d3-a456-426614174000"
                        name: "Dr. Jean Martin"
                        email: "doctor@hospital.com"
                        role: "DOCTOR"
                    message: "Prescription créée avec succès"
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /prescriptions/{id}:
    get:
      tags:
        - Prescriptions
      summary: Récupérer une prescription
      description: Récupérer les détails complets d'une prescription par ID
      operationId: getPrescription
      security:
        - sessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          description: ID de la prescription
          schema:
            type: string
            format: uuid
          example: "550e8400-e29b-41d4-a716-446655440000"
      responses:
        '200':
          description: Prescription récupérée avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/PrescriptionWithRelations'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

    patch:
      tags:
        - Prescriptions
      summary: Mettre à jour une prescription
      description: |
        Mettre à jour les détails d'une prescription.
        Permissions:
        - DOCTOR: peut modifier texte et envoyer au labo (CREATED → SENT_TO_LAB), uniquement ses propres prescriptions
        - BIOLOGIST: peut mettre à jour statut (SENT_TO_LAB → IN_PROGRESS → COMPLETED)
        - ADMIN: peut tout modifier
      operationId: updatePrescription
      security:
        - sessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          description: ID de la prescription
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePrescriptionDto'
            examples:
              sendToLab:
                summary: Envoyer au laboratoire (DOCTOR)
                value:
                  status: "SENT_TO_LAB"
              startAnalysis:
                summary: Commencer l'analyse (BIOLOGIST)
                value:
                  status: "IN_PROGRESS"
              completeAnalysis:
                summary: Terminer l'analyse (BIOLOGIST)
                value:
                  status: "COMPLETED"
              adminCorrection:
                summary: Correction complète (ADMIN)
                value:
                  text: "Analyse sanguine complète corrigée: NFS, créatinine, urée"
                  status: "CREATED"
                  patientId: "123e4567-e89b-12d3-a456-426614174000"
      responses:
        '200':
          description: Prescription mise à jour avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/PrescriptionWithRelations'
                  message:
                    type: string
              examples:
                success:
                  value:
                    data:
                      id: "550e8400-e29b-41d4-a716-446655440000"
                      status: "SENT_TO_LAB"
                      updatedAt: "2026-01-03T10:35:00.000Z"
                    message: "Prescription modifiée avec succès"
        '400':
          description: Transition de statut invalide
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                invalidTransition:
                  value:
                    statusCode: 400
                    message: "Transition de statut invalide: CREATED → COMPLETED"
                    error: "Bad Request"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          description: Permissions insuffisantes
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                notOwner:
                  value:
                    statusCode: 403
                    message: "Vous ne pouvez modifier que vos propres prescriptions"
                    error: "Forbidden"
                invalidRole:
                  value:
                    statusCode: 403
                    message: "Vous n'avez pas les permissions nécessaires"
                    error: "Forbidden"
        '404':
          $ref: '#/components/responses/NotFoundError'

    delete:
      tags:
        - Prescriptions
      summary: Supprimer une prescription
      description: Supprimer définitivement une prescription (ADMIN uniquement)
      operationId: deletePrescription
      security:
        - sessionAuth: []
      parameters:
        - name: id
          in: path
          required: true
          description: ID de la prescription
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Prescription supprimée avec succès
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
              examples:
                success:
                  value:
                    message: "Prescription supprimée avec succès"
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

components:
  securitySchemes:
    sessionAuth:
      type: apiKey
      in: cookie
      name: connect.sid
      description: Session-based authentication avec cookie httpOnly

  schemas:
    PrescriptionStatus:
      type: string
      enum:
        - CREATED
        - SENT_TO_LAB
        - IN_PROGRESS
        - COMPLETED
      description: |
        Statut de la prescription:
        - CREATED: Créée par le médecin
        - SENT_TO_LAB: Envoyée au laboratoire
        - IN_PROGRESS: En cours d'analyse
        - COMPLETED: Résultat disponible

    CreatePrescriptionDto:
      type: object
      required:
        - text
        - patientId
      properties:
        text:
          type: string
          minLength: 10
          maxLength: 10000
          description: Texte de la prescription (analyses demandées)
          example: "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total"
        patientId:
          type: string
          format: uuid
          description: ID du patient
          example: "123e4567-e89b-12d3-a456-426614174000"

    UpdatePrescriptionDto:
      type: object
      properties:
        text:
          type: string
          minLength: 10
          maxLength: 10000
          description: Nouveau texte de la prescription (ADMIN uniquement)
        status:
          $ref: '#/components/schemas/PrescriptionStatus'
        patientId:
          type: string
          format: uuid
          description: Nouveau patient (ADMIN uniquement)
        doctorId:
          type: string
          format: uuid
          description: Nouveau médecin (ADMIN uniquement)

    PrescriptionWithRelations:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: "550e8400-e29b-41d4-a716-446655440000"
        text:
          type: string
          example: "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total"
        status:
          $ref: '#/components/schemas/PrescriptionStatus'
        patientId:
          type: string
          format: uuid
        doctorId:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time
          example: "2026-01-03T10:30:00.000Z"
        updatedAt:
          type: string
          format: date-time
          example: "2026-01-03T10:35:00.000Z"
        patient:
          type: object
          properties:
            id:
              type: string
              format: uuid
            firstName:
              type: string
            lastName:
              type: string
            birthDate:
              type: string
              format: date-time
        doctor:
          type: object
          properties:
            id:
              type: string
              format: uuid
            name:
              type: string
            email:
              type: string
              format: email
            role:
              type: string
              enum: [DOCTOR]
        result:
          type: object
          nullable: true
          description: Résultat de l'analyse (Jour 5, null si pas encore créé)
          properties:
            id:
              type: string
              format: uuid
            text:
              type: string
            createdAt:
              type: string
              format: date-time

    ErrorResponse:
      type: object
      properties:
        statusCode:
          type: integer
          example: 400
        message:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
          example: "Patient introuvable"
        error:
          type: string
          example: "Bad Request"

  responses:
    UnauthorizedError:
      description: Session manquante ou expirée
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            noSession:
              value:
                statusCode: 401
                message: "Vous devez être connecté"
                error: "Unauthorized"

    ForbiddenError:
      description: Permissions insuffisantes
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            insufficientPermissions:
              value:
                statusCode: 403
                message: "Vous n'avez pas les permissions nécessaires"
                error: "Forbidden"

    BadRequestError:
      description: Validation échouée
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            patientNotFound:
              value:
                statusCode: 400
                message: "Patient introuvable"
                error: "Bad Request"
            validationFailed:
              value:
                statusCode: 400
                message:
                  - "text must be longer than or equal to 10 characters"
                  - "patientId must be a UUID"
                error: "Bad Request"

    NotFoundError:
      description: Ressource non trouvée
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          examples:
            prescriptionNotFound:
              value:
                statusCode: 404
                message: "Prescription avec l'ID 550e8400-e29b-41d4-a716-446655440000 introuvable"
                error: "Not Found"
```

---

## Règles de Validation Détaillées

### CreatePrescriptionDto

| Champ | Type | Requis | Validation | Message d'Erreur |
|-------|------|--------|------------|------------------|
| text | string | ✓ | MinLength: 10<br>MaxLength: 10000<br>IsString<br>IsNotEmpty | "Le texte de la prescription est obligatoire"<br>"Le texte doit contenir au moins 10 caractères"<br>"Le texte ne peut pas dépasser 10000 caractères" |
| patientId | string (UUID) | ✓ | IsUUID('4')<br>IsNotEmpty | "L'ID du patient est obligatoire"<br>"L'ID du patient doit être un UUID valide" |

**Validations Métier**:
- Patient doit exister en base: `BadRequestException("Patient introuvable")`
- DoctorId extrait automatiquement de la session

### UpdatePrescriptionDto

| Champ | Type | Requis | Validation | Permissions |
|-------|------|--------|------------|-------------|
| text | string | ✗ | MinLength: 10<br>MaxLength: 10000<br>IsString | ADMIN uniquement |
| status | enum | ✗ | IsEnum(PrescriptionStatus) | Selon rôle et transition |
| patientId | string (UUID) | ✗ | IsUUID('4') | ADMIN uniquement |
| doctorId | string (UUID) | ✗ | IsUUID('4') | ADMIN uniquement |

**Validations Métier**:
- Prescription doit exister: `NotFoundException`
- Validation transitions de statut (voir State Machine)
- Ownership pour DOCTOR: `prescription.doctorId === userId`
- Patient/Médecin doivent exister si modifiés

---

## State Machine de Transitions

### Matrice de Transitions

| État Actuel | État Suivant | Rôle Autorisé | Validation Additionnelle |
|-------------|--------------|---------------|--------------------------|
| CREATED | SENT_TO_LAB | DOCTOR | Doit être le créateur (ownership) |
| CREATED | SENT_TO_LAB | ADMIN | Pas de validation ownership |
| SENT_TO_LAB | IN_PROGRESS | BIOLOGIST | Aucune |
| SENT_TO_LAB | IN_PROGRESS | ADMIN | Aucune |
| IN_PROGRESS | COMPLETED | BIOLOGIST | Aucune |
| IN_PROGRESS | COMPLETED | ADMIN | Aucune |
| * | * | ADMIN | Bypass complet (correction d'erreur) |

### Transitions Interdites

**Retours en arrière** (sauf ADMIN):
- SENT_TO_LAB → CREATED
- IN_PROGRESS → SENT_TO_LAB
- IN_PROGRESS → CREATED
- COMPLETED → (tout statut précédent)

**Sauts d'étapes** (sauf ADMIN):
- CREATED → IN_PROGRESS
- CREATED → COMPLETED
- SENT_TO_LAB → COMPLETED

**Code d'Erreur**: 400 Bad Request
**Message**: `"Transition de statut invalide: {currentStatus} → {newStatus}"`

### Validation Ownership (DOCTOR)

```typescript
// DOCTOR peut uniquement:
// 1. Modifier le texte de SES propres prescriptions
// 2. Envoyer au labo (CREATED → SENT_TO_LAB) SES propres prescriptions

IF userRole === DOCTOR AND prescription.doctorId !== userId
  THEN throw ForbiddenException(
    "Vous ne pouvez modifier que vos propres prescriptions"
  )
```

---

## Exemples de Requêtes cURL

### 1. Créer une Prescription (DOCTOR)

```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3Asession-id-here" \
  -d '{
    "text": "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total, HDL, LDL, triglycérides",
    "patientId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**Réponse Succès (201)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Analyse sanguine complète...",
    "status": "CREATED",
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "doctorId": "789e0123-e89b-12d3-a456-426614174000",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T10:30:00.000Z",
    "patient": { ... },
    "doctor": { ... }
  },
  "message": "Prescription créée avec succès"
}
```

### 2. Lister les Prescriptions avec Filtres

```bash
# Toutes les prescriptions
curl http://localhost:3000/api/prescriptions \
  -H "Cookie: connect.sid=s%3Asession-id-here"

# Filtrer par patient
curl "http://localhost:3000/api/prescriptions?patientId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Cookie: connect.sid=s%3Asession-id-here"

# Filtrer par statut
curl "http://localhost:3000/api/prescriptions?status=SENT_TO_LAB" \
  -H "Cookie: connect.sid=s%3Asession-id-here"

# Filtres combinés
curl "http://localhost:3000/api/prescriptions?patientId=123e4567-e89b-12d3-a456-426614174000&status=CREATED" \
  -H "Cookie: connect.sid=s%3Asession-id-here"
```

### 3. Envoyer au Laboratoire (DOCTOR)

```bash
curl -X PATCH http://localhost:3000/api/prescriptions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3Asession-id-here" \
  -d '{
    "status": "SENT_TO_LAB"
  }'
```

**Réponse Succès (200)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SENT_TO_LAB",
    "updatedAt": "2026-01-03T10:35:00.000Z",
    ...
  },
  "message": "Prescription modifiée avec succès"
}
```

**Réponse Erreur - Pas le créateur (403)**:
```json
{
  "statusCode": 403,
  "message": "Vous ne pouvez envoyer que vos propres prescriptions",
  "error": "Forbidden"
}
```

### 4. Commencer l'Analyse (BIOLOGIST)

```bash
curl -X PATCH http://localhost:3000/api/prescriptions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3Asession-id-here" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

### 5. Terminer l'Analyse (BIOLOGIST)

```bash
curl -X PATCH http://localhost:3000/api/prescriptions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3Asession-id-here" \
  -d '{
    "status": "COMPLETED"
  }'
```

### 6. Supprimer une Prescription (ADMIN)

```bash
curl -X DELETE http://localhost:3000/api/prescriptions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: connect.sid=s%3Asession-id-here"
```

**Réponse Succès (200)**:
```json
{
  "message": "Prescription supprimée avec succès"
}
```

---

## Codes d'Erreur et Messages

### 400 Bad Request

| Scénario | Message |
|----------|---------|
| Patient introuvable | "Patient introuvable" |
| Médecin introuvable | "Médecin introuvable ou rôle incorrect" |
| Texte trop court | "text must be longer than or equal to 10 characters" |
| UUID invalide | "patientId must be a UUID" |
| Transition invalide | "Transition de statut invalide: CREATED → COMPLETED" |
| Champ requis manquant | "Le texte de la prescription est obligatoire" |

### 401 Unauthorized

| Scénario | Message |
|----------|---------|
| Session manquante | "Vous devez être connecté" |
| Session expirée | "Vous devez être connecté" |

### 403 Forbidden

| Scénario | Message |
|----------|---------|
| Rôle insuffisant | "Vous n'avez pas les permissions nécessaires" |
| Pas le créateur | "Vous ne pouvez modifier que vos propres prescriptions" |
| Champ ADMIN uniquement | "Seul un administrateur peut modifier ces champs" |
| Transition non autorisée | "Vous n'avez pas les permissions pour cette transition" |

### 404 Not Found

| Scénario | Message |
|----------|---------|
| Prescription inexistante | "Prescription avec l'ID {id} introuvable" |
| Utilisateur inexistant | "Utilisateur introuvable" |

### 500 Internal Server Error

| Scénario | Message |
|----------|---------|
| Erreur DB | "Une erreur est survenue" |
| Erreur serveur | "Une erreur est survenue" |

---

## Performance et Optimisation

### Indexation Database

**Index existants** (définis dans Prisma schema):
```prisma
@@index([patientId])
@@index([doctorId])
@@index([status])
```

**Optimisation des requêtes**:
- Filtrage par `patientId`: Utilise index → O(log n)
- Filtrage par `doctorId`: Utilise index → O(log n)
- Filtrage par `status`: Utilise index → O(log n)
- Tri par `createdAt`: Scan séquentiel (acceptable pour MVP < 1000 rows)

### Requêtes avec Relations

**Include Relations**:
```typescript
include: {
  patient: true,
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  result: true,
}
```

**Avantages**:
- Une seule requête SQL (JOIN)
- Évite N+1 queries
- Temps de réponse: < 100ms pour findOne, < 300ms pour findMany

### Pagination (Future)

**Pas implémenté pour MVP** (< 1000 prescriptions attendues)

**Si nécessaire (post-MVP)**:
```typescript
// Query parameters
?page=1&limit=20

// Prisma
prisma.prescription.findMany({
  skip: (page - 1) * limit,
  take: limit,
})
```

---

## Sécurité API

### Session-based Authentication

**Cookie**:
- Nom: `connect.sid`
- HttpOnly: true (protection XSS)
- MaxAge: 24 heures
- Secure: false (development), true (production)

**Session Storage**: In-memory (pas de persistance pour MVP)

**Extraction userId**:
```typescript
const session = request.session as SessionData;
const userId = session.userId; // UUID du user connecté
```

### CORS Configuration

```typescript
cors({
  origin: 'http://localhost:5173',
  credentials: true, // CRITIQUE pour cookies
})
```

**Frontend Axios**:
```typescript
axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // CRITIQUE
})
```

### Rate Limiting

**Pas implémenté pour MVP**

**Future improvement**:
```typescript
// @nestjs/throttler
@ThrottlerGuard()
@Throttle(10, 60) // 10 requêtes/minute
```

---

## Checklist de Validation API

### Tests Backend (Manuel pour MVP)

**Création**:
- [x] POST avec données valides (DOCTOR) → 201
- [x] POST avec patient inexistant → 400
- [x] POST avec texte trop court → 400
- [x] POST sans authentification → 401
- [x] POST avec rôle BIOLOGIST → 403

**Consultation**:
- [x] GET /prescriptions sans filtre → 200
- [x] GET /prescriptions?status=SENT_TO_LAB → 200
- [x] GET /prescriptions/:id existant → 200
- [x] GET /prescriptions/:id inexistant → 404
- [x] GET sans authentification → 401

**Modification**:
- [x] PATCH status CREATED → SENT_TO_LAB (DOCTOR owner) → 200
- [x] PATCH status CREATED → SENT_TO_LAB (DOCTOR non-owner) → 403
- [x] PATCH status SENT_TO_LAB → IN_PROGRESS (BIOLOGIST) → 200
- [x] PATCH status IN_PROGRESS → COMPLETED (BIOLOGIST) → 200
- [x] PATCH status CREATED → IN_PROGRESS (saut) → 400
- [x] PATCH status COMPLETED → CREATED (retour) → 400
- [x] PATCH text (ADMIN) → 200
- [x] PATCH text (DOCTOR) → 403

**Suppression**:
- [x] DELETE (ADMIN) → 200
- [x] DELETE (DOCTOR) → 403
- [x] DELETE inexistant → 404

### Tests Frontend (Manuel pour MVP)

**Service API**:
- [x] prescriptionService.create() appelle POST /prescriptions
- [x] prescriptionService.findAll() appelle GET /prescriptions
- [x] prescriptionService.updateStatus() appelle PATCH avec status
- [x] Axios inclut withCredentials: true

**Gestion d'Erreurs**:
- [x] Extraction message d'erreur: err.response?.data?.message
- [x] Affichage message utilisateur dans Alert Material-UI
- [x] Message succès après création/modification

---

**Document généré le**: 2026-01-03
**Statut**: ✅ Complete - Ready for Implementation
**Format**: OpenAPI 3.0 + Documentation détaillée
