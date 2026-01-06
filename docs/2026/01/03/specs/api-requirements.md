# API Requirements Specification - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions API
- **Version**: 1.0
- **Date**: 2026-01-03
- **Base URL**: http://localhost:3000/api
- **Authentication**: Session-based (express-session)

## Vue d'Ensemble de l'API

### Principes de Design
- **RESTful**: Utilisation appropriée des verbes HTTP (GET, POST, PATCH, DELETE)
- **Session-based Auth**: Authentification par cookies de session (pas JWT)
- **CORS**: Configuré pour accepter http://localhost:5173 avec credentials
- **Format de Réponse**: `{ data: ..., message?: '...' }`
- **Gestion d'Erreurs**: Exceptions NestJS avec messages en français
- **Validation**: DTOs avec class-validator pour toutes les entrées

### Standards de Sécurité
- Toutes les routes requièrent authentification (AuthGuard)
- Les routes de modification requièrent permissions spécifiques (RolesGuard)
- Les mots de passe ne sont jamais exposés dans les réponses
- Validation stricte des UUIDs pour prévenir injections
- Validation des transitions de statut côté serveur

---

## Endpoints API

### 1. Créer une Prescription

**Endpoint**: `POST /api/prescriptions`

**Description**: Créer une nouvelle prescription pour un patient

**Authentication**: Required (Session)

**Authorization**: DOCTOR, ADMIN

**Request Headers**:
```http
Content-Type: application/json
Cookie: connect.sid={session-id}
```

**Request Body**:
```typescript
{
  text: string;        // Texte de la prescription (analyses demandées) - requis
  patientId: string;   // UUID du patient - requis
}
```

**Request Body Schema (DTO)**:
```typescript
class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10000)
  text: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;
}
```

**Success Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total",
    "status": "CREATED",
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "doctorId": "789e0123-e89b-12d3-a456-426614174000",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T10:30:00.000Z",
    "patient": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "Marie",
      "lastName": "Dupont",
      "birthDate": "1985-05-15T00:00:00.000Z"
    },
    "doctor": {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "name": "Dr. Jean Martin",
      "email": "doctor@hospital.com"
    }
  },
  "message": "Prescription créée avec succès"
}
```

**Error Responses**:

*Patient Not Found*:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": "Patient introuvable",
  "error": "Bad Request"
}
```

*Validation Error*:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": [
    "text must be longer than or equal to 10 characters",
    "patientId must be a UUID"
  ],
  "error": "Bad Request"
}
```

*Unauthorized*:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "statusCode": 401,
  "message": "Vous devez être connecté",
  "error": "Unauthorized"
}
```

*Forbidden (wrong role)*:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Vous n'avez pas les permissions nécessaires",
  "error": "Forbidden"
}
```

**Business Rules**:
- Le doctorId est automatiquement extrait de la session (userId)
- Le statut est automatiquement défini à CREATED
- Le patient doit exister dans la base de données
- Le texte doit contenir au minimum 10 caractères

**Rate Limiting**: None (MVP)

**Caching**: None (MVP)

---

### 2. Lister les Prescriptions

**Endpoint**: `GET /api/prescriptions`

**Description**: Récupérer la liste des prescriptions avec filtres optionnels

**Authentication**: Required (Session)

**Authorization**: All authenticated users

**Request Headers**:
```http
Cookie: connect.sid={session-id}
```

**Query Parameters**:
```typescript
{
  patientId?: string;  // Filtrer par patient (UUID)
  doctorId?: string;   // Filtrer par médecin (UUID)
  status?: 'CREATED' | 'SENT_TO_LAB' | 'IN_PROGRESS' | 'COMPLETED';
}
```

**Query Parameter Examples**:
```
GET /api/prescriptions
GET /api/prescriptions?patientId=123e4567-e89b-12d3-a456-426614174000
GET /api/prescriptions?doctorId=789e0123-e89b-12d3-a456-426614174000
GET /api/prescriptions?status=SENT_TO_LAB
GET /api/prescriptions?patientId=123e4567-e89b-12d3-a456-426614174000&status=CREATED
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total",
      "status": "SENT_TO_LAB",
      "patientId": "123e4567-e89b-12d3-a456-426614174000",
      "doctorId": "789e0123-e89b-12d3-a456-426614174000",
      "createdAt": "2026-01-03T10:30:00.000Z",
      "updatedAt": "2026-01-03T10:35:00.000Z",
      "patient": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "firstName": "Marie",
        "lastName": "Dupont",
        "birthDate": "1985-05-15T00:00:00.000Z"
      },
      "doctor": {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "Dr. Jean Martin",
        "email": "doctor@hospital.com"
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "text": "Radiographie thoracique de face",
      "status": "CREATED",
      "patientId": "234e5678-e89b-12d3-a456-426614174001",
      "doctorId": "789e0123-e89b-12d3-a456-426614174000",
      "createdAt": "2026-01-03T09:15:00.000Z",
      "updatedAt": "2026-01-03T09:15:00.000Z",
      "patient": {
        "id": "234e5678-e89b-12d3-a456-426614174001",
        "firstName": "Pierre",
        "lastName": "Moreau",
        "birthDate": "1990-08-22T00:00:00.000Z"
      },
      "doctor": {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "Dr. Jean Martin",
        "email": "doctor@hospital.com"
      }
    }
  ]
}
```

**Empty Result**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": []
}
```

**Error Responses**:

*Unauthorized*:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "statusCode": 401,
  "message": "Vous devez être connecté",
  "error": "Unauthorized"
}
```

**Business Rules**:
- Les prescriptions sont triées par date de création (DESC)
- Tous les filtres sont optionnels
- Les filtres peuvent être combinés
- Aucune pagination pour le MVP (toutes les prescriptions retournées)
- Les données patient et doctor sont incluses via Prisma include

**Performance**: < 300ms pour 1000 prescriptions

---

### 3. Récupérer une Prescription par ID

**Endpoint**: `GET /api/prescriptions/:id`

**Description**: Récupérer les détails complets d'une prescription

**Authentication**: Required (Session)

**Authorization**: All authenticated users

**Request Headers**:
```http
Cookie: connect.sid={session-id}
```

**Path Parameters**:
```typescript
{
  id: string;  // UUID de la prescription
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total",
    "status": "IN_PROGRESS",
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "doctorId": "789e0123-e89b-12d3-a456-426614174000",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T11:00:00.000Z",
    "patient": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "Marie",
      "lastName": "Dupont",
      "birthDate": "1985-05-15T00:00:00.000Z",
      "createdAt": "2026-01-01T08:00:00.000Z",
      "updatedAt": "2026-01-01T08:00:00.000Z"
    },
    "doctor": {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "name": "Dr. Jean Martin",
      "email": "doctor@hospital.com",
      "role": "DOCTOR"
    },
    "result": null
  }
}
```

**Error Responses**:

*Not Found*:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "statusCode": 404,
  "message": "Prescription avec l'ID 550e8400-e29b-41d4-a716-446655440000 introuvable",
  "error": "Not Found"
}
```

*Invalid UUID*:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": "ID de prescription invalide",
  "error": "Bad Request"
}
```

**Business Rules**:
- Inclut les données complètes du patient et du médecin
- Inclut le résultat (result) s'il existe (null sinon)
- Retourne 404 si la prescription n'existe pas

---

### 4. Mettre à Jour une Prescription

**Endpoint**: `PATCH /api/prescriptions/:id`

**Description**: Mettre à jour les détails d'une prescription (texte, statut, ou associations)

**Authentication**: Required (Session)

**Authorization**:
- DOCTOR: peut modifier le texte et envoyer au laboratoire (CREATED → SENT_TO_LAB)
- BIOLOGIST: peut mettre à jour le statut (SENT_TO_LAB → IN_PROGRESS → COMPLETED)
- ADMIN: peut tout modifier

**Request Headers**:
```http
Content-Type: application/json
Cookie: connect.sid={session-id}
```

**Path Parameters**:
```typescript
{
  id: string;  // UUID de la prescription
}
```

**Request Body**:
```typescript
{
  text?: string;                    // Nouveau texte (ADMIN uniquement)
  status?: PrescriptionStatus;      // Nouveau statut
  patientId?: string;               // Nouveau patient (ADMIN uniquement)
  doctorId?: string;                // Nouveau médecin (ADMIN uniquement)
}
```

**Request Body Schema (DTO)**:
```typescript
class UpdatePrescriptionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  @IsOptional()
  text?: string;

  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;

  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;
}
```

**Example Requests**:

*Envoi au laboratoire (DOCTOR)*:
```json
{
  "status": "SENT_TO_LAB"
}
```

*Mise en cours (BIOLOGIST)*:
```json
{
  "status": "IN_PROGRESS"
}
```

*Finalisation (BIOLOGIST)*:
```json
{
  "status": "COMPLETED"
}
```

*Correction complète (ADMIN)*:
```json
{
  "text": "Analyse sanguine complète corrigée: NFS, créatinine, urée",
  "status": "CREATED",
  "patientId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Analyse sanguine complète: NFS, glycémie à jeun, cholestérol total",
    "status": "SENT_TO_LAB",
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "doctorId": "789e0123-e89b-12d3-a456-426614174000",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T10:35:00.000Z",
    "patient": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "Marie",
      "lastName": "Dupont",
      "birthDate": "1985-05-15T00:00:00.000Z"
    },
    "doctor": {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "name": "Dr. Jean Martin",
      "email": "doctor@hospital.com"
    }
  },
  "message": "Prescription modifiée avec succès"
}
```

**Error Responses**:

*Invalid Status Transition*:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": "Transition de statut invalide: CREATED → COMPLETED",
  "error": "Bad Request"
}
```

*Forbidden - Wrong Role*:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Vous n'avez pas les permissions nécessaires",
  "error": "Forbidden"
}
```

*Prescription Not Found*:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "statusCode": 404,
  "message": "Prescription avec l'ID 550e8400-e29b-41d4-a716-446655440000 introuvable",
  "error": "Not Found"
}
```

**Business Rules**:
- Transitions de statut validées côté serveur:
  - CREATED → SENT_TO_LAB (DOCTOR, ADMIN)
  - SENT_TO_LAB → IN_PROGRESS (BIOLOGIST, ADMIN)
  - IN_PROGRESS → COMPLETED (BIOLOGIST, ADMIN)
- DOCTOR ne peut modifier que ses propres prescriptions (sauf ADMIN)
- ADMIN peut outrepasser toutes les règles de transition
- La date updatedAt est automatiquement mise à jour
- Vérification d'existence du patient/médecin si modifiés

---

### 5. Supprimer une Prescription

**Endpoint**: `DELETE /api/prescriptions/:id`

**Description**: Supprimer définitivement une prescription (ADMIN uniquement)

**Authentication**: Required (Session)

**Authorization**: ADMIN only

**Request Headers**:
```http
Cookie: connect.sid={session-id}
```

**Path Parameters**:
```typescript
{
  id: string;  // UUID de la prescription
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Prescription supprimée avec succès"
}
```

**Error Responses**:

*Forbidden (not admin)*:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Vous n'avez pas les permissions nécessaires",
  "error": "Forbidden"
}
```

*Not Found*:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "statusCode": 404,
  "message": "Prescription avec l'ID 550e8400-e29b-41d4-a716-446655440000 introuvable",
  "error": "Not Found"
}
```

**Business Rules**:
- Suppression physique (hard delete)
- Cascade delete: si un résultat existe, il est supprimé aussi (Prisma)
- Opération irréversible
- À utiliser uniquement pour correction d'erreurs graves

---

## Matrice d'Autorisation

| Endpoint | Method | ADMIN | DOCTOR | BIOLOGIST | SECRETARY |
|----------|--------|-------|--------|-----------|-----------|
| `/prescriptions` | GET | ✓ | ✓ | ✓ | ✓ |
| `/prescriptions/:id` | GET | ✓ | ✓ | ✓ | ✓ |
| `/prescriptions` | POST | ✓ | ✓ | ✗ | ✗ |
| `/prescriptions/:id` (text) | PATCH | ✓ | ✓* | ✗ | ✗ |
| `/prescriptions/:id` (status: SENT_TO_LAB) | PATCH | ✓ | ✓* | ✗ | ✗ |
| `/prescriptions/:id` (status: IN_PROGRESS) | PATCH | ✓ | ✗ | ✓ | ✗ |
| `/prescriptions/:id` (status: COMPLETED) | PATCH | ✓ | ✗ | ✓ | ✗ |
| `/prescriptions/:id` | DELETE | ✓ | ✗ | ✗ | ✗ |

*DOCTOR peut modifier uniquement ses propres prescriptions

---

## Règles de Validation

### CreatePrescriptionDto
```typescript
{
  text: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 10000,
    errorMessages: {
      required: 'Le texte de la prescription est obligatoire',
      minLength: 'Le texte doit contenir au moins 10 caractères',
      maxLength: 'Le texte ne peut pas dépasser 10000 caractères'
    }
  },
  patientId: {
    type: 'uuid',
    required: true,
    errorMessages: {
      required: 'L\'ID du patient est obligatoire',
      uuid: 'L\'ID du patient doit être un UUID valide'
    }
  }
}
```

### UpdatePrescriptionDto
```typescript
{
  text: {
    type: 'string',
    optional: true,
    minLength: 10,
    maxLength: 10000
  },
  status: {
    type: 'enum',
    optional: true,
    enum: ['CREATED', 'SENT_TO_LAB', 'IN_PROGRESS', 'COMPLETED'],
    errorMessages: {
      enum: 'Le statut doit être CREATED, SENT_TO_LAB, IN_PROGRESS ou COMPLETED'
    }
  },
  patientId: {
    type: 'uuid',
    optional: true
  },
  doctorId: {
    type: 'uuid',
    optional: true
  }
}
```

---

## Transitions de Statut

### Diagramme de Transition
```
CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED
```

### Règles de Transition

| From | To | Allowed Roles | Validation |
|------|-----|---------------|------------|
| CREATED | SENT_TO_LAB | DOCTOR (owner), ADMIN | Prescription doit être au statut CREATED |
| SENT_TO_LAB | IN_PROGRESS | BIOLOGIST, ADMIN | Prescription doit être au statut SENT_TO_LAB |
| IN_PROGRESS | COMPLETED | BIOLOGIST, ADMIN | Prescription doit être au statut IN_PROGRESS |
| * | * | ADMIN | Aucune validation (override complet) |

### Transitions Interdites (pour tous sauf ADMIN)
- Retour en arrière (SENT_TO_LAB → CREATED)
- Saut d'étape (CREATED → IN_PROGRESS)
- Saut d'étape (SENT_TO_LAB → COMPLETED)

---

## Codes de Statut HTTP

### Success Codes
- `200 OK`: Requête réussie (GET, PATCH, DELETE)
- `201 Created`: Ressource créée (POST)

### Client Error Codes
- `400 Bad Request`: Validation échouée, données invalides, transition de statut invalide
- `401 Unauthorized`: Session manquante ou expirée
- `403 Forbidden`: Permissions insuffisantes
- `404 Not Found`: Ressource non trouvée

### Server Error Codes
- `500 Internal Server Error`: Erreur serveur inattendue

---

## Gestion des Erreurs

### Format de Réponse d'Erreur Standard
```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
}
```

### Exemples d'Erreurs Métier

**Patient Not Found**:
```json
{
  "statusCode": 400,
  "message": "Patient introuvable",
  "error": "Bad Request"
}
```

**Invalid Status Transition**:
```json
{
  "statusCode": 400,
  "message": "Transition de statut invalide: CREATED → COMPLETED",
  "error": "Bad Request"
}
```

**Not Owner**:
```json
{
  "statusCode": 403,
  "message": "Vous ne pouvez modifier que vos propres prescriptions",
  "error": "Forbidden"
}
```

---

## Exemples de Workflows Complets

### Workflow 1: Création et Envoi au Laboratoire (DOCTOR)

**Step 1: Créer la prescription**
```http
POST /api/prescriptions
Content-Type: application/json

{
  "text": "Analyse sanguine complète: NFS, glycémie, cholestérol",
  "patientId": "123e4567-e89b-12d3-a456-426614174000"
}

Response: 201 Created
{
  "data": { ... "status": "CREATED" ... },
  "message": "Prescription créée avec succès"
}
```

**Step 2: Envoyer au laboratoire**
```http
PATCH /api/prescriptions/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "SENT_TO_LAB"
}

Response: 200 OK
{
  "data": { ... "status": "SENT_TO_LAB" ... },
  "message": "Prescription modifiée avec succès"
}
```

---

### Workflow 2: Traitement au Laboratoire (BIOLOGIST)

**Step 1: Consulter les prescriptions en attente**
```http
GET /api/prescriptions?status=SENT_TO_LAB

Response: 200 OK
{
  "data": [
    { ... "status": "SENT_TO_LAB" ... }
  ]
}
```

**Step 2: Commencer l'analyse**
```http
PATCH /api/prescriptions/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}

Response: 200 OK
{
  "data": { ... "status": "IN_PROGRESS" ... },
  "message": "Prescription modifiée avec succès"
}
```

**Step 3: Terminer l'analyse**
```http
PATCH /api/prescriptions/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "COMPLETED"
}

Response: 200 OK
{
  "data": { ... "status": "COMPLETED" ... },
  "message": "Prescription modifiée avec succès"
}
```

---

### Workflow 3: Correction d'Erreur (ADMIN)

**Step 1: Identifier la prescription erronée**
```http
GET /api/prescriptions/550e8400-e29b-41d4-a716-446655440000

Response: 200 OK
{
  "data": {
    "text": "Texte erroné...",
    "status": "IN_PROGRESS",
    "patientId": "wrong-patient-id"
  }
}
```

**Step 2: Corriger les données**
```http
PATCH /api/prescriptions/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "text": "Texte corrigé: Analyse sanguine complète",
  "status": "CREATED",
  "patientId": "123e4567-e89b-12d3-a456-426614174000"
}

Response: 200 OK
{
  "data": { ... données corrigées ... },
  "message": "Prescription modifiée avec succès"
}
```

**Step 3 (optionnel): Supprimer si erreur grave**
```http
DELETE /api/prescriptions/550e8400-e29b-41d4-a716-446655440000

Response: 200 OK
{
  "message": "Prescription supprimée avec succès"
}
```

---

## Configuration CORS

```typescript
// Dans main.ts
app.enableCors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true,                 // Requis pour les cookies de session
});
```

---

## Configuration de Session

```typescript
// Dans main.ts
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    },
  }),
);
```

---

## Prisma Schema Reference

```prisma
model Prescription {
  id         String              @id @default(uuid())
  text       String              @db.Text
  status     PrescriptionStatus  @default(CREATED)
  patientId  String
  doctorId   String
  patient    Patient             @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctor     User                @relation("DoctorPrescriptions", fields: [doctorId], references: [id], onDelete: Cascade)
  result     Result?
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@map("prescriptions")
}

enum PrescriptionStatus {
  CREATED
  SENT_TO_LAB
  IN_PROGRESS
  COMPLETED
}
```

---

## Performance Requirements

| Endpoint | Target Response Time | Notes |
|----------|---------------------|-------|
| POST /prescriptions | < 150ms | Includes patient/doctor validation |
| GET /prescriptions | < 300ms | With filters and includes |
| GET /prescriptions/:id | < 100ms | Single record with includes |
| PATCH /prescriptions/:id | < 100ms | Status update only |
| DELETE /prescriptions/:id | < 100ms | Cascade delete included |

---

## Frontend Integration Notes

### Axios Configuration
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // CRITICAL pour les cookies de session
});

export default api;
```

### Service Layer Example
```typescript
// src/services/prescriptionService.ts
import api from './api';

export const prescriptionService = {
  create: async (data: CreatePrescriptionDto) => {
    const response = await api.post('/prescriptions', data);
    return response.data;
  },

  findAll: async (filters?: { patientId?: string; doctorId?: string; status?: string }) => {
    const response = await api.get('/prescriptions', { params: filters });
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: PrescriptionStatus) => {
    const response = await api.patch(`/prescriptions/${id}`, { status });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/prescriptions/${id}`);
    return response.data;
  },
};
```

### Error Handling Pattern
```typescript
try {
  const result = await prescriptionService.create(data);
  setMessage(result.message);
} catch (err: any) {
  const errorMessage = err.response?.data?.message || 'Une erreur est survenue';
  setError(errorMessage);
}
```

---

## Testing Checklist

### Backend API Tests
- [ ] POST /prescriptions - Success avec données valides
- [ ] POST /prescriptions - Error 400 patient introuvable
- [ ] POST /prescriptions - Error 400 validation échouée
- [ ] POST /prescriptions - Error 403 role non autorisé
- [ ] GET /prescriptions - Success sans filtres
- [ ] GET /prescriptions - Success avec filtre patientId
- [ ] GET /prescriptions - Success avec filtre status
- [ ] GET /prescriptions/:id - Success
- [ ] GET /prescriptions/:id - Error 404 not found
- [ ] PATCH /prescriptions/:id - Success CREATED → SENT_TO_LAB (DOCTOR)
- [ ] PATCH /prescriptions/:id - Success SENT_TO_LAB → IN_PROGRESS (BIOLOGIST)
- [ ] PATCH /prescriptions/:id - Success IN_PROGRESS → COMPLETED (BIOLOGIST)
- [ ] PATCH /prescriptions/:id - Error 400 transition invalide
- [ ] PATCH /prescriptions/:id - Error 403 not owner
- [ ] DELETE /prescriptions/:id - Success (ADMIN)
- [ ] DELETE /prescriptions/:id - Error 403 not admin

### Frontend Integration Tests
- [ ] Formulaire de création affiche les champs requis
- [ ] Soumission formulaire envoie requête POST
- [ ] Message de succès affiché après création
- [ ] Message d'erreur affiché si patient invalide
- [ ] Liste des prescriptions affichée
- [ ] Filtres fonctionnent correctement
- [ ] Badges de statut colorés affichés
- [ ] Boutons d'action conditionnels selon rôle
- [ ] Bouton "Envoyer au labo" visible pour DOCTOR sur status CREATED
- [ ] Bouton "Commencer" visible pour BIOLOGIST sur status SENT_TO_LAB
- [ ] Bouton "Terminer" visible pour BIOLOGIST sur status IN_PROGRESS
- [ ] Confirmation dialog pour suppression (ADMIN)

---

## Migration Path (Si Évolutions Futures)

### V1 → V2 Potential Changes
- Ajout de pagination: `GET /prescriptions?page=1&limit=20`
- Ajout de tri: `GET /prescriptions?sortBy=createdAt&order=desc`
- Recherche full-text: `GET /prescriptions?search=analyse`
- Bulk operations: `PATCH /prescriptions/bulk`
- Webhooks pour notifications
- Rate limiting par utilisateur

### Versioning Strategy
- URL versioning: `/api/v1/prescriptions`, `/api/v2/prescriptions`
- Header versioning: `Accept: application/vnd.hospital.v1+json`

---

## Glossaire API

- **UUID**: Identifiant unique universel (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **DTO**: Data Transfer Object, définit la structure des requêtes/réponses
- **Session**: Mécanisme d'authentification côté serveur avec cookies
- **Guard**: Middleware NestJS pour protéger les routes
- **Cascade Delete**: Suppression automatique des entités liées
- **Include**: Option Prisma pour joindre les relations dans la réponse
- **CORS**: Cross-Origin Resource Sharing, configuration pour autoriser les requêtes cross-domain

---

**Document généré le**: 2026-01-03
**API Version**: 1.0
**Prochaine étape**: Workflow Documentation
