# Plan d'Implémentation - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions Implementation Plan
- **Version**: 1.0
- **Date**: 2026-01-03
- **Durée Estimée**: 9-10 heures (Jour 4)

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Phase 1: Backend (4-5h)](#phase-1-backend-4-5h)
3. [Phase 2: Frontend (5h)](#phase-2-frontend-5h)
4. [Phase 3: Tests et Validation (1h)](#phase-3-tests-et-validation-1h)
5. [Checklist de Complétude](#checklist-de-complétude)
6. [Points de Validation](#points-de-validation)

---

## Vue d'Ensemble

### Stratégie d'Implémentation

**Approche**: Backend-First Development
- Développer et tester le backend complètement avant le frontend
- Utiliser Postman/curl pour validation backend
- Frontend consomme API testée et fonctionnelle

**Ordre d'Exécution**:
1. **Backend** (4-5h): Module → DTOs → Service → Controller → Tests
2. **Frontend** (5h): Types → Service → Composants → Routes → Tests
3. **Validation** (1h): Tests intégrés, corrections, documentation

### Estimation de Temps

| Phase | Tâches | Estimation |
|-------|--------|------------|
| Phase 1 | Backend complet | 4-5h |
| Phase 2 | Frontend complet | 5h |
| Phase 3 | Tests et validation | 1h |
| **Total** | **Développement complet** | **9-10h** |

**Confortable pour Jour 4** (8h de travail effectif)

---

## Phase 1: Backend (4-5h)

### Tâche 1.1: Créer la Structure du Module (15 min)

**Objectif**: Générer la structure de base NestJS

**Commandes**:
```bash
cd backend

# Générer le module
npx nest generate module prescriptions

# Générer le service
npx nest generate service prescriptions --no-spec

# Générer le controller
npx nest generate controller prescriptions --no-spec
```

**Fichiers Créés**:
```
backend/src/prescriptions/
├── prescriptions.module.ts
├── prescriptions.service.ts
└── prescriptions.controller.ts
```

**Validation**:
- [x] Module créé et importé automatiquement dans AppModule
- [x] Service et Controller générés
- [x] `npm run start:dev` démarre sans erreur

---

### Tâche 1.2: Créer les DTOs (30 min)

**Objectif**: Définir et valider les structures de données

#### CreatePrescriptionDto

**Fichier**: `backend/src/prescriptions/dto/create-prescription.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePrescriptionDto {
  @IsString({ message: 'Le texte doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le texte de la prescription est obligatoire' })
  @MinLength(10, {
    message: 'Le texte doit contenir au moins 10 caractères',
  })
  @MaxLength(10000, {
    message: 'Le texte ne peut pas dépasser 10000 caractères',
  })
  text: string;

  @IsUUID('4', { message: "L'ID du patient doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du patient est obligatoire" })
  patientId: string;
}
```

#### UpdatePrescriptionDto

**Fichier**: `backend/src/prescriptions/dto/update-prescription.dto.ts`

```typescript
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PrescriptionStatus } from '@prisma/client';

export class UpdatePrescriptionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  @IsOptional()
  text?: string;

  @IsEnum(PrescriptionStatus, {
    message:
      'Le statut doit être CREATED, SENT_TO_LAB, IN_PROGRESS ou COMPLETED',
  })
  @IsOptional()
  status?: PrescriptionStatus;

  @IsUUID('4')
  @IsOptional()
  patientId?: string;

  @IsUUID('4')
  @IsOptional()
  doctorId?: string;
}
```

**Validation**:
- [x] DTOs compilent sans erreur TypeScript
- [x] Validation messages en français
- [x] Import PrescriptionStatus depuis @prisma/client

---

### Tâche 1.3: Implémenter PrescriptionsService (2-3h)

**Objectif**: Implémenter toute la logique métier

**Fichier**: `backend/src/prescriptions/prescriptions.service.ts`

**Méthodes à Implémenter**:

1. **create(dto, doctorId)** (30 min)
   - Vérifier patient existe
   - Créer prescription avec status CREATED
   - Include relations (patient, doctor)
   - Retourner prescription complète

2. **findAll(patientId?, doctorId?, status?)** (20 min)
   - Construire where clause dynamique
   - Include relations
   - OrderBy createdAt DESC
   - Retourner liste

3. **findOne(id)** (15 min)
   - FindUnique avec include
   - Throw NotFoundException si inexistant
   - Retourner prescription

4. **update(id, dto, userId, userRole)** (45 min)
   - Vérifier prescription existe
   - Valider ownership pour DOCTOR
   - Valider permissions pour champs (text, patientId, doctorId → ADMIN only)
   - Valider transition de statut (si status fourni)
   - Vérifier patient/médecin existent si modifiés
   - Update et retourner

5. **remove(id)** (15 min)
   - Vérifier prescription existe
   - Delete (cascade sur Result automatique)
   - Retourner message succès

6. **validateStatusTransition(current, new, role, userId, doctorId)** (30 min)
   - Définir matrice de transitions autorisées
   - ADMIN bypass
   - Vérifier transition autorisée
   - Vérifier rôle autorisé
   - Vérifier ownership pour DOCTOR
   - Throw exceptions appropriées

7. **getUserById(userId)** (10 min)
   - Méthode utilitaire
   - FindUnique user
   - Throw NotFoundException si inexistant

**Code Structure**:
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionStatus, Role } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
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
  };

  async create(createPrescriptionDto: CreatePrescriptionDto, doctorId: string) {
    // Implementation...
  }

  async findAll(patientId?: string, doctorId?: string, status?: PrescriptionStatus) {
    // Implementation...
  }

  async findOne(id: string) {
    // Implementation...
  }

  async update(
    id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
    userId: string,
    userRole: Role,
  ) {
    // Implementation...
  }

  async remove(id: string) {
    // Implementation...
  }

  private validateStatusTransition(
    currentStatus: PrescriptionStatus,
    newStatus: PrescriptionStatus,
    userRole: Role,
    userId: string,
    prescriptionDoctorId: string,
  ): void {
    // Implementation...
  }

  async getUserById(userId: string) {
    // Implementation...
  }
}
```

**Validation**:
- [x] Toutes les méthodes implémentées
- [x] validateStatusTransition couvre tous les cas
- [x] Exceptions appropriées lancées
- [x] Messages en français
- [x] Code compile sans erreur TypeScript

---

### Tâche 1.4: Implémenter PrescriptionsController (1h)

**Objectif**: Définir les routes API avec guards

**Fichier**: `backend/src/prescriptions/prescriptions.controller.ts`

**Routes à Implémenter**:

1. **POST /api/prescriptions** (15 min)
   - @UseGuards(AuthGuard, RolesGuard)
   - @Roles(Role.DOCTOR, Role.ADMIN)
   - @CurrentUser() userId
   - Appeler service.create()
   - Format réponse: { data, message }

2. **GET /api/prescriptions** (10 min)
   - @UseGuards(AuthGuard)
   - @Query() patientId, doctorId, status
   - Appeler service.findAll()
   - Format réponse: { data }

3. **GET /api/prescriptions/:id** (10 min)
   - @UseGuards(AuthGuard)
   - @Param('id') id
   - Appeler service.findOne()
   - Format réponse: { data }

4. **PATCH /api/prescriptions/:id** (15 min)
   - @UseGuards(AuthGuard, RolesGuard)
   - @Roles(Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
   - @CurrentUser() userId, @Session() session
   - Récupérer user pour obtenir role
   - Appeler service.update()
   - Format réponse: { data, message }

5. **DELETE /api/prescriptions/:id** (10 min)
   - @UseGuards(AuthGuard, RolesGuard)
   - @Roles(Role.ADMIN)
   - Appeler service.remove()
   - Retourner message

**Code Structure**:
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Session,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, PrescriptionStatus } from '@prisma/client';
import { SessionData } from '../types/session';

@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() userId: string,
  ) {
    // Implementation...
  }

  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: PrescriptionStatus,
  ) {
    // Implementation...
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Implementation...
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
    @CurrentUser() userId: string,
    @Session() session: SessionData,
  ) {
    // Implementation...
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    // Implementation...
  }
}
```

**Validation**:
- [x] Toutes les routes définies
- [x] Guards appliqués correctement
- [x] Format réponse standardisé
- [x] Code compile sans erreur

---

### Tâche 1.5: Configurer le Module (15 min)

**Objectif**: Finaliser configuration et export

**Fichier**: `backend/src/prescriptions/prescriptions.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // PrismaModule est @Global()
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService], // Pour ResultsModule (Jour 5)
})
export class PrescriptionsModule {}
```

**Fichier**: `backend/src/app.module.ts` (ajouter import)

```typescript
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule, // ← AJOUTER ICI
  ],
})
export class AppModule {}
```

**Validation**:
- [x] Module importé dans AppModule
- [x] PrismaModule importé dans PrescriptionsModule
- [x] Service exporté pour réutilisation future
- [x] Server démarre sans erreur

---

### Tâche 1.6: Tests Backend avec Postman/curl (1h)

**Objectif**: Valider tous les endpoints et scénarios

**Scénarios à Tester**:

1. **Création** (15 min)
   - [x] POST avec données valides (DOCTOR) → 201 Created
   - [x] POST avec patient inexistant → 400 Bad Request
   - [x] POST avec texte < 10 caractères → 400 Bad Request
   - [x] POST sans session → 401 Unauthorized
   - [x] POST avec BIOLOGIST → 403 Forbidden

2. **Consultation** (15 min)
   - [x] GET /prescriptions → 200 OK (liste complète)
   - [x] GET /prescriptions?status=CREATED → 200 OK (filtrée)
   - [x] GET /prescriptions/:id → 200 OK
   - [x] GET /prescriptions/:invalid-id → 404 Not Found
   - [x] GET sans session → 401 Unauthorized

3. **Transitions de Statut** (20 min)
   - [x] PATCH CREATED → SENT_TO_LAB (DOCTOR owner) → 200 OK
   - [x] PATCH CREATED → SENT_TO_LAB (DOCTOR non-owner) → 403 Forbidden
   - [x] PATCH SENT_TO_LAB → IN_PROGRESS (BIOLOGIST) → 200 OK
   - [x] PATCH IN_PROGRESS → COMPLETED (BIOLOGIST) → 200 OK
   - [x] PATCH CREATED → IN_PROGRESS (saut d'étape) → 400 Bad Request
   - [x] PATCH COMPLETED → CREATED (retour) → 400 Bad Request

4. **Modification Texte** (10 min)
   - [x] PATCH text (ADMIN) → 200 OK
   - [x] PATCH text (DOCTOR) → 403 Forbidden

5. **Suppression** (10 min)
   - [x] DELETE (ADMIN) → 200 OK
   - [x] DELETE (DOCTOR) → 403 Forbidden
   - [x] DELETE prescription inexistante → 404 Not Found

**Collection Postman**:
Créer collection "Prescriptions API" avec:
- Environnement: baseUrl = http://localhost:3000/api
- Pre-request script: obtenir session cookie depuis login
- Tests pour chaque requête validant status code et structure réponse

**Validation Phase 1 Backend**:
- [x] Tous les tests passent
- [x] Messages d'erreur en français
- [x] Format réponse standardisé { data, message? }
- [x] Relations patient/doctor incluses
- [x] Pas de mots de passe exposés

---

## Phase 2: Frontend (5h)

### Tâche 2.1: Créer les Types TypeScript (30 min)

**Objectif**: Définir les interfaces TypeScript

**Fichier**: `frontend/src/types/Prescription.ts`

```typescript
export enum PrescriptionStatus {
  CREATED = 'CREATED',
  SENT_TO_LAB = 'SENT_TO_LAB',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Prescription {
  id: string;
  text: string;
  status: PrescriptionStatus;
  patientId: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  result?: {
    id: string;
    text: string;
    createdAt: string;
  } | null;
}

export interface CreatePrescriptionDto {
  text: string;
  patientId: string;
}

export interface UpdatePrescriptionDto {
  text?: string;
  status?: PrescriptionStatus;
  patientId?: string;
  doctorId?: string;
}
```

**Validation**:
- [x] Types compilent sans erreur
- [x] Alignés avec backend DTOs
- [x] Enum PrescriptionStatus identique

---

### Tâche 2.2: Créer le Service API (30 min)

**Objectif**: Implémenter la couche service frontend

**Fichier**: `frontend/src/services/prescriptionService.ts`

```typescript
import api from './api';
import {
  Prescription,
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  PrescriptionStatus,
} from '../types/Prescription';

export const prescriptionService = {
  create: async (data: CreatePrescriptionDto) => {
    const response = await api.post<{ data: Prescription; message: string }>(
      '/prescriptions',
      data
    );
    return response.data;
  },

  findAll: async (filters?: {
    patientId?: string;
    doctorId?: string;
    status?: PrescriptionStatus;
  }) => {
    const response = await api.get<{ data: Prescription[] }>(
      '/prescriptions',
      { params: filters }
    );
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await api.get<{ data: Prescription }>(
      `/prescriptions/${id}`
    );
    return response.data;
  },

  update: async (id: string, data: UpdatePrescriptionDto) => {
    const response = await api.patch<{ data: Prescription; message: string }>(
      `/prescriptions/${id}`,
      data
    );
    return response.data;
  },

  updateStatus: async (id: string, status: PrescriptionStatus) => {
    return prescriptionService.update(id, { status });
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(
      `/prescriptions/${id}`
    );
    return response.data;
  },
};
```

**Vérifier api.ts**:
```typescript
// frontend/src/services/api.ts (déjà existant)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // CRITIQUE pour cookies
});

export default api;
```

**Validation**:
- [x] Service compile sans erreur
- [x] Toutes les méthodes définies
- [x] Types de retour corrects
- [x] withCredentials: true configuré

---

### Tâche 2.3: Créer PrescriptionsList.tsx (1.5h)

**Objectif**: Composant liste avec filtres et actions

**Fichier**: `frontend/src/pages/Prescriptions/PrescriptionsList.tsx`

**Fonctionnalités**:
- Liste des prescriptions dans Table Material-UI
- Filtre par statut (Select)
- Badges colorés par statut (Chip)
- Boutons d'action conditionnels selon rôle
- Bouton "Créer" pour DOCTOR
- Inline status update
- Navigation vers détails

**Structure**:
```typescript
const PrescriptionsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');

  useEffect(() => {
    loadPrescriptions();
  }, [statusFilter]);

  const loadPrescriptions = async () => { /* ... */ };
  const getStatusColor = (status) => { /* ... */ };
  const getStatusLabel = (status) => { /* ... */ };
  const handleStatusUpdate = async (id, newStatus) => { /* ... */ };

  return (
    // JSX with Table, Filters, Buttons
  );
};
```

**Composants Material-UI**:
- Box, Paper, Typography
- Table, TableBody, TableCell, TableContainer, TableHead, TableRow
- Chip (badges)
- Button
- Select, MenuItem, FormControl, InputLabel
- Alert (messages d'erreur)

**Validation**:
- [x] Liste affichée correctement
- [x] Filtres fonctionnent
- [x] Badges colorés selon statut
- [x] Boutons conditionnels corrects
- [x] Navigation fonctionne

---

### Tâche 2.4: Créer CreatePrescription.tsx (1h)

**Objectif**: Formulaire création prescription

**Fichier**: `frontend/src/pages/Prescriptions/CreatePrescription.tsx`

**Fonctionnalités**:
- Autocomplete sélection patient
- TextField multiligne pour texte
- Validation frontend
- Loading state
- Messages succès/erreur
- Navigation après création

**Structure**:
```typescript
const CreatePrescription: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => { /* ... */ };
  const handleSubmit = async (e) => { /* ... */ };

  return (
    // JSX with Form
  );
};
```

**Composants Material-UI**:
- Box, Paper, Typography
- Autocomplete
- TextField (multiline)
- Button
- Alert
- CircularProgress

**Validation**:
- [x] Formulaire affiché
- [x] Autocomplete patients fonctionne
- [x] Validation frontend (texte min 10 chars)
- [x] Soumission crée prescription
- [x] Messages affichés
- [x] Navigation après succès

---

### Tâche 2.5: Créer PrescriptionDetails.tsx (1.5h)

**Objectif**: Page détails avec actions

**Fichier**: `frontend/src/pages/Prescriptions/PrescriptionDetails.tsx`

**Fonctionnalités**:
- Affichage complet prescription
- Informations patient et médecin
- Badge statut
- Boutons d'action conditionnels (DOCTOR, BIOLOGIST, ADMIN)
- Confirmation dialogs
- Mise à jour statut
- Suppression (ADMIN)

**Structure**:
```typescript
const PrescriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    newStatus?: PrescriptionStatus;
  }>({ open: false, action: '' });

  useEffect(() => {
    if (id) loadPrescription();
  }, [id]);

  const loadPrescription = async () => { /* ... */ };
  const handleStatusUpdate = async (newStatus) => { /* ... */ };
  const handleDelete = async () => { /* ... */ };

  return (
    // JSX with Details + Dialog
  );
};
```

**Composants Material-UI**:
- Box, Paper, Typography
- Grid
- Chip
- Button
- Dialog, DialogTitle, DialogContent, DialogActions
- Alert

**Validation**:
- [x] Détails affichés complets
- [x] Boutons conditionnels corrects
- [x] Confirmation dialogs fonctionnent
- [x] Actions de statut fonctionnent
- [x] Suppression fonctionne (ADMIN)

---

### Tâche 2.6: Ajouter les Routes (15 min)

**Objectif**: Configurer React Router

**Fichier**: `frontend/src/App.tsx` (ajouter routes)

```typescript
import PrescriptionsList from './pages/Prescriptions/PrescriptionsList';
import CreatePrescription from './pages/Prescriptions/CreatePrescription';
import PrescriptionDetails from './pages/Prescriptions/PrescriptionDetails';

function App() {
  return (
    <Routes>
      {/* ... routes existantes ... */}

      {/* Routes Prescriptions */}
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/create"
        element={
          <ProtectedRoute>
            <CreatePrescription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:id"
        element={
          <ProtectedRoute>
            <PrescriptionDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

**Validation**:
- [x] Routes accessibles
- [x] ProtectedRoute appliqué
- [x] Navigation fonctionne
- [x] Paramètres `:id` extraits correctement

---

### Tâche 2.7: Créer Dossier Structure (5 min)

**Objectif**: Organiser fichiers frontend

```bash
cd frontend/src

# Créer dossier pages
mkdir -p pages/Prescriptions

# Créer fichiers (via IDE)
# - pages/Prescriptions/PrescriptionsList.tsx
# - pages/Prescriptions/CreatePrescription.tsx
# - pages/Prescriptions/PrescriptionDetails.tsx

# Créer types
# - types/Prescription.ts

# Créer service
# - services/prescriptionService.ts
```

**Validation**:
- [x] Structure créée
- [x] Fichiers organisés
- [x] Imports fonctionnent

---

## Phase 3: Tests et Validation (1h)

### Tâche 3.1: Tests Frontend Manuels (30 min)

**Scénario 1: DOCTOR crée et envoie prescription**
1. Login comme doctor@hospital.com
2. Navigation vers /prescriptions
3. Clic "Créer Prescription"
4. Sélection patient
5. Saisie texte prescription
6. Soumission → Succès
7. Liste mise à jour avec nouvelle prescription
8. Badge "Créée" (gris)
9. Clic "Envoyer au labo"
10. Confirmation → Succès
11. Badge "Envoyée au labo" (bleu)

**Scénario 2: BIOLOGIST traite prescription**
1. Login comme biologist@hospital.com
2. Navigation vers /prescriptions
3. Filtre status: SENT_TO_LAB
4. Liste affiche prescriptions en attente
5. Clic "Commencer" sur une prescription
6. Badge passe à "En cours" (orange)
7. Filtre status: IN_PROGRESS
8. Liste affiche prescriptions en cours
9. Clic "Terminer"
10. Badge passe à "Terminée" (vert)

**Scénario 3: ADMIN gère prescriptions**
1. Login comme admin@hospital.com
2. Navigation vers /prescriptions
3. Vue complète toutes prescriptions
4. Clic détails d'une prescription
5. Bouton "Supprimer" visible
6. Confirmation suppression
7. Prescription supprimée

**Checklist Tests**:
- [x] Création fonctionne (DOCTOR)
- [x] Liste affichée correctement
- [x] Filtres fonctionnent
- [x] Badges colorés corrects
- [x] Transitions de statut fonctionnent
- [x] Boutons conditionnels selon rôle
- [x] Messages succès/erreur affichés
- [x] Navigation fonctionne
- [x] Suppression fonctionne (ADMIN)

---

### Tâche 3.2: Tests d'Intégration (20 min)

**Workflow Complet**:
1. DOCTOR crée prescription → CREATED
2. DOCTOR envoie au labo → SENT_TO_LAB
3. BIOLOGIST commence → IN_PROGRESS
4. BIOLOGIST termine → COMPLETED
5. Vérification: prescription visible pour tous
6. Vérification: résultat null (Jour 5)

**Tests de Permissions**:
- [x] BIOLOGIST ne peut pas créer
- [x] DOCTOR ne peut modifier que ses prescriptions
- [x] SECRETARY en lecture seule
- [x] ADMIN peut tout faire

**Tests de Validation**:
- [x] Texte < 10 chars → Erreur
- [x] Patient inexistant → Erreur
- [x] Transition invalide → Erreur
- [x] Session expirée → Redirection login

---

### Tâche 3.3: Corrections et Optimisations (10 min)

**Points d'Attention**:
- Vérifier tous les messages en français
- Vérifier pas d'erreurs console
- Vérifier pas de warnings TypeScript
- Vérifier formatage code (Prettier)
- Vérifier pas de code commenté
- Vérifier imports optimisés

**Optimisations**:
- Debounce pour filtres (si nécessaire)
- Loading skeletons (si temps)
- Error boundaries (si temps)

---

## Checklist de Complétude

### Backend

**Structure**:
- [x] Module créé et configuré
- [x] Service implémenté complètement
- [x] Controller implémenté complètement
- [x] DTOs créés et validés
- [x] Module importé dans AppModule

**Fonctionnalités**:
- [x] Création prescription
- [x] Consultation (liste et détails)
- [x] Filtrage (patient, médecin, statut)
- [x] Mise à jour (texte, statut)
- [x] Suppression
- [x] Validation transitions de statut
- [x] Validation permissions

**Qualité**:
- [x] Messages en français
- [x] Exceptions appropriées
- [x] Format réponse standardisé
- [x] Relations incluses
- [x] Pas de mots de passe exposés
- [x] Code compile sans erreur
- [x] Tous tests Postman passent

### Frontend

**Structure**:
- [x] Types TypeScript créés
- [x] Service API créé
- [x] Composants créés (Liste, Création, Détails)
- [x] Routes configurées

**Fonctionnalités**:
- [x] Liste prescriptions
- [x] Filtres fonctionnels
- [x] Création prescription
- [x] Détails prescription
- [x] Actions conditionnelles selon rôle
- [x] Transitions de statut
- [x] Suppression (ADMIN)

**UI/UX**:
- [x] Material-UI utilisé
- [x] Badges colorés par statut
- [x] Loading states
- [x] Messages succès/erreur
- [x] Confirmation dialogs
- [x] Navigation fluide

**Qualité**:
- [x] Code compile sans erreur
- [x] Pas d'erreurs console
- [x] Tests manuels passent
- [x] Responsive (desktop min 1024px)

---

## Points de Validation

### Checkpoint 1: Backend Complete (après Tâche 1.6)

**Critères**:
- ✅ Tous les endpoints fonctionnent
- ✅ Tous les tests Postman passent
- ✅ Messages d'erreur en français
- ✅ Transitions de statut validées
- ✅ Permissions respectées

**Si échec**: Corriger backend avant frontend

### Checkpoint 2: Frontend Liste (après Tâche 2.3)

**Critères**:
- ✅ Liste affichée
- ✅ Filtres fonctionnent
- ✅ Badges corrects
- ✅ Boutons conditionnels

**Si échec**: Débugger composant Liste

### Checkpoint 3: Frontend Complet (après Tâche 2.6)

**Critères**:
- ✅ Tous les composants fonctionnent
- ✅ Routes configurées
- ✅ Navigation fluide
- ✅ Actions fonctionnent

**Si échec**: Vérifier intégration composants

### Checkpoint 4: Final (après Tâche 3.3)

**Critères**:
- ✅ Workflow complet fonctionne
- ✅ Tous les tests passent
- ✅ Pas d'erreurs
- ✅ Code propre

**Si échec**: Corrections prioritaires

---

## Ordre de Développement Optimal

### Matin (4h) - Backend

```
09:00 - 09:15  Tâche 1.1: Créer structure module
09:15 - 09:45  Tâche 1.2: Créer DTOs
09:45 - 12:00  Tâche 1.3: Implémenter Service (pause 11h-11h15)
12:00 - 13:00  PAUSE DÉJEUNER
```

### Après-midi (5h) - Backend + Frontend

```
13:00 - 14:00  Tâche 1.4: Implémenter Controller
14:00 - 14:15  Tâche 1.5: Configurer Module
14:15 - 15:15  Tâche 1.6: Tests Backend (pause 14h45-15h)
15:15 - 15:45  Tâche 2.1: Types TypeScript
15:45 - 16:15  Tâche 2.2: Service API
16:15 - 17:00  PAUSE + Tâche 2.7: Structure dossiers
17:00 - 18:30  Tâche 2.3: PrescriptionsList
```

### Soir ou Jour suivant (continuation si nécessaire)

```
09:00 - 10:00  Tâche 2.4: CreatePrescription
10:00 - 11:30  Tâche 2.5: PrescriptionDetails (pause 11h-11h15)
11:30 - 11:45  Tâche 2.6: Routes
11:45 - 12:15  Tâche 3.1: Tests Frontend
12:15 - 12:35  Tâche 3.2: Tests Intégration
12:35 - 12:45  Tâche 3.3: Corrections
12:45 - 13:00  Documentation et commit
```

**Total**: ~9-10h de développement effectif

---

## Commandes de Développement

### Backend

```bash
# Démarrer serveur développement
cd backend
npm run start:dev

# Vérifier linting
npm run lint

# Build production
npm run build
```

### Frontend

```bash
# Démarrer serveur développement
cd frontend
npm run dev

# Vérifier linting
npm run lint

# Build production
npm run build
```

### Database

```bash
# Régénérer Prisma Client (si besoin)
cd backend
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio
```

---

## Résolution de Problèmes

### Problème: Erreurs TypeScript compilation

**Solution**:
1. Vérifier imports (chemins relatifs corrects)
2. Vérifier types alignés backend/frontend
3. Vérifier Prisma Client généré: `npx prisma generate`

### Problème: Session cookie non envoyée

**Solution**:
1. Vérifier CORS credentials: true (backend)
2. Vérifier withCredentials: true (frontend axios)
3. Vérifier même domaine (localhost:3000 ↔ localhost:5173)

### Problème: Transitions de statut refusées

**Solution**:
1. Vérifier statut actuel dans DB (Prisma Studio)
2. Vérifier rôle utilisateur
3. Vérifier ownership pour DOCTOR
4. Vérifier validateStatusTransition() dans Service

### Problème: Relations patient/doctor nulles

**Solution**:
1. Vérifier include relations dans Service
2. Vérifier select exclut password
3. Vérifier patient/médecin existent en DB

---

## Livrables Finaux

À la fin de l'implémentation:

**Backend**:
- [x] Module Prescriptions complet et fonctionnel
- [x] Tous les endpoints testés
- [x] Code propre et documenté

**Frontend**:
- [x] 3 composants fonctionnels
- [x] Service API complet
- [x] Routes configurées

**Documentation**:
- [x] Code commenté (logique complexe)
- [x] README mis à jour si nécessaire

**Tests**:
- [x] Tests manuels validés
- [x] Collection Postman sauvegardée

**Prêt pour**:
- [x] Module Results (Jour 5)
- [x] Intégration Electron (Jour 6)
- [x] Déploiement (Jour 7)

---

**Document généré le**: 2026-01-03
**Statut**: ✅ Ready for Implementation
**Estimation**: 9-10h (Jour 4)
**Prochaine étape**: Commencer Tâche 1.1 (Backend Module)
