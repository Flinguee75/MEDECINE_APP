# Architecture Technique - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions (Jour 4)
- **Phase**: Architecture System Design
- **Version**: 1.0
- **Date**: 2026-01-03
- **Architecte**: System Architecture Specialist
- **Statut**: Ready for Implementation

---

## Résumé Exécutif

Ce document définit l'architecture technique complète du module Prescriptions, incluant la structure backend (NestJS), l'architecture frontend (React), les patterns de conception, les flux de données et l'intégration avec les modules existants.

**Architecture**: Monorepo avec backend NestJS et frontend React
**Pattern Principal**: Modular Architecture avec RBAC (Role-Based Access Control)
**Validation**: State Machine Pattern pour gestion des transitions de statut

---

## Table des Matières

1. [Vue d'Ensemble de l'Architecture](#vue-densemble-de-larchitecture)
2. [Architecture Backend (NestJS)](#architecture-backend-nestjs)
3. [Architecture Frontend (React)](#architecture-frontend-react)
4. [Patterns de Conception](#patterns-de-conception)
5. [Flux de Données](#flux-de-données)
6. [Intégration avec Modules Existants](#intégration-avec-modules-existants)
7. [Sécurité et Contrôle d'Accès](#sécurité-et-contrôle-daccès)
8. [Gestion des États](#gestion-des-états)
9. [Diagrammes d'Architecture](#diagrammes-darchitecture)

---

## Vue d'Ensemble de l'Architecture

### Architecture Globale (C4 Context)

```
┌──────────────────────────────────────────────────────────────┐
│                    Hospital Management System                 │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │   Frontend   │      │   Backend    │      │ PostgreSQL │ │
│  │   (React)    │◄────►│   (NestJS)   │◄────►│  Database  │ │
│  │  Port 5173   │      │  Port 3000   │      │            │ │
│  └──────────────┘      └──────────────┘      └────────────┘ │
│         │                      │                             │
│    HTTP/REST            Session-based                        │
│  withCredentials          Auth                               │
└──────────────────────────────────────────────────────────────┘
         ▲                       ▲
         │                       │
    ┌────┴────┬────────┬────────┴────────┐
    │ DOCTOR  │ BIOLO  │ SECRETARY│ ADMIN │
    │         │  GIST  │          │       │
    └─────────┴────────┴──────────┴───────┘
```

### Architecture Modulaire (C4 Container)

```
Backend (NestJS)
├── PrismaModule (Global)
│   └── PrismaService
├── AuthModule
│   ├── AuthGuard
│   ├── RolesGuard
│   └── @CurrentUser Decorator
├── PatientsModule
│   └── PatientsService
├── AppointmentsModule
│   └── AppointmentsService
└── PrescriptionsModule ← NOUVEAU
    ├── PrescriptionsController
    ├── PrescriptionsService
    └── DTOs
        ├── CreatePrescriptionDto
        └── UpdatePrescriptionDto

Frontend (React)
├── Context
│   └── AuthContext (global state)
├── Services
│   ├── api.ts
│   ├── patientsService.ts
│   ├── appointmentsService.ts
│   └── prescriptionsService.ts ← NOUVEAU
├── Pages
│   ├── Patients/
│   ├── Appointments/
│   └── Prescriptions/ ← NOUVEAU
│       ├── PrescriptionsList.tsx
│       ├── CreatePrescription.tsx
│       └── PrescriptionDetails.tsx
└── Components
    └── Shared components (Material-UI)
```

---

## Architecture Backend (NestJS)

### Structure du Module Prescriptions

```
backend/src/prescriptions/
├── prescriptions.module.ts
├── prescriptions.controller.ts
├── prescriptions.service.ts
└── dto/
    ├── create-prescription.dto.ts
    └── update-prescription.dto.ts
```

### 1. PrescriptionsModule

**Fichier**: `prescriptions/prescriptions.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // PrismaModule est @Global()
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService], // Pour utilisation future par ResultsModule
})
export class PrescriptionsModule {}
```

**Responsabilités**:
- Déclarer le controller et service
- Importer PrismaModule pour accès database
- Exporter PrescriptionsService pour réutilisation

**Dépendances**:
- PrismaModule (global, accès DB)

### 2. PrescriptionsController

**Fichier**: `prescriptions/prescriptions.controller.ts`

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
  ForbiddenException,
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
@UseGuards(AuthGuard) // Toutes les routes requièrent authentification
export class PrescriptionsController {
  constructor(
    private readonly prescriptionsService: PrescriptionsService
  ) {}

  // POST /api/prescriptions
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() userId: string, // Extrait de la session
  ) {
    const prescription = await this.prescriptionsService.create(
      createPrescriptionDto,
      userId, // doctorId
    );
    return {
      data: prescription,
      message: 'Prescription créée avec succès',
    };
  }

  // GET /api/prescriptions?patientId=xxx&doctorId=xxx&status=xxx
  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: PrescriptionStatus,
  ) {
    const prescriptions = await this.prescriptionsService.findAll(
      patientId,
      doctorId,
      status,
    );
    return {
      data: prescriptions,
    };
  }

  // GET /api/prescriptions/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const prescription = await this.prescriptionsService.findOne(id);
    return {
      data: prescription,
    };
  }

  // PATCH /api/prescriptions/:id
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
    @CurrentUser() userId: string,
    @Session() session: SessionData,
  ) {
    // Récupérer le rôle de l'utilisateur
    const user = await this.prescriptionsService.getUserById(userId);

    const prescription = await this.prescriptionsService.update(
      id,
      updatePrescriptionDto,
      userId,
      user.role,
    );
    return {
      data: prescription,
      message: 'Prescription modifiée avec succès',
    };
  }

  // DELETE /api/prescriptions/:id
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // ADMIN uniquement
  async remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }
}
```

**Responsabilités**:
- Définir les routes API
- Appliquer les Guards (authentification et autorisation)
- Extraire les paramètres de requête
- Déléguer la logique métier au Service
- Formatter les réponses selon le standard `{ data, message? }`

**Guards Appliqués**:
- `@UseGuards(AuthGuard)` au niveau classe: toutes les routes requièrent session
- `@UseGuards(RolesGuard)` + `@Roles()` pour routes spécifiques

**Décorateurs Utilisés**:
- `@CurrentUser()`: Extrait userId de la session
- `@Roles()`: Définit les rôles autorisés

### 3. PrescriptionsService

**Fichier**: `prescriptions/prescriptions.service.ts`

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

  // Relation include standard pour éviter duplication
  private readonly includeRelations = {
    patient: true,
    doctor: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // NE PAS inclure password
      },
    },
    result: true, // null si pas encore créé (Jour 5)
  };

  async create(createPrescriptionDto: CreatePrescriptionDto, doctorId: string) {
    // Vérifier que le patient existe
    const patient = await this.prisma.patient.findUnique({
      where: { id: createPrescriptionDto.patientId },
    });
    if (!patient) {
      throw new BadRequestException('Patient introuvable');
    }

    // Créer la prescription
    const prescription = await this.prisma.prescription.create({
      data: {
        text: createPrescriptionDto.text,
        patientId: createPrescriptionDto.patientId,
        doctorId: doctorId, // Extrait de la session
        status: PrescriptionStatus.CREATED, // Statut initial
      },
      include: this.includeRelations,
    });

    return prescription;
  }

  async findAll(
    patientId?: string,
    doctorId?: string,
    status?: PrescriptionStatus,
  ) {
    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    return this.prisma.prescription.findMany({
      where,
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' }, // Plus récentes en premier
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!prescription) {
      throw new NotFoundException(
        `Prescription avec l'ID ${id} introuvable`
      );
    }

    return prescription;
  }

  async update(
    id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
    userId: string,
    userRole: Role,
  ) {
    // Vérifier que la prescription existe
    const prescription = await this.findOne(id);

    // Validation des permissions et transitions
    if (updatePrescriptionDto.status) {
      this.validateStatusTransition(
        prescription.status,
        updatePrescriptionDto.status,
        userRole,
        userId,
        prescription.doctorId,
      );
    }

    // Vérification ownership pour DOCTOR (sauf ADMIN)
    if (userRole === Role.DOCTOR && prescription.doctorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres prescriptions'
      );
    }

    // Validation: seul ADMIN peut modifier text, patientId, doctorId
    if (
      userRole !== Role.ADMIN &&
      (updatePrescriptionDto.text ||
        updatePrescriptionDto.patientId ||
        updatePrescriptionDto.doctorId)
    ) {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier ces champs'
      );
    }

    // Vérifier le nouveau patient s'il est modifié
    if (updatePrescriptionDto.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: updatePrescriptionDto.patientId },
      });
      if (!patient) {
        throw new BadRequestException('Patient introuvable');
      }
    }

    // Vérifier le nouveau médecin s'il est modifié
    if (updatePrescriptionDto.doctorId) {
      const doctor = await this.prisma.user.findUnique({
        where: { id: updatePrescriptionDto.doctorId },
      });
      if (!doctor || doctor.role !== Role.DOCTOR) {
        throw new BadRequestException(
          'Médecin introuvable ou rôle incorrect'
        );
      }
    }

    // Mettre à jour la prescription
    return this.prisma.prescription.update({
      where: { id },
      data: updatePrescriptionDto,
      include: this.includeRelations,
    });
  }

  async remove(id: string) {
    // Vérifier que la prescription existe
    await this.findOne(id);

    // Suppression physique (cascade sur Result si existe)
    await this.prisma.prescription.delete({
      where: { id },
    });

    return { message: 'Prescription supprimée avec succès' };
  }

  // Méthode utilitaire pour validation transitions
  private validateStatusTransition(
    currentStatus: PrescriptionStatus,
    newStatus: PrescriptionStatus,
    userRole: Role,
    userId: string,
    prescriptionDoctorId: string,
  ): void {
    // ADMIN bypass toutes les règles
    if (userRole === Role.ADMIN) {
      return;
    }

    // Définir les transitions autorisées
    const allowedTransitions: Record<
      PrescriptionStatus,
      {
        nextStatus: PrescriptionStatus | null;
        allowedRoles: Role[];
      }
    > = {
      CREATED: {
        nextStatus: PrescriptionStatus.SENT_TO_LAB,
        allowedRoles: [Role.DOCTOR],
      },
      SENT_TO_LAB: {
        nextStatus: PrescriptionStatus.IN_PROGRESS,
        allowedRoles: [Role.BIOLOGIST],
      },
      IN_PROGRESS: {
        nextStatus: PrescriptionStatus.COMPLETED,
        allowedRoles: [Role.BIOLOGIST],
      },
      COMPLETED: {
        nextStatus: null, // État final
        allowedRoles: [],
      },
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
        "Vous n'avez pas les permissions pour cette transition"
      );
    }

    // Vérification spéciale pour DOCTOR: doit être le créateur
    if (userRole === Role.DOCTOR && prescriptionDoctorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez envoyer que vos propres prescriptions'
      );
    }
  }

  // Méthode utilitaire pour récupérer un utilisateur
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }
}
```

**Responsabilités**:
- Logique métier complète
- Validation des données (patient existe, médecin existe)
- Validation des transitions de statut (state machine)
- Validation des permissions (ownership pour DOCTOR)
- Interaction avec Prisma pour opérations DB
- Gestion des erreurs avec exceptions appropriées

**Pattern Utilisé**: State Machine Pattern pour transitions de statut

**Validation des Transitions**:
```
CREATED → SENT_TO_LAB (DOCTOR owner)
SENT_TO_LAB → IN_PROGRESS (BIOLOGIST)
IN_PROGRESS → COMPLETED (BIOLOGIST)
* → * (ADMIN bypass)
```

### 4. DTOs (Data Transfer Objects)

#### CreatePrescriptionDto

**Fichier**: `prescriptions/dto/create-prescription.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le texte de la prescription est obligatoire' })
  @MinLength(10, { message: 'Le texte doit contenir au moins 10 caractères' })
  @MaxLength(10000, { message: 'Le texte ne peut pas dépasser 10000 caractères' })
  text: string;

  @IsUUID('4', { message: "L'ID du patient doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du patient est obligatoire" })
  patientId: string;
}
```

**Validation**:
- `text`: string, 10-10000 caractères, requis
- `patientId`: UUID v4, requis

**Note**: `doctorId` n'est PAS dans le DTO, il est extrait de la session

#### UpdatePrescriptionDto

**Fichier**: `prescriptions/dto/update-prescription.dto.ts`

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
    message: 'Le statut doit être CREATED, SENT_TO_LAB, IN_PROGRESS ou COMPLETED',
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
- Tous les champs optionnels
- `text`: 10-10000 caractères si fourni
- `status`: enum PrescriptionStatus
- `patientId`, `doctorId`: UUID v4

**Permission**: Seul ADMIN peut modifier `text`, `patientId`, `doctorId`

### Intégration dans AppModule

**Fichier**: `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module'; // ← AJOUTER

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

---

## Architecture Frontend (React)

### Structure du Module Prescriptions

```
frontend/src/
├── services/
│   └── prescriptionService.ts ← NOUVEAU
├── pages/
│   └── Prescriptions/ ← NOUVEAU
│       ├── PrescriptionsList.tsx
│       ├── CreatePrescription.tsx
│       └── PrescriptionDetails.tsx
├── types/
│   └── Prescription.ts ← NOUVEAU
└── App.tsx (ajouter routes)
```

### 1. Types TypeScript

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

### 2. Service API

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
  // Créer une prescription
  create: async (data: CreatePrescriptionDto) => {
    const response = await api.post<{ data: Prescription; message: string }>(
      '/prescriptions',
      data
    );
    return response.data;
  },

  // Lister les prescriptions avec filtres
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

  // Récupérer une prescription par ID
  findOne: async (id: string) => {
    const response = await api.get<{ data: Prescription }>(
      `/prescriptions/${id}`
    );
    return response.data;
  },

  // Mettre à jour une prescription
  update: async (id: string, data: UpdatePrescriptionDto) => {
    const response = await api.patch<{ data: Prescription; message: string }>(
      `/prescriptions/${id}`,
      data
    );
    return response.data;
  },

  // Mettre à jour uniquement le statut (raccourci)
  updateStatus: async (id: string, status: PrescriptionStatus) => {
    return prescriptionService.update(id, { status });
  },

  // Supprimer une prescription (ADMIN uniquement)
  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(
      `/prescriptions/${id}`
    );
    return response.data;
  },
};
```

**Configuration Axios** (déjà existante dans `api.ts`):
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // CRITIQUE pour cookies de session
});

export default api;
```

### 3. Composants React

#### PrescriptionsList.tsx

**Fichier**: `frontend/src/pages/Prescriptions/PrescriptionsList.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';

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

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;

      const response = await prescriptionService.findAll(filters);
      setPrescriptions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.CREATED:
        return 'default'; // gris
      case PrescriptionStatus.SENT_TO_LAB:
        return 'info'; // bleu
      case PrescriptionStatus.IN_PROGRESS:
        return 'warning'; // orange
      case PrescriptionStatus.COMPLETED:
        return 'success'; // vert
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: PrescriptionStatus) => {
    const labels = {
      CREATED: 'Créée',
      SENT_TO_LAB: 'Envoyée au labo',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
    };
    return labels[status] || status;
  };

  const handleStatusUpdate = async (
    prescriptionId: string,
    newStatus: PrescriptionStatus
  ) => {
    try {
      await prescriptionService.updateStatus(prescriptionId, newStatus);
      loadPrescriptions(); // Recharger la liste
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Prescriptions</Typography>
        {user?.role === 'DOCTOR' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/prescriptions/create')}
          >
            Créer une Prescription
          </Button>
        )}
      </Box>

      <Box mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PrescriptionStatus)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="CREATED">Créée</MenuItem>
            <MenuItem value="SENT_TO_LAB">Envoyée au labo</MenuItem>
            <MenuItem value="IN_PROGRESS">En cours</MenuItem>
            <MenuItem value="COMPLETED">Terminée</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Médecin</TableCell>
              <TableCell>Prescription</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>
                  {prescription.patient.firstName} {prescription.patient.lastName}
                </TableCell>
                <TableCell>{prescription.doctor.name}</TableCell>
                <TableCell>
                  {prescription.text.substring(0, 50)}
                  {prescription.text.length > 50 ? '...' : ''}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(prescription.status)}
                    color={getStatusColor(prescription.status)}
                  />
                </TableCell>
                <TableCell>
                  {new Date(prescription.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {/* Boutons conditionnels selon rôle et statut */}
                  {user?.role === 'DOCTOR' &&
                    prescription.status === PrescriptionStatus.CREATED &&
                    prescription.doctorId === user.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleStatusUpdate(
                            prescription.id,
                            PrescriptionStatus.SENT_TO_LAB
                          )
                        }
                      >
                        Envoyer au labo
                      </Button>
                    )}

                  {user?.role === 'BIOLOGIST' &&
                    prescription.status === PrescriptionStatus.SENT_TO_LAB && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleStatusUpdate(
                            prescription.id,
                            PrescriptionStatus.IN_PROGRESS
                          )
                        }
                      >
                        Commencer
                      </Button>
                    )}

                  {user?.role === 'BIOLOGIST' &&
                    prescription.status === PrescriptionStatus.IN_PROGRESS && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleStatusUpdate(
                            prescription.id,
                            PrescriptionStatus.COMPLETED
                          )
                        }
                      >
                        Terminer
                      </Button>
                    )}

                  <Button
                    size="small"
                    onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                  >
                    Détails
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && prescriptions.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            Aucune prescription trouvée
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PrescriptionsList;
```

**Responsabilités**:
- Afficher liste des prescriptions
- Filtrage par statut
- Affichage conditionnel des boutons selon rôle
- Mise à jour de statut inline
- Navigation vers détails

**Material-UI Components**:
- Table, TableContainer
- Chip (badges colorés)
- Select (filtres)
- Button (actions)
- Alert (messages d'erreur)

#### CreatePrescription.tsx

**Fichier**: `frontend/src/pages/Prescriptions/CreatePrescription.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { patientsService } from '../../services/patientsService';
import { Patient } from '../../types/Patient';

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

  const loadPatients = async () => {
    try {
      const response = await patientsService.findAll();
      setPatients(response.data);
    } catch (err: any) {
      setError('Erreur lors du chargement des patients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    if (text.length < 10) {
      setError('Le texte doit contenir au moins 10 caractères');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await prescriptionService.create({
        text,
        patientId: selectedPatient.id,
      });

      setSuccess('Prescription créée avec succès');
      setTimeout(() => navigate('/prescriptions'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Créer une Prescription
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={patients}
            getOptionLabel={(patient) =>
              `${patient.firstName} ${patient.lastName} (${new Date(
                patient.birthDate
              ).toLocaleDateString()})`
            }
            value={selectedPatient}
            onChange={(_, newValue) => setSelectedPatient(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Patient"
                required
                margin="normal"
                fullWidth
              />
            )}
          />

          <TextField
            label="Prescription (analyses demandées)"
            multiline
            rows={6}
            fullWidth
            required
            margin="normal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            helperText={`${text.length} / 10000 caractères (min: 10)`}
          />

          <Box mt={3} display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Créer'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/prescriptions')}
            >
              Annuler
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CreatePrescription;
```

**Responsabilités**:
- Formulaire création prescription
- Autocomplete pour sélection patient
- Validation frontend
- Navigation après succès

#### PrescriptionDetails.tsx

**Fichier**: `frontend/src/pages/Prescriptions/PrescriptionDetails.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';

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

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.findOne(id!);
      setPrescription(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PrescriptionStatus) => {
    try {
      await prescriptionService.updateStatus(id!, newStatus);
      setConfirmDialog({ open: false, action: '' });
      loadPrescription(); // Recharger
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    try {
      await prescriptionService.delete(id!);
      navigate('/prescriptions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <Box p={3}>Chargement...</Box>;
  if (!prescription) return <Box p={3}>Prescription introuvable</Box>;

  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Détails de la Prescription</Typography>
          <Chip
            label={prescription.status}
            color={
              prescription.status === 'COMPLETED'
                ? 'success'
                : prescription.status === 'IN_PROGRESS'
                ? 'warning'
                : prescription.status === 'SENT_TO_LAB'
                ? 'info'
                : 'default'
            }
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Patient
            </Typography>
            <Typography variant="body1">
              {prescription.patient.firstName} {prescription.patient.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Né(e) le {new Date(prescription.patient.birthDate).toLocaleDateString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Médecin prescripteur
            </Typography>
            <Typography variant="body1">{prescription.doctor.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {prescription.doctor.email}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Prescription
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {prescription.text}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="textSecondary">
              Créée le {new Date(prescription.createdAt).toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="textSecondary">
              Modifiée le {new Date(prescription.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        <Box mt={4} display="flex" gap={2}>
          {/* Actions selon rôle et statut */}
          {user?.role === 'DOCTOR' &&
            prescription.status === PrescriptionStatus.CREATED &&
            prescription.doctorId === user.id && (
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'send',
                    newStatus: PrescriptionStatus.SENT_TO_LAB,
                  })
                }
              >
                Envoyer au Laboratoire
              </Button>
            )}

          {user?.role === 'BIOLOGIST' &&
            prescription.status === PrescriptionStatus.SENT_TO_LAB && (
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'start',
                    newStatus: PrescriptionStatus.IN_PROGRESS,
                  })
                }
              >
                Commencer l'Analyse
              </Button>
            )}

          {user?.role === 'BIOLOGIST' &&
            prescription.status === PrescriptionStatus.IN_PROGRESS && (
              <Button
                variant="contained"
                color="success"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'complete',
                    newStatus: PrescriptionStatus.COMPLETED,
                  })
                }
              >
                Terminer l'Analyse
              </Button>
            )}

          {user?.role === 'ADMIN' && (
            <Button
              variant="outlined"
              color="error"
              onClick={() =>
                setConfirmDialog({ open: true, action: 'delete' })
              }
            >
              Supprimer
            </Button>
          )}

          <Button variant="outlined" onClick={() => navigate('/prescriptions')}>
            Retour
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: '' })}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          {confirmDialog.action === 'send' && 'Envoyer cette prescription au laboratoire ?'}
          {confirmDialog.action === 'start' && 'Commencer l\'analyse de cette prescription ?'}
          {confirmDialog.action === 'complete' && 'Marquer cette prescription comme terminée ?'}
          {confirmDialog.action === 'delete' &&
            'Supprimer définitivement cette prescription ? Cette action est irréversible.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '' })}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.action === 'delete') {
                handleDelete();
              } else if (confirmDialog.newStatus) {
                handleStatusUpdate(confirmDialog.newStatus);
              }
            }}
            color={confirmDialog.action === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrescriptionDetails;
```

**Responsabilités**:
- Afficher détails complets
- Boutons d'action conditionnels
- Confirmation dialogs
- Mise à jour de statut
- Suppression (ADMIN)

### 4. Routes dans App.tsx

**Fichier**: `frontend/src/App.tsx` (modifications)

```typescript
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
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

---

## Patterns de Conception

### 1. State Machine Pattern (Backend)

**Application**: Gestion des transitions de statut

```typescript
// Dans PrescriptionsService
private validateStatusTransition(
  currentStatus: PrescriptionStatus,
  newStatus: PrescriptionStatus,
  userRole: Role,
  userId: string,
  prescriptionDoctorId: string,
): void {
  // Machine à états avec règles de transition
  const allowedTransitions = {
    CREATED: {
      nextStatus: PrescriptionStatus.SENT_TO_LAB,
      allowedRoles: [Role.DOCTOR],
    },
    SENT_TO_LAB: {
      nextStatus: PrescriptionStatus.IN_PROGRESS,
      allowedRoles: [Role.BIOLOGIST],
    },
    IN_PROGRESS: {
      nextStatus: PrescriptionStatus.COMPLETED,
      allowedRoles: [Role.BIOLOGIST],
    },
    COMPLETED: {
      nextStatus: null,
      allowedRoles: [],
    },
  };

  // Validation centralisée
}
```

**Avantages**:
- Centralisation de la logique métier
- Facilité de test
- Évolution facile (ajout de nouveaux états)
- Garantie de cohérence

### 2. Repository Pattern (Prisma)

**Application**: Accès aux données via PrismaService

```typescript
// PrismaService injecté dans tous les services
constructor(private prisma: PrismaService) {}

// Opérations CRUD standardisées
await this.prisma.prescription.create({ ... });
await this.prisma.prescription.findMany({ ... });
await this.prisma.prescription.update({ ... });
await this.prisma.prescription.delete({ ... });
```

**Avantages**:
- Abstraction de la couche données
- Facilité de mock pour tests
- Type safety complet

### 3. Guard Pattern (NestJS)

**Application**: Protection des routes avec AuthGuard et RolesGuard

```typescript
@Controller('prescriptions')
@UseGuards(AuthGuard) // Appliqué à toutes les routes
export class PrescriptionsController {
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN) // Rôles autorisés
  create() { ... }
}
```

**Avantages**:
- Séparation des concerns (sécurité vs logique métier)
- Réutilisation facile
- Composition de guards

### 4. DTO Pattern (Validation)

**Application**: Validation des entrées avec class-validator

```typescript
export class CreatePrescriptionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  text: string;

  @IsUUID()
  patientId: string;
}
```

**Avantages**:
- Validation déclarative
- Messages d'erreur automatiques
- Type safety

### 5. Service Layer Pattern

**Application**: Logique métier dans services, controllers comme routeurs

```typescript
// Controller: router uniquement
@Post()
async create(@Body() dto: CreatePrescriptionDto, @CurrentUser() userId: string) {
  const prescription = await this.prescriptionsService.create(dto, userId);
  return { data: prescription, message: '...' };
}

// Service: toute la logique métier
async create(dto: CreatePrescriptionDto, doctorId: string) {
  // Validation patient
  // Validation médecin
  // Création prescription
  // Inclusion relations
}
```

**Avantages**:
- Testabilité (services testables indépendamment)
- Réutilisation (services appelables depuis autres modules)
- Séparation des responsabilités

### 6. Include Relations Pattern (Prisma)

**Application**: Inclusion systématique des relations

```typescript
private readonly includeRelations = {
  patient: true,
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      // password exclu
    },
  },
  result: true,
};

// Utilisé dans toutes les méthodes
await this.prisma.prescription.create({
  data: { ... },
  include: this.includeRelations,
});
```

**Avantages**:
- Une seule requête DB
- Données complètes pour le frontend
- Évite N+1 queries
- Sécurité (exclusion password)

### 7. Conditional Rendering Pattern (React)

**Application**: Affichage selon rôle et statut

```typescript
{user?.role === 'DOCTOR' &&
  prescription.status === 'CREATED' &&
  prescription.doctorId === user.id && (
    <Button>Envoyer au labo</Button>
  )}

{user?.role === 'BIOLOGIST' &&
  prescription.status === 'SENT_TO_LAB' && (
    <Button>Commencer</Button>
  )}
```

**Avantages**:
- UI dynamique
- Sécurité côté client
- UX adaptée au rôle

### 8. Error Handling Pattern

**Application**: Gestion cohérente des erreurs

```typescript
// Backend: Exceptions NestJS
throw new BadRequestException('Patient introuvable');
throw new ForbiddenException('Permissions insuffisantes');
throw new NotFoundException('Prescription introuvable');

// Frontend: Extraction et affichage
try {
  await api.post(...);
} catch (err: any) {
  const message = err.response?.data?.message || 'Erreur générique';
  setError(message);
}
```

**Avantages**:
- Messages clairs pour utilisateurs
- Logging centralisé
- Debugging facilité

---

## Flux de Données

### Flux 1: Création de Prescription (DOCTOR)

```
┌─────────────┐
│   DOCTOR    │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Sélectionne patient
       │ 2. Saisit texte prescription
       │ 3. Clique "Créer"
       ▼
┌─────────────────────────────────┐
│  CreatePrescription.tsx         │
│  - Validation frontend          │
│  - prescriptionService.create() │
└────────┬────────────────────────┘
         │
         │ POST /api/prescriptions
         │ { text, patientId }
         │ Cookie: session
         ▼
┌─────────────────────────────────┐
│  PrescriptionsController        │
│  - @UseGuards(AuthGuard)        │
│  - @UseGuards(RolesGuard)       │
│  - @Roles(DOCTOR, ADMIN)        │
│  - @CurrentUser() → userId      │
└────────┬────────────────────────┘
         │
         │ create(dto, userId)
         ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│  1. Vérifier patient existe     │
│  2. Créer prescription          │
│     - text                      │
│     - patientId                 │
│     - doctorId (userId session) │
│     - status: CREATED           │
│  3. Include relations           │
└────────┬────────────────────────┘
         │
         │ prisma.prescription.create()
         ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  INSERT INTO prescriptions      │
│  RETURN avec patient + doctor   │
└────────┬────────────────────────┘
         │
         │ Prescription créée
         ▼
┌─────────────────────────────────┐
│  Frontend                       │
│  - Message: "Créée avec succès" │
│  - Navigation → /prescriptions  │
└─────────────────────────────────┘
```

### Flux 2: Envoi au Laboratoire (DOCTOR)

```
┌─────────────┐
│   DOCTOR    │
└──────┬──────┘
       │
       │ 1. Consulte liste prescriptions
       │ 2. Filtre status=CREATED
       │ 3. Clique "Envoyer au labo"
       │ 4. Confirme action
       ▼
┌─────────────────────────────────┐
│  PrescriptionsList.tsx          │
│  - handleStatusUpdate()         │
│  - prescriptionService.update() │
└────────┬────────────────────────┘
         │
         │ PATCH /api/prescriptions/:id
         │ { status: 'SENT_TO_LAB' }
         │ Cookie: session
         ▼
┌─────────────────────────────────┐
│  PrescriptionsController        │
│  - @UseGuards(AuthGuard)        │
│  - @UseGuards(RolesGuard)       │
│  - @Roles(DOCTOR, BIOLO, ADMIN) │
└────────┬────────────────────────┘
         │
         │ update(id, dto, userId, userRole)
         ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│  1. findOne(id) - vérifier      │
│  2. validateStatusTransition()  │
│     - Vérifier CREATED → SENT   │
│     - Vérifier rôle DOCTOR      │
│     - Vérifier ownership        │
│  3. prisma.update()             │
└────────┬────────────────────────┘
         │
         │ Validation State Machine
         │
         ▼
┌─────────────────────────────────┐
│  validateStatusTransition()     │
│  IF currentStatus === CREATED   │
│     AND newStatus === SENT_LAB  │
│     AND userRole === DOCTOR     │
│     AND doctorId === userId     │
│  THEN allow                     │
│  ELSE throw ForbiddenException  │
└────────┬────────────────────────┘
         │
         │ ✓ Validation OK
         ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  UPDATE prescriptions           │
│  SET status = 'SENT_TO_LAB',    │
│      updatedAt = NOW()          │
│  WHERE id = :id                 │
└────────┬────────────────────────┘
         │
         │ Prescription mise à jour
         ▼
┌─────────────────────────────────┐
│  Frontend                       │
│  - Liste rechargée              │
│  - Badge "Envoyée au labo" bleu │
│  - Bouton "Envoyer" disparu     │
└─────────────────────────────────┘
```

### Flux 3: Traitement Laboratoire (BIOLOGIST)

```
┌─────────────┐
│  BIOLOGIST  │
└──────┬──────┘
       │
       │ 1. Consulte liste
       │ 2. Filtre status=SENT_TO_LAB
       │ 3. Sélectionne prescription
       │ 4. Clique "Commencer"
       ▼
┌─────────────────────────────────┐
│  PrescriptionsList.tsx          │
│  - handleStatusUpdate()         │
│  - newStatus: IN_PROGRESS       │
└────────┬────────────────────────┘
         │
         │ PATCH /api/prescriptions/:id
         │ { status: 'IN_PROGRESS' }
         ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│  1. validateStatusTransition()  │
│     - SENT_LAB → IN_PROGRESS    │
│     - Role: BIOLOGIST           │
│  2. prisma.update()             │
└────────┬────────────────────────┘
         │
         │ Status → IN_PROGRESS
         ▼
[Biologiste travaille au labo - hors système]
         │
         │ Analyses terminées
         ▼
┌─────────────┐
│  BIOLOGIST  │
│ Clique      │
│ "Terminer"  │
└──────┬──────┘
       │
       │ PATCH /api/prescriptions/:id
       │ { status: 'COMPLETED' }
       ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│  1. validateStatusTransition()  │
│     - IN_PROGRESS → COMPLETED   │
│     - Role: BIOLOGIST           │
│  2. prisma.update()             │
└────────┬────────────────────────┘
         │
         │ Status → COMPLETED
         ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  prescription.status=COMPLETED  │
│  Prêt pour Result (Jour 5)      │
└─────────────────────────────────┘
```

### Flux 4: Consultation (ALL ROLES)

```
┌─────────────────────────┐
│ USER (any authenticated)│
└──────┬──────────────────┘
       │
       │ GET /api/prescriptions
       │ ?patientId=xxx&status=SENT_TO_LAB
       ▼
┌─────────────────────────────────┐
│  PrescriptionsController        │
│  - @UseGuards(AuthGuard)        │
│  - Pas de RolesGuard            │
│  - Query params optionnels      │
└────────┬────────────────────────┘
         │
         │ findAll(patientId, doctorId, status)
         ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│  - Construire where clause      │
│  - prisma.findMany()            │
│  - include: patient + doctor    │
│  - orderBy: createdAt DESC      │
└────────┬────────────────────────┘
         │
         │ SELECT prescriptions
         │ JOIN patients
         │ JOIN users (doctor)
         │ WHERE conditions
         │ ORDER BY createdAt DESC
         ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  - Utilise index sur status     │
│  - Utilise index sur patientId  │
│  - Retourne liste complète      │
└────────┬────────────────────────┘
         │
         │ Liste prescriptions avec relations
         ▼
┌─────────────────────────────────┐
│  Frontend                       │
│  - Table Material-UI            │
│  - Badges colorés par statut    │
│  - Boutons conditionnels        │
└─────────────────────────────────┘
```

---

## Intégration avec Modules Existants

### 1. Intégration avec PrismaModule

**Statut**: ✅ Déjà configuré (global)

```typescript
// PrismaModule est @Global(), disponible partout
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class PrescriptionsModule {}
```

**Utilisation**:
```typescript
constructor(private prisma: PrismaService) {}
```

**Pas d'action requise**: Injection automatique

### 2. Intégration avec AuthModule

**Statut**: ✅ Guards réutilisables

```typescript
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('prescriptions')
@UseGuards(AuthGuard) // Session validation
export class PrescriptionsController {
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  create(@CurrentUser() userId: string) { ... }
}
```

**Décorateurs Disponibles**:
- `@CurrentUser()`: Extrait userId de `request.session.userId`
- `@Roles(...roles)`: Définit rôles autorisés pour RolesGuard

**Pas d'action requise**: Guards déjà implémentés

### 3. Intégration avec PatientsModule

**Relation**: `prescription.patientId → patient.id`

**Validation dans Service**:
```typescript
async create(dto: CreatePrescriptionDto, doctorId: string) {
  // Vérifier que le patient existe
  const patient = await this.prisma.patient.findUnique({
    where: { id: dto.patientId },
  });
  if (!patient) {
    throw new BadRequestException('Patient introuvable');
  }
  // ...
}
```

**Cascade Delete**: Configuré dans Prisma schema
```prisma
model Prescription {
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
}
```

**Si patient supprimé → toutes ses prescriptions supprimées**

### 4. Intégration avec UsersModule (Médecins)

**Relation**: `prescription.doctorId → user.id (role=DOCTOR)`

**Validation dans Service**:
```typescript
// Le doctorId vient de la session (userId)
// Pas besoin de validation, l'utilisateur est déjà authentifié
// Guards assurent que seul un DOCTOR peut créer
```

**Pour UpdatePrescriptionDto (ADMIN change doctorId)**:
```typescript
if (dto.doctorId) {
  const doctor = await this.prisma.user.findUnique({
    where: { id: dto.doctorId },
  });
  if (!doctor || doctor.role !== Role.DOCTOR) {
    throw new BadRequestException('Médecin introuvable ou rôle incorrect');
  }
}
```

**Cascade Delete**: Configuré dans Prisma schema
```prisma
model Prescription {
  doctor User @relation("DoctorPrescriptions", fields: [doctorId], references: [id], onDelete: Cascade)
}
```

**Si médecin supprimé → toutes ses prescriptions supprimées**

**⚠️ Recommandation**: Soft delete pour éviter perte de données

### 5. Préparation pour ResultsModule (Jour 5)

**Relation**: `prescription.result → Result (one-to-one)`

**Déjà défini dans Prisma**:
```prisma
model Prescription {
  result Result? // null si pas encore créé
}

model Result {
  prescriptionId String @unique
  prescription Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
}
```

**Include Relations**:
```typescript
private readonly includeRelations = {
  patient: true,
  doctor: { ... },
  result: true, // ← Jour 5: sera rempli si Result existe
};
```

**Export PrescriptionsService**:
```typescript
@Module({
  exports: [PrescriptionsService], // ← Pour ResultsModule
})
export class PrescriptionsModule {}
```

**ResultsModule pourra**:
- Importer PrescriptionsModule
- Utiliser PrescriptionsService.findOne() pour valider prescription
- Vérifier que `prescription.status === COMPLETED` avant créer Result

### 6. Frontend - patientsService

**Utilisation**: Autocomplete pour sélection patient

```typescript
// Dans CreatePrescription.tsx
import { patientsService } from '../../services/patientsService';

const loadPatients = async () => {
  const response = await patientsService.findAll();
  setPatients(response.data);
};
```

**Aucune modification requise**: Service déjà existant

---

## Sécurité et Contrôle d'Accès

### Matrice de Permissions Complète

| Action | Endpoint | Method | ADMIN | DOCTOR | BIOLOGIST | SECRETARY |
|--------|----------|--------|-------|--------|-----------|-----------|
| Créer prescription | `/prescriptions` | POST | ✓ | ✓ | ✗ | ✗ |
| Lister prescriptions | `/prescriptions` | GET | ✓ | ✓ | ✓ | ✓ |
| Détails prescription | `/prescriptions/:id` | GET | ✓ | ✓ | ✓ | ✓ |
| Modifier texte | `/prescriptions/:id` | PATCH | ✓ | ✓* | ✗ | ✗ |
| Status CREATED→SENT_LAB | `/prescriptions/:id` | PATCH | ✓ | ✓* | ✗ | ✗ |
| Status SENT_LAB→IN_PROG | `/prescriptions/:id` | PATCH | ✓ | ✗ | ✓ | ✗ |
| Status IN_PROG→COMPLETED | `/prescriptions/:id` | PATCH | ✓ | ✗ | ✓ | ✗ |
| Supprimer prescription | `/prescriptions/:id` | DELETE | ✓ | ✗ | ✗ | ✗ |

*DOCTOR: uniquement ses propres prescriptions

### Guards NestJS

#### 1. AuthGuard

**Emplacement**: Déjà existant dans `auth/guards/auth.guard.ts`

**Responsabilité**: Vérifier que l'utilisateur est authentifié

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData;

    if (!session?.userId) {
      throw new UnauthorizedException('Vous devez être connecté');
    }

    return true;
  }
}
```

**Appliqué à**: Toutes les routes (niveau classe)

```typescript
@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController { ... }
```

#### 2. RolesGuard

**Emplacement**: Déjà existant dans `auth/guards/roles.guard.ts`

**Responsabilité**: Vérifier que l'utilisateur a le rôle requis

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData;
    const userId = session.userId;

    // Récupérer l'utilisateur depuis la base
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires');
    }

    return true;
  }
}
```

**Appliqué à**: Routes spécifiques avec `@Roles()`

```typescript
@Post()
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR, Role.ADMIN)
create() { ... }
```

#### 3. Ownership Validation (Service Layer)

**Emplacement**: PrescriptionsService

**Responsabilité**: Vérifier que DOCTOR modifie uniquement ses prescriptions

```typescript
async update(id: string, dto: UpdatePrescriptionDto, userId: string, userRole: Role) {
  const prescription = await this.findOne(id);

  // Vérification ownership pour DOCTOR (sauf ADMIN)
  if (userRole === Role.DOCTOR && prescription.doctorId !== userId) {
    throw new ForbiddenException(
      'Vous ne pouvez modifier que vos propres prescriptions'
    );
  }

  // ...
}
```

**Pattern**: Validation métier dans Service, pas dans Guard

### Session-based Authentication

**Configuration**: Déjà existante dans `main.ts`

```typescript
import session = require('express-session');

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Sécurité XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    },
  }),
);
```

**Session Data**:
```typescript
// types/session.d.ts
export interface SessionData {
  userId: string;
}
```

**Extraction userId**:
```typescript
// Via décorateur @CurrentUser()
@Post()
create(@CurrentUser() userId: string) { ... }

// Ou directement
@Post()
create(@Session() session: SessionData) {
  const userId = session.userId;
}
```

### CORS Configuration

**Configuration**: Déjà existante dans `main.ts`

```typescript
import cors = require('cors');

app.use(
  cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true, // CRITIQUE pour cookies de session
  }),
);
```

**⚠️ IMPORTANT**: `credentials: true` est requis pour que les cookies de session fonctionnent

**Frontend**: `withCredentials: true` dans axios

```typescript
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // ← CRITIQUE
});
```

### Validation des Entrées (class-validator)

**CreatePrescriptionDto**:
- `text`: MinLength(10), MaxLength(10000), IsString, IsNotEmpty
- `patientId`: IsUUID, IsNotEmpty

**UpdatePrescriptionDto**:
- Tous champs optionnels
- `status`: IsEnum(PrescriptionStatus)
- `text`, `patientId`, `doctorId`: Validation identique si fournis

**Messages d'Erreur**: Français, explicites

```typescript
@IsString()
@MinLength(10, { message: 'Le texte doit contenir au moins 10 caractères' })
text: string;
```

### Protection contre Injections

**Prisma ORM**:
- Parameterized queries automatiques
- Pas d'injection SQL possible

**class-validator**:
- Validation stricte des types
- Rejet des données invalides

**UUID Validation**:
- Prévient injection d'IDs arbitraires
- Format strict: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## Gestion des États

### Backend - PrescriptionStatus (Prisma Enum)

```prisma
enum PrescriptionStatus {
  CREATED       // Créée par médecin
  SENT_TO_LAB   // Envoyée au laboratoire
  IN_PROGRESS   // En cours d'analyse
  COMPLETED     // Résultat disponible
}
```

**État Initial**: `CREATED` (défini par `@default(CREATED)`)

**Transitions Autorisées**:
```
CREATED → SENT_TO_LAB → IN_PROGRESS → COMPLETED
```

**État Final**: `COMPLETED` (pas de transition suivante)

**Validation**: Méthode `validateStatusTransition()` dans PrescriptionsService

### Frontend - État Local (useState)

**PrescriptionsList.tsx**:
```typescript
const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');
```

**CreatePrescription.tsx**:
```typescript
const [patients, setPatients] = useState<Patient[]>([]);
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [text, setText] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
```

**PrescriptionDetails.tsx**:
```typescript
const [prescription, setPrescription] = useState<Prescription | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [confirmDialog, setConfirmDialog] = useState<{
  open: boolean;
  action: string;
  newStatus?: PrescriptionStatus;
}>({ open: false, action: '' });
```

**Pattern**: Pas de Redux, état local uniquement (conformément au projet)

### AuthContext (État Global)

**Déjà existant**: `frontend/src/context/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
```

**Utilisation dans Prescriptions**:
```typescript
const { user } = useAuth();

// Affichage conditionnel
{user?.role === 'DOCTOR' && <Button>Créer</Button>}
{user?.role === 'BIOLOGIST' && <Button>Commencer</Button>}
```

**Pas de modification requise**: AuthContext déjà fonctionnel

---

## Diagrammes d'Architecture

### Diagramme de Classes (Backend)

```
┌────────────────────────────────────┐
│      PrescriptionsModule           │
├────────────────────────────────────┤
│ + imports: [PrismaModule]          │
│ + controllers: [Controller]        │
│ + providers: [Service]             │
│ + exports: [Service]               │
└────────────────┬───────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐   ┌──────────────────┐
│  Controller   │   │    Service       │
├───────────────┤   ├──────────────────┤
│ - service     │──►│ - prisma         │
├───────────────┤   ├──────────────────┤
│ + create()    │   │ + create()       │
│ + findAll()   │   │ + findAll()      │
│ + findOne()   │   │ + findOne()      │
│ + update()    │   │ + update()       │
│ + remove()    │   │ + remove()       │
└───────────────┘   │ - validate...()  │
                    │ + getUserById()  │
                    └────────┬─────────┘
                             │
                             │ uses
                             ▼
                    ┌─────────────────┐
                    │  PrismaService  │
                    ├─────────────────┤
                    │ + prescription  │
                    │ + patient       │
                    │ + user          │
                    └─────────────────┘

┌───────────────────────────────────┐
│          DTOs                     │
├───────────────────────────────────┤
│  CreatePrescriptionDto            │
│  - text: string                   │
│  - patientId: string              │
├───────────────────────────────────┤
│  UpdatePrescriptionDto            │
│  - text?: string                  │
│  - status?: PrescriptionStatus    │
│  - patientId?: string             │
│  - doctorId?: string              │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│          Guards                   │
├───────────────────────────────────┤
│  AuthGuard                        │
│  + canActivate(): boolean         │
├───────────────────────────────────┤
│  RolesGuard                       │
│  + canActivate(): Promise<bool>   │
└───────────────────────────────────┘
```

### Diagramme de Séquence: Création Prescription

```
DOCTOR    CreatePres.tsx   Controller    Service     Prisma    Database
  │              │              │            │          │          │
  │ Saisit texte │              │            │          │          │
  │ Sélectionne  │              │            │          │          │
  │ patient      │              │            │          │          │
  │              │              │            │          │          │
  │ Clique       │              │            │          │          │
  │ "Créer"      │              │            │          │          │
  ├──────────────►              │            │          │          │
  │              │ POST /api/   │            │          │          │
  │              │ prescriptions│            │          │          │
  │              ├──────────────►            │          │          │
  │              │              │ AuthGuard  │          │          │
  │              │              │ RolesGuard │          │          │
  │              │              │ @CurrentUser          │          │
  │              │              ├────────────►          │          │
  │              │              │ create(dto,userId)    │          │
  │              │              │            ├──────────►          │
  │              │              │            │ findUnique(patient) │
  │              │              │            ├─────────────────────►
  │              │              │            │            ◄─────────┤
  │              │              │            │ Patient exists       │
  │              │              │            ├──────────►          │
  │              │              │            │ create() │          │
  │              │              │            ├─────────────────────►
  │              │              │            │            ◄─────────┤
  │              │              │            │ Prescription created │
  │              │              │            │          │          │
  │              │              │ ◄──────────┤          │          │
  │              │              │ Prescription+relations           │
  │              │ ◄────────────┤            │          │          │
  │              │ { data, msg }│            │          │          │
  │ ◄────────────┤              │            │          │          │
  │ Message:     │              │            │          │          │
  │ "Créée avec  │              │            │          │          │
  │  succès"     │              │            │          │          │
  │              │              │            │          │          │
  │ Navigate →   │              │            │          │          │
  │ /prescriptions             │            │          │          │
```

### Diagramme de Séquence: Transition de Statut

```
BIOLOGIST  List.tsx   Controller    Service       Database
    │          │          │             │              │
    │ Consulte │          │             │              │
    │ liste    │          │             │              │
    │ Clique   │          │             │              │
    │ "Commencer"         │             │              │
    ├──────────►          │             │              │
    │          │ PATCH    │             │              │
    │          │ /prescriptions/:id     │              │
    │          ├──────────►             │              │
    │          │          │ AuthGuard   │              │
    │          │          │ RolesGuard  │              │
    │          │          ├─────────────►              │
    │          │          │ update(id, {status}, userId, role)
    │          │          │             ├──────────────►
    │          │          │             │ SELECT * WHERE id
    │          │          │             ◄──────────────┤
    │          │          │             │ Prescription │
    │          │          │             │              │
    │          │          │ validateStatusTransition() │
    │          │          │ ├──────┐    │              │
    │          │          │ │ IF currentStatus=SENT_LAB│
    │          │          │ │ AND newStatus=IN_PROGRESS│
    │          │          │ │ AND role=BIOLOGIST       │
    │          │          │ │ THEN allow               │
    │          │          │ └──────┘    │              │
    │          │          │             │              │
    │          │          │             ├──────────────►
    │          │          │             │ UPDATE status│
    │          │          │             ◄──────────────┤
    │          │          │ ◄───────────┤              │
    │          │          │ Prescription│              │
    │          │ ◄────────┤             │              │
    │          │ { data, msg }          │              │
    │ ◄────────┤          │             │              │
    │ Liste    │          │             │              │
    │ rechargée│          │             │              │
```

### Diagramme de Composants (Frontend)

```
┌──────────────────────────────────────────────────────────┐
│                        App.tsx                           │
│                    (React Router)                        │
└───────────────────┬──────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬────────────────┐
        │                       │                │
        ▼                       ▼                ▼
┌───────────────┐    ┌──────────────────┐   ┌────────────────────┐
│ Prescriptions │    │ Create           │   │ Prescription       │
│ List          │    │ Prescription     │   │ Details            │
├───────────────┤    ├──────────────────┤   ├────────────────────┤
│ - Table       │    │ - Form           │   │ - Info display     │
│ - Filters     │    │ - Autocomplete   │   │ - Action buttons   │
│ - Badges      │    │ - Validation     │   │ - Confirmation     │
│ - Actions     │    └──────────────────┘   └────────────────────┘
└───────┬───────┘              │                      │
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                               │ uses
                               ▼
                    ┌───────────────────────┐
                    │ prescriptionService   │
                    ├───────────────────────┤
                    │ + create()            │
                    │ + findAll()           │
                    │ + findOne()           │
                    │ + update()            │
                    │ + updateStatus()      │
                    │ + delete()            │
                    └───────────┬───────────┘
                                │
                                │ uses
                                ▼
                    ┌───────────────────────┐
                    │      api.ts           │
                    │ (axios instance)      │
                    ├───────────────────────┤
                    │ baseURL: /api         │
                    │ withCredentials: true │
                    └───────────────────────┘
```

### Architecture de Déploiement

```
┌────────────────────────────────────────────────────────┐
│                   Development Environment               │
│                                                         │
│  ┌─────────────────┐         ┌────────────────────┐   │
│  │   Frontend      │         │     Backend        │   │
│  │   (Vite)        │         │     (NestJS)       │   │
│  │   Port: 5173    │◄───────►│   Port: 3000       │   │
│  │                 │  HTTP   │                    │   │
│  └─────────────────┘  REST   └─────────┬──────────┘   │
│                                        │              │
│                                        │ Prisma       │
│                                        ▼              │
│                            ┌────────────────────┐     │
│                            │   PostgreSQL       │     │
│                            │   Port: 5432       │     │
│                            │   DB: hospital_mvp │     │
│                            └────────────────────┘     │
│                                                       │
└────────────────────────────────────────────────────────┘

Network:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- CORS: enabled with credentials
- Session: cookie-based (httpOnly, 24h)
```

---

## Résumé de l'Architecture

### Points Clés

1. **Architecture Modulaire**: PrescriptionsModule autonome, réutilise modules existants
2. **State Machine Pattern**: Validation stricte des transitions de statut
3. **Role-Based Access Control**: Guards NestJS + validation Service Layer
4. **Session-based Auth**: Cookies httpOnly, pas de JWT
5. **Type Safety**: TypeScript backend + frontend, Prisma pour DB
6. **Conditional Rendering**: UI adaptée au rôle utilisateur
7. **Relations Prisma**: Include systématique pour éviter N+1 queries
8. **Validation Cohérente**: class-validator backend, validation frontend

### Patterns Appliqués

- ✅ Repository Pattern (PrismaService)
- ✅ Service Layer Pattern (logique métier dans services)
- ✅ DTO Pattern (validation entrées)
- ✅ Guard Pattern (sécurité)
- ✅ State Machine Pattern (transitions statut)
- ✅ Include Relations Pattern (Prisma)
- ✅ Conditional Rendering Pattern (React)
- ✅ Error Handling Pattern (exceptions + try/catch)

### Complexité et Risques

**Complexité Backend**: 6/10
- ✅ Pattern établi (Appointments)
- ⚠️ State machine custom
- ✅ Guards réutilisables

**Complexité Frontend**: 5/10
- ✅ Composants Material-UI
- ⚠️ Affichage conditionnel
- ✅ Service API simple

**Risques Identifiés**:
- ⚠️ Transitions concurrentes (mitigation: validation stricte)
- ⚠️ Cascade delete (mitigation: soft delete recommandé)
- ✅ Performance (index en place)

**Estimation Développement**: 9-10h (confortable pour Jour 4)

---

**Document généré le**: 2026-01-03
**Architecte**: System Architecture Specialist
**Statut**: ✅ Ready for Implementation (spec-developer)
**Prochaine phase**: Detailed API Specification
