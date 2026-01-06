# Plan d'Implémentation - Traçabilité et Sauvegarde des Consultations

**Date**: 2025-01-05
**Version**: 1.0
**Auteur**: Specification Planner
**Projet**: Hospital Management MVP - Amélioration Workflow Consultations

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Analyse du Système Actuel](#analyse-du-système-actuel)
3. [Modifications du Schéma Prisma](#modifications-du-schéma-prisma)
4. [Backend - Endpoints API](#backend---endpoints-api)
5. [Frontend - Composants et Pages](#frontend---composants-et-pages)
6. [Ordre d'Implémentation](#ordre-dimplémentation)
7. [Stratégie de Tests](#stratégie-de-tests)
8. [Migration et Déploiement](#migration-et-déploiement)

---

## Vue d'Ensemble

### Objectifs du Projet

Améliorer la traçabilité et la persistance des données dans le système hospitalier en ajoutant :

1. **Modification des RDV par Secrétaire** avec traçabilité complète
2. **Dashboard Médecin** pour consultations en cours avec sauvegarde auto
3. **Sauvegarde des Données Infirmier** avec auto-save et historique

### Résumé des Changements

| Composant | Type de Changement | Complexité |
|-----------|-------------------|------------|
| Database Schema | Nouveau modèle `AuditLog` + champs traçabilité | Medium |
| Backend | 8 nouveaux endpoints + 3 endpoints modifiés | Medium |
| Frontend | 3 nouvelles pages + 5 composants modifiés | Medium-High |
| Tests | 15 tests unitaires + 8 tests d'intégration | Medium |

**Estimation Totale**: 5-7 jours de développement

---

## Analyse du Système Actuel

### Modèles Prisma Existants

#### Appointment (Existant)
```prisma
model Appointment {
  id                  String              @id @default(uuid())
  date                DateTime
  motif               String
  status              AppointmentStatus   @default(SCHEDULED)

  // Données cliniques
  vitals              Json?
  medicalHistoryNotes String?             @db.Text
  consultationNotes   String?             @db.Text

  // Timestamps workflow
  checkedInAt         DateTime?
  vitalsEnteredAt     DateTime?
  consultedAt         DateTime?
  closedAt            DateTime?

  // Traçabilité actuelle (limitée)
  vitalsEnteredBy     String?             // userId
  consultedBy         String?             // userId
  closedBy            String?             // userId

  // Relations
  patientId           String
  doctorId            String
  prescriptions       Prescription[]
}
```

**Points faibles identifiés:**
- Pas de traçabilité des modifications (date/motif/doctorId)
- Pas d'historique des versions
- Auto-save consultation notes non implémenté
- Pas de distinction entre "brouillon" et "finalisé"

### Workflow Actuel (États Appointment)

```
SCHEDULED → CHECKED_IN → IN_CONSULTATION → WAITING_RESULTS → CONSULTATION_COMPLETED → COMPLETED
                                        ↓
                                   CANCELLED
```

**Gaps identifiés:**
1. Pas de statut "DRAFT_CONSULTATION" pour consultations en cours
2. Pas de mécanisme de reprise de consultation
3. Pas d'historique des constantes vitales modifiées

---

## Modifications du Schéma Prisma

### 1. Nouveau Modèle: AuditLog

**Objectif**: Tracer toutes les modifications importantes des rendez-vous

```prisma
model AuditLog {
  id            String   @id @default(uuid())
  entityType    String   // "APPOINTMENT", "PRESCRIPTION", etc.
  entityId      String   // ID de l'entité modifiée
  action        String   // "CREATED", "UPDATED", "DELETED", "STATUS_CHANGED"

  // Données de traçabilité
  performedBy   String   // userId
  performedAt   DateTime @default(now())

  // Détails des changements
  changes       Json     // { field: { old: value, new: value } }
  ipAddress     String?  // Optionnel pour MVP
  userAgent     String?  // Optionnel pour MVP

  // Métadonnées
  reason        String?  @db.Text // Raison de la modification (optionnel)

  createdAt     DateTime @default(now())

  @@index([entityType, entityId])
  @@index([performedBy])
  @@index([performedAt])
  @@map("audit_logs")
}
```

**Exemples d'utilisation:**

```json
// Modification de date de RDV
{
  "entityType": "APPOINTMENT",
  "entityId": "uuid-123",
  "action": "UPDATED",
  "performedBy": "secretary-uuid",
  "changes": {
    "date": {
      "old": "2025-01-05T10:00:00Z",
      "new": "2025-01-06T14:00:00Z"
    },
    "doctorId": {
      "old": "doctor-1-uuid",
      "new": "doctor-2-uuid"
    }
  },
  "reason": "Médecin absent le 5 janvier"
}
```

### 2. Modification Modèle Appointment

**Nouveaux champs:**

```prisma
model Appointment {
  // ... champs existants ...

  // Auto-save consultation notes (NOUVEAU)
  consultationNotesDraft String?  @db.Text  // Brouillon auto-save
  lastAutoSaveAt         DateTime?           // Timestamp dernier auto-save

  // Traçabilité modifications (NOUVEAU)
  modifiedBy             String?             // Dernier userId qui a modifié
  modifiedAt             DateTime?           // Timestamp dernière modification
  modificationCount      Int       @default(0) // Nombre de modifications

  // Flag pour consultation en cours (NOUVEAU)
  isDraftConsultation    Boolean   @default(false) // true = consultation non finalisée

  // ... reste des champs existants ...
}
```

### 3. Nouveau Modèle: VitalHistory

**Objectif**: Historique des constantes vitales avec modifications

```prisma
model VitalHistory {
  id                String   @id @default(uuid())
  appointmentId     String   // Lien vers Appointment

  // Données vitales (JSON structure identique à Appointment.vitals)
  vitals            Json
  medicalHistoryNotes String? @db.Text

  // Traçabilité
  enteredBy         String   // userId (NURSE)
  enteredAt         DateTime @default(now())

  // Type d'action
  actionType        String   // "CREATED", "UPDATED", "AUTO_SAVED"

  createdAt         DateTime @default(now())

  // Relation
  appointment       Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([enteredAt])
  @@map("vital_history")
}
```

### 4. Modification Modèle User

**Ajout de relation:**

```prisma
model User {
  // ... champs existants ...

  // Relations (NOUVEAU)
  auditLogs         AuditLog[]  @relation("UserAuditLogs")

  // ... reste des relations existantes ...
}
```

### 5. Mise à jour complète du schema.prisma

**Ajouts nécessaires:**

```prisma
// Nouvelle énumération pour AuditLog
enum AuditAction {
  CREATED
  UPDATED
  DELETED
  STATUS_CHANGED
  NOTES_SAVED
}

enum EntityType {
  APPOINTMENT
  PATIENT
  PRESCRIPTION
  RESULT
}
```

### Migration Strategy

**Étapes de migration:**

```bash
# 1. Créer la migration
cd backend
npx prisma migrate dev --name add_audit_traceability

# 2. Vérifier la migration générée
cat prisma/migrations/XXX_add_audit_traceability/migration.sql

# 3. Appliquer en production
npx prisma migrate deploy
```

**Migration SQL attendue:**

```sql
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'NOTES_SAVED');
CREATE TYPE "EntityType" AS ENUM ('APPOINTMENT', 'PATIENT', 'PRESCRIPTION', 'RESULT');

-- AlterTable
ALTER TABLE "appointments"
  ADD COLUMN "consultationNotesDraft" TEXT,
  ADD COLUMN "lastAutoSaveAt" TIMESTAMP(3),
  ADD COLUMN "modifiedBy" TEXT,
  ADD COLUMN "modifiedAt" TIMESTAMP(3),
  ADD COLUMN "modificationCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isDraftConsultation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changes" JSONB NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "vital_history" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "vitals" JSONB NOT NULL,
  "medicalHistoryNotes" TEXT,
  "enteredBy" TEXT NOT NULL,
  "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actionType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vital_history_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
    ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_performedBy_idx" ON "audit_logs"("performedBy");
CREATE INDEX "audit_logs_performedAt_idx" ON "audit_logs"("performedAt");
CREATE INDEX "vital_history_appointmentId_idx" ON "vital_history"("appointmentId");
CREATE INDEX "vital_history_enteredAt_idx" ON "vital_history"("enteredAt");
```

**Gestion des données existantes:**

Aucune perte de données - tous les nouveaux champs sont optionnels ou ont des valeurs par défaut.

---

## Backend - Endpoints API

### Module: AuditModule (NOUVEAU)

**Structure:**
```
backend/src/audit/
├── audit.module.ts
├── audit.service.ts
├── audit.controller.ts
└── dto/
    └── query-audit-logs.dto.ts
```

#### Service: AuditService

**Méthodes:**

```typescript
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une entrée d'audit
   */
  async log(data: {
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string;
    changes: any;
    reason?: string;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Récupérer les logs d'audit d'une entité
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { performedAt: 'desc' },
      include: {
        performer: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }

  /**
   * Récupérer tous les logs d'un utilisateur
   */
  async findByUser(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { performedBy: userId },
      skip,
      take: take || 50,
      orderBy: { performedAt: 'desc' },
    });
  }
}
```

#### Endpoints API

**1. GET /api/audit/entity/:entityType/:entityId**
- **Description**: Récupérer l'historique d'audit d'une entité
- **Rôles**: ADMIN, DOCTOR (pour ses propres RDV)
- **Response**:
```typescript
{
  data: [
    {
      id: "uuid",
      entityType: "APPOINTMENT",
      entityId: "appointment-uuid",
      action: "UPDATED",
      performedBy: "user-uuid",
      performer: { id, name, email, role },
      performedAt: "2025-01-05T10:30:00Z",
      changes: {
        date: { old: "...", new: "..." }
      },
      reason: "Médecin absent"
    }
  ]
}
```

**2. GET /api/audit/user/:userId**
- **Description**: Récupérer les actions d'un utilisateur
- **Rôles**: ADMIN
- **Query params**: `skip`, `take`

---

### Modifications: AppointmentsModule

#### Nouveaux Endpoints

**3. PATCH /api/appointments/:id/update-with-audit**
- **Description**: Modifier RDV avec traçabilité complète
- **Rôles**: SECRETARY, ADMIN
- **DTO**:
```typescript
export class UpdateAppointmentWithAuditDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  reason?: string; // Raison de la modification
}
```

- **Logique**:
```typescript
async updateWithAudit(
  id: string,
  dto: UpdateAppointmentWithAuditDto,
  userId: string
) {
  // 1. Récupérer l'ancien état
  const oldAppointment = await this.findOne(id);

  // 2. Validation: ne pas modifier si consultation en cours
  if ([
    AppointmentStatus.IN_CONSULTATION,
    AppointmentStatus.CONSULTATION_COMPLETED,
    AppointmentStatus.COMPLETED
  ].includes(oldAppointment.status)) {
    throw new BadRequestException(
      'Impossible de modifier un RDV en consultation ou terminé'
    );
  }

  // 3. Construire les changements
  const changes = {};
  if (dto.date && dto.date !== oldAppointment.date.toISOString()) {
    changes['date'] = { old: oldAppointment.date, new: dto.date };
  }
  if (dto.motif && dto.motif !== oldAppointment.motif) {
    changes['motif'] = { old: oldAppointment.motif, new: dto.motif };
  }
  if (dto.doctorId && dto.doctorId !== oldAppointment.doctorId) {
    changes['doctorId'] = { old: oldAppointment.doctorId, new: dto.doctorId };
  }

  // 4. Si pas de changements, retourner directement
  if (Object.keys(changes).length === 0) {
    return oldAppointment;
  }

  // 5. Transaction: Update + Audit Log
  return this.prisma.$transaction(async (tx) => {
    // Update appointment
    const updated = await tx.appointment.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        modifiedBy: userId,
        modifiedAt: new Date(),
        modificationCount: { increment: 1 }
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, email: true } }
      }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        entityType: 'APPOINTMENT',
        entityId: id,
        action: 'UPDATED',
        performedBy: userId,
        changes,
        reason: dto.reason
      }
    });

    return updated;
  });
}
```

**4. GET /api/appointments/in-progress**
- **Description**: Liste des consultations en cours (pour dashboard médecin)
- **Rôles**: DOCTOR, ADMIN
- **Query params**: `doctorId` (optionnel, auto-rempli si DOCTOR)
- **Response**:
```typescript
{
  data: [
    {
      id: "uuid",
      date: "2025-01-05T10:00:00Z",
      motif: "Consultation générale",
      status: "IN_CONSULTATION",
      isDraftConsultation: true,
      consultationNotesDraft: "Patient présente...",
      lastAutoSaveAt: "2025-01-05T10:15:00Z",
      patient: { ... },
      doctor: { ... },
      vitals: { ... }
    }
  ]
}
```

**5. POST /api/appointments/:id/auto-save-notes**
- **Description**: Sauvegarder automatiquement les notes de consultation
- **Rôles**: DOCTOR, ADMIN
- **DTO**:
```typescript
export class AutoSaveConsultationNotesDto {
  @IsString()
  @IsNotEmpty()
  consultationNotesDraft: string;
}
```

- **Logique**:
```typescript
async autoSaveConsultationNotes(
  id: string,
  dto: AutoSaveConsultationNotesDto,
  userId: string
) {
  const appointment = await this.findOne(id);

  // Validation: doit être IN_CONSULTATION ou WAITING_RESULTS
  if (![
    AppointmentStatus.IN_CONSULTATION,
    AppointmentStatus.WAITING_RESULTS
  ].includes(appointment.status)) {
    throw new BadRequestException(
      'Auto-save possible uniquement pendant la consultation'
    );
  }

  // Vérifier que l'utilisateur est bien le médecin assigné
  if (appointment.doctorId !== userId) {
    throw new ForbiddenException(
      'Seul le médecin assigné peut modifier la consultation'
    );
  }

  return this.prisma.appointment.update({
    where: { id },
    data: {
      consultationNotesDraft: dto.consultationNotesDraft,
      lastAutoSaveAt: new Date(),
      isDraftConsultation: true
    },
    include: {
      patient: true,
      doctor: { select: { id: true, name: true, email: true } }
    }
  });
}
```

**6. GET /api/appointments/:id/history**
- **Description**: Historique complet d'un RDV (audit + vitals)
- **Rôles**: DOCTOR, ADMIN
- **Response**:
```typescript
{
  data: {
    appointment: { ... },
    auditLogs: [ ... ],
    vitalHistory: [ ... ]
  }
}
```

---

### Nouveau Module: VitalHistoryModule

**Structure:**
```
backend/src/vital-history/
├── vital-history.module.ts
├── vital-history.service.ts
├── vital-history.controller.ts
└── dto/
    └── auto-save-vitals.dto.ts
```

#### Endpoints

**7. POST /api/vital-history/:appointmentId/auto-save**
- **Description**: Sauvegarder automatiquement les constantes vitales (brouillon)
- **Rôles**: NURSE, ADMIN
- **DTO**:
```typescript
export class AutoSaveVitalsDto {
  @ValidateNested()
  @Type(() => VitalsDto)
  vitals: VitalsDto;

  @IsString()
  @IsOptional()
  medicalHistoryNotes?: string;
}
```

- **Logique**:
```typescript
async autoSave(
  appointmentId: string,
  dto: AutoSaveVitalsDto,
  userId: string
) {
  // 1. Vérifier que le RDV existe et est CHECKED_IN
  const appointment = await this.appointmentsService.findOne(appointmentId);

  if (appointment.status !== AppointmentStatus.CHECKED_IN) {
    throw new BadRequestException(
      'Auto-save possible uniquement après check-in'
    );
  }

  // 2. Créer une entrée d'historique
  return this.prisma.vitalHistory.create({
    data: {
      appointmentId,
      vitals: dto.vitals as any,
      medicalHistoryNotes: dto.medicalHistoryNotes,
      enteredBy: userId,
      actionType: 'AUTO_SAVED'
    }
  });
}
```

**8. GET /api/vital-history/:appointmentId**
- **Description**: Récupérer l'historique des constantes vitales
- **Rôles**: NURSE, DOCTOR, ADMIN
- **Response**:
```typescript
{
  data: [
    {
      id: "uuid",
      vitals: { weight: 70, height: 175, ... },
      medicalHistoryNotes: "...",
      enteredBy: "nurse-uuid",
      enteredAt: "2025-01-05T10:15:00Z",
      actionType: "AUTO_SAVED"
    }
  ]
}
```

**9. POST /api/vital-history/:appointmentId/finalize**
- **Description**: Finaliser la saisie des constantes (remplace enterVitals)
- **Rôles**: NURSE, ADMIN
- **Logique**: Identique à `enterVitals` actuel + création d'un `VitalHistory` avec `actionType: "CREATED"`

---

### Modifications du Service: AppointmentsService

**Méthode à modifier:**

```typescript
async completeConsultation(
  id: string,
  dto: CompleteConsultationDto,
  userId: string
) {
  const appointment = await this.findOne(id);

  // ... validations existantes ...

  return this.prisma.appointment.update({
    where: { id },
    data: {
      status: AppointmentStatus.CONSULTATION_COMPLETED,

      // NOUVEAU: Copier le brouillon vers les notes finales
      consultationNotes: dto.consultationNotes || appointment.consultationNotesDraft,

      // NOUVEAU: Réinitialiser le brouillon
      consultationNotesDraft: null,
      isDraftConsultation: false,

      consultedBy: userId,
      consultedAt: new Date(),
    },
    include: { patient: true, doctor: { select: { ... } } }
  });
}
```

---

### Récapitulatif des Endpoints

| Méthode | Endpoint | Rôle(s) | Description |
|---------|----------|---------|-------------|
| GET | `/api/audit/entity/:type/:id` | ADMIN, DOCTOR | Historique audit d'une entité |
| GET | `/api/audit/user/:userId` | ADMIN | Actions d'un utilisateur |
| PATCH | `/api/appointments/:id/update-with-audit` | SECRETARY, ADMIN | Modifier RDV avec traçabilité |
| GET | `/api/appointments/in-progress` | DOCTOR, ADMIN | Consultations en cours |
| POST | `/api/appointments/:id/auto-save-notes` | DOCTOR | Auto-save notes consultation |
| GET | `/api/appointments/:id/history` | DOCTOR, ADMIN | Historique complet RDV |
| POST | `/api/vital-history/:id/auto-save` | NURSE, ADMIN | Auto-save constantes vitales |
| GET | `/api/vital-history/:id` | NURSE, DOCTOR, ADMIN | Historique constantes vitales |
| POST | `/api/vital-history/:id/finalize` | NURSE, ADMIN | Finaliser saisie constantes |

---

## Frontend - Composants et Pages

### Architecture Frontend

**Structure de dossiers proposée:**

```
frontend/src/
├── pages/
│   ├── Secretary/
│   │   └── EditAppointmentModal.tsx (NOUVEAU)
│   ├── Doctor/
│   │   ├── DoctorConsultationsDashboard.tsx (NOUVEAU)
│   │   └── ConsultationEditor.tsx (NOUVEAU)
│   └── Nurse/
│       └── VitalsEntryForm.tsx (MODIFIÉ)
├── components/
│   ├── common/
│   │   ├── AuditLogViewer.tsx (NOUVEAU)
│   │   └── AutoSaveIndicator.tsx (NOUVEAU)
│   └── forms/
│       └── AppointmentEditForm.tsx (NOUVEAU)
└── hooks/
    ├── useAutoSave.ts (NOUVEAU)
    └── useAuditHistory.ts (NOUVEAU)
```

---

### 1. Component: EditAppointmentModal (NOUVEAU)

**Fichier**: `frontend/src/pages/Secretary/EditAppointmentModal.tsx`

**Props:**
```typescript
interface EditAppointmentModalProps {
  open: boolean;
  appointmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Fonctionnalités:**
- Formulaire de modification (date, motif, médecin)
- Validation: bloquer si statut >= IN_CONSULTATION
- Champ "Raison de modification" (optionnel)
- Affichage de l'historique des modifications (AuditLogViewer)
- API: `PATCH /api/appointments/:id/update-with-audit`

**UI Material-UI:**
- `Dialog` avec titre "Modifier le Rendez-vous"
- `TextField` pour date (DateTimePicker MUI)
- `TextField` pour motif
- `Select` pour sélection médecin
- `TextField` multiline pour raison
- `Button` "Annuler" et "Enregistrer"
- `Snackbar` pour notifications

**Code structure:**
```tsx
export const EditAppointmentModal: FC<EditAppointmentModalProps> = ({
  open, appointmentId, onClose, onSuccess
}) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    motif: '',
    doctorId: '',
    reason: ''
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointment();
      fetchDoctors();
    }
  }, [open, appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.data);
      setFormData({
        date: res.data.data.date,
        motif: res.data.data.motif,
        doctorId: res.data.data.doctorId,
        reason: ''
      });
    } catch (err) {
      // error handling
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(
        `/appointments/${appointmentId}/update-with-audit`,
        formData
      );
      onSuccess();
      onClose();
      // Show success snackbar
    } catch (err) {
      // Show error snackbar
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si modification autorisée
  const canEdit = appointment && [
    'SCHEDULED',
    'CHECKED_IN'
  ].includes(appointment.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier le Rendez-vous</DialogTitle>
      <DialogContent>
        {!canEdit && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Impossible de modifier : consultation en cours ou terminée
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <DateTimePicker
            label="Date et heure"
            value={formData.date}
            onChange={(newValue) => setFormData({ ...formData, date: newValue })}
            disabled={!canEdit}
          />

          <TextField
            fullWidth
            label="Motif"
            value={formData.motif}
            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            disabled={!canEdit}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Médecin</InputLabel>
            <Select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              disabled={!canEdit}
            >
              {doctors.map(doc => (
                <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Raison de la modification"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            disabled={!canEdit}
          />
        </Box>

        {/* Historique des modifications */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Historique des modifications</Typography>
          <AuditLogViewer entityType="APPOINTMENT" entityId={appointmentId} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canEdit || loading}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

### 2. Component: AuditLogViewer (NOUVEAU)

**Fichier**: `frontend/src/components/common/AuditLogViewer.tsx`

**Props:**
```typescript
interface AuditLogViewerProps {
  entityType: string;
  entityId: string;
}
```

**Fonctionnalités:**
- Récupérer historique via `GET /api/audit/entity/:type/:id`
- Afficher timeline des modifications
- Format lisible: "Le 05/01/2025 à 10:30, Dr. Martin a modifié la date de 05/01 10:00 à 06/01 14:00"

**UI:**
```tsx
export const AuditLogViewer: FC<AuditLogViewerProps> = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId]);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get(`/audit/entity/${entityType}/${entityId}`);
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (logs.length === 0) return <Typography>Aucune modification enregistrée</Typography>;

  return (
    <Timeline>
      {logs.map(log => (
        <TimelineItem key={log.id}>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" color="text.secondary">
              {new Date(log.performedAt).toLocaleString('fr-FR')}
            </Typography>
            <Typography variant="body1">
              {log.performer.name} a {log.action === 'UPDATED' ? 'modifié' : 'créé'}
            </Typography>

            {/* Afficher les changements */}
            {Object.keys(log.changes).map(field => (
              <Box key={field} sx={{ pl: 2, mt: 1 }}>
                <Typography variant="body2">
                  <strong>{field}:</strong> {formatChange(log.changes[field])}
                </Typography>
              </Box>
            ))}

            {log.reason && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Raison: {log.reason}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

function formatChange(change: { old: any; new: any }): string {
  // Formatage intelligent selon le type de donnée
  if (change.old instanceof Date || typeof change.old === 'string' && change.old.includes('T')) {
    return `${new Date(change.old).toLocaleString('fr-FR')} → ${new Date(change.new).toLocaleString('fr-FR')}`;
  }
  return `${change.old} → ${change.new}`;
}
```

---

### 3. Page: DoctorConsultationsDashboard (NOUVEAU)

**Fichier**: `frontend/src/pages/Doctor/DoctorConsultationsDashboard.tsx`

**Route**: `/doctor/consultations-in-progress`

**Fonctionnalités:**
- Afficher toutes les consultations en cours (IN_CONSULTATION, WAITING_RESULTS)
- Filtres: date, patient, statut
- Indicateur "Brouillon non sauvegardé" si `isDraftConsultation: true`
- Bouton "Reprendre la consultation" → redirige vers ConsultationEditor

**API**: `GET /api/appointments/in-progress?doctorId=:id`

**UI:**
```tsx
export const DoctorConsultationsDashboard: FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    patientName: ''
  });

  useEffect(() => {
    fetchInProgressConsultations();
  }, [filters]);

  const fetchInProgressConsultations = async () => {
    try {
      const res = await api.get('/appointments/in-progress', {
        params: { doctorId: user.id, ...filters }
      });
      setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Consultations en cours
      </Typography>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Rechercher patient"
              value={filters.patientName}
              onChange={(e) => setFilters({ ...filters, patientName: e.target.value })}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="IN_CONSULTATION">En consultation</MenuItem>
                <MenuItem value="WAITING_RESULTS">En attente résultats</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des consultations */}
      <Grid container spacing={2}>
        {appointments.map(apt => (
          <Grid item xs={12} md={6} key={apt.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(apt.date).toLocaleString('fr-FR')}
                    </Typography>
                    <Chip
                      label={apt.status}
                      color={apt.status === 'IN_CONSULTATION' ? 'primary' : 'warning'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {apt.isDraftConsultation && (
                    <Chip
                      icon={<WarningIcon />}
                      label="Brouillon"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Motif:</strong> {apt.motif}
                </Typography>

                {apt.lastAutoSaveAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Dernière sauvegarde: {new Date(apt.lastAutoSaveAt).toLocaleTimeString('fr-FR')}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                  fullWidth
                >
                  Reprendre la consultation
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {appointments.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucune consultation en cours
          </Typography>
        </Paper>
      )}
    </Container>
  );
};
```

---

### 4. Page: ConsultationEditor (NOUVEAU)

**Fichier**: `frontend/src/pages/Doctor/ConsultationEditor.tsx`

**Route**: `/doctor/consultation/:appointmentId`

**Fonctionnalités:**
- Charger les données du RDV (patient, vitals, notes brouillon)
- Éditeur de notes avec auto-save toutes les 30 secondes
- Indicateur visuel "Sauvegarde automatique..."
- Bouton "Terminer la consultation" (finalise les notes)
- Accès historique des consultations du patient

**Hooks personnalisés**: `useAutoSave`

**UI:**
```tsx
export const ConsultationEditor: FC = () => {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Hook auto-save
  const { isSaving, lastSavedAt } = useAutoSave({
    appointmentId,
    notes: consultationNotes,
    interval: 30000 // 30 secondes
  });

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      const apt = res.data.data;
      setAppointment(apt);

      // Charger brouillon ou notes finales
      setConsultationNotes(apt.consultationNotesDraft || apt.consultationNotes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteConsultation = async () => {
    try {
      await api.patch(`/appointments/${appointmentId}/consultation`, {
        consultationNotes
      });

      // Rediriger vers dashboard
      navigate('/doctor/dashboard');

      // Snackbar success
    } catch (err) {
      // Snackbar error
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Consultation</Typography>
        <Typography variant="body2" color="text.secondary">
          Patient: {appointment.patient.firstName} {appointment.patient.lastName}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Colonne gauche: Informations patient + vitals */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Informations Patient</Typography>
            <Typography variant="body2">
              <strong>Date de naissance:</strong> {new Date(appointment.patient.birthDate).toLocaleDateString('fr-FR')}
            </Typography>
            <Typography variant="body2">
              <strong>Sexe:</strong> {appointment.patient.sex}
            </Typography>
            <Typography variant="body2">
              <strong>Téléphone:</strong> {appointment.patient.phone}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Constantes Vitales</Typography>
            {appointment.vitals && (
              <>
                <Typography variant="body2">Poids: {appointment.vitals.weight} kg</Typography>
                <Typography variant="body2">Taille: {appointment.vitals.height} cm</Typography>
                <Typography variant="body2">
                  Tension: {appointment.vitals.bloodPressure?.systolic}/{appointment.vitals.bloodPressure?.diastolic} mmHg
                </Typography>
                <Typography variant="body2">Température: {appointment.vitals.temperature}°C</Typography>
                <Typography variant="body2">Fréquence cardiaque: {appointment.vitals.heartRate} bpm</Typography>
              </>
            )}

            {appointment.medicalHistoryNotes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Antécédents déclarés:</Typography>
                <Typography variant="body2">{appointment.medicalHistoryNotes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Colonne droite: Éditeur de notes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Notes de Consultation</Typography>

              <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={20}
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Saisir les notes de consultation..."
              variant="outlined"
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/doctor/dashboard')}>
                Annuler
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleCompleteConsultation}
              >
                Terminer la consultation
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
```

---

### 5. Hook: useAutoSave (NOUVEAU)

**Fichier**: `frontend/src/hooks/useAutoSave.ts`

**Fonctionnalités:**
- Déclencher auto-save toutes les X secondes si le texte a changé
- Debouncing pour éviter trop de requêtes
- État `isSaving` pour indicateur visuel
- Timestamp `lastSavedAt`

**Code:**
```typescript
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface UseAutoSaveProps {
  appointmentId: string;
  notes: string;
  interval?: number; // en millisecondes (défaut 30000 = 30s)
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
}

export const useAutoSave = ({
  appointmentId,
  notes,
  interval = 30000
}: UseAutoSaveProps): UseAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previousNotesRef = useRef(notes);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ne rien faire si les notes n'ont pas changé
    if (notes === previousNotesRef.current) {
      return;
    }

    // Nettoyer le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Créer un nouveau timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);

      try {
        await api.post(`/appointments/${appointmentId}/auto-save-notes`, {
          consultationNotesDraft: notes
        });

        setLastSavedAt(new Date());
        previousNotesRef.current = notes;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de sauvegarde automatique');
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, interval);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notes, appointmentId, interval]);

  return { isSaving, lastSavedAt, error };
};
```

---

### 6. Component: AutoSaveIndicator (NOUVEAU)

**Fichier**: `frontend/src/components/common/AutoSaveIndicator.tsx`

**Props:**
```typescript
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}
```

**UI:**
```tsx
export const AutoSaveIndicator: FC<AutoSaveIndicatorProps> = ({ isSaving, lastSavedAt }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isSaving ? (
        <>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Sauvegarde en cours...
          </Typography>
        </>
      ) : lastSavedAt ? (
        <>
          <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
          <Typography variant="caption" color="text.secondary">
            Sauvegardé à {lastSavedAt.toLocaleTimeString('fr-FR')}
          </Typography>
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Pas encore sauvegardé
        </Typography>
      )}
    </Box>
  );
};
```

---

### 7. Modification: VitalsEntryForm (EXISTANT)

**Fichier**: `frontend/src/pages/Nurse/VitalsEntryForm.tsx`

**Nouvelles fonctionnalités:**
- Bouton "Sauvegarder brouillon" (appelle auto-save API)
- Bouton "Valider définitivement" (appelle finalize API)
- Afficher historique des saisies précédentes
- Charger dernière saisie brouillon si disponible

**Modifications:**

```tsx
// Ajouter état pour brouillon
const [isDraft, setIsDraft] = useState(true);

// Fonction auto-save
const handleAutoSave = async () => {
  try {
    await api.post(`/vital-history/${appointmentId}/auto-save`, {
      vitals: formData,
      medicalHistoryNotes
    });

    // Snackbar success
  } catch (err) {
    // Snackbar error
  }
};

// Fonction finalize
const handleFinalize = async () => {
  try {
    await api.post(`/vital-history/${appointmentId}/finalize`, {
      vitals: formData,
      medicalHistoryNotes
    });

    // Rediriger ou fermer
  } catch (err) {
    // error
  }
};

// UI: Ajouter deux boutons
<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
  <Button variant="outlined" onClick={handleAutoSave}>
    Sauvegarder brouillon
  </Button>
  <Button variant="contained" onClick={handleFinalize}>
    Valider définitivement
  </Button>
</Box>

// Section historique
<Box sx={{ mt: 3 }}>
  <Typography variant="h6">Historique des saisies</Typography>
  <VitalHistoryList appointmentId={appointmentId} />
</Box>
```

---

### Récapitulatif Frontend

| Composant | Type | Complexité | Temps Estimé |
|-----------|------|------------|--------------|
| EditAppointmentModal | Page/Modal | M | 4h |
| AuditLogViewer | Component | M | 3h |
| DoctorConsultationsDashboard | Page | M | 5h |
| ConsultationEditor | Page | H | 6h |
| useAutoSave | Hook | M | 3h |
| AutoSaveIndicator | Component | S | 1h |
| VitalsEntryForm (modif) | Page | M | 3h |
| VitalHistoryList | Component | M | 2h |

**Total estimé**: 27 heures frontend

---

## Ordre d'Implémentation

### Phase 1: Database & Backend Foundation (Jour 1-2)

#### TASK-001: Schéma Prisma - AuditLog & VitalHistory
**Complexité**: Medium
**Durée estimée**: 4 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Créer modèle `AuditLog` dans schema.prisma
- [ ] Créer modèle `VitalHistory` dans schema.prisma
- [ ] Ajouter champs traçabilité à `Appointment`
- [ ] Créer énumérations `AuditAction` et `EntityType`
- [ ] Ajouter relations `User` → `AuditLog`
- [ ] Générer migration: `npx prisma migrate dev --name add_audit_traceability`
- [ ] Vérifier migration SQL générée
- [ ] Tester rollback: `npx prisma migrate reset`

**Critères d'acceptation:**
- Migration s'applique sans erreur
- Tous les index sont créés
- Relations foreign key fonctionnent
- Prisma Client se régénère correctement

**Dépendances:** Aucune

---

#### TASK-002: Module AuditModule (Backend)
**Complexité**: Medium
**Durée estimée**: 5 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Créer dossier `backend/src/audit/`
- [ ] Générer module: `nest g module audit`
- [ ] Générer service: `nest g service audit`
- [ ] Générer controller: `nest g controller audit`
- [ ] Implémenter `AuditService.log()`
- [ ] Implémenter `AuditService.findByEntity()`
- [ ] Implémenter `AuditService.findByUser()`
- [ ] Créer DTO `QueryAuditLogsDto`
- [ ] Créer endpoints API:
  - `GET /api/audit/entity/:type/:id`
  - `GET /api/audit/user/:userId`
- [ ] Ajouter guards: `@UseGuards(AuthGuard, RolesGuard)`
- [ ] Ajouter rôles: `@Roles(Role.ADMIN, Role.DOCTOR)`

**Critères d'acceptation:**
- Endpoints retournent données correctement
- Guards vérifient permissions
- Inclut données utilisateur (performer)
- Tri par date décroissant

**Dépendances:** TASK-001

---

#### TASK-003: Module VitalHistoryModule (Backend)
**Complexité**: Medium
**Durée estimée**: 4 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Créer dossier `backend/src/vital-history/`
- [ ] Générer module, service, controller
- [ ] Créer DTO `AutoSaveVitalsDto`
- [ ] Implémenter `VitalHistoryService.autoSave()`
- [ ] Implémenter `VitalHistoryService.findByAppointment()`
- [ ] Implémenter `VitalHistoryService.finalize()`
- [ ] Créer endpoints:
  - `POST /api/vital-history/:id/auto-save`
  - `GET /api/vital-history/:id`
  - `POST /api/vital-history/:id/finalize`
- [ ] Validation: statut doit être CHECKED_IN
- [ ] Ajouter guards NURSE/ADMIN

**Critères d'acceptation:**
- Auto-save crée entrée VitalHistory avec actionType="AUTO_SAVED"
- Finalize crée entrée + update Appointment.vitals + change status
- Historique trié par date décroissant

**Dépendances:** TASK-001

---

### Phase 2: Backend - Appointments Enhancements (Jour 2-3)

#### TASK-004: Endpoint - Update Appointment with Audit
**Complexité**: High
**Durée estimée**: 6 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Créer DTO `UpdateAppointmentWithAuditDto`
- [ ] Implémenter `AppointmentsService.updateWithAudit()`
- [ ] Validation: bloquer si status >= IN_CONSULTATION
- [ ] Calculer `changes` (diff old vs new)
- [ ] Utiliser transaction Prisma: update + audit log
- [ ] Incrémenter `modificationCount`
- [ ] Mettre à jour `modifiedBy` et `modifiedAt`
- [ ] Créer endpoint `PATCH /api/appointments/:id/update-with-audit`
- [ ] Ajouter guards SECRETARY/ADMIN
- [ ] Tests unitaires (3 scénarios)

**Critères d'acceptation:**
- Transaction atomique (rollback si erreur)
- Audit log contient tous les changements
- Erreur si modification sur RDV terminé
- Champ `reason` enregistré correctement

**Dépendances:** TASK-002

---

#### TASK-005: Endpoint - Auto-save Consultation Notes
**Complexité**: Medium
**Durée estimée**: 3 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Créer DTO `AutoSaveConsultationNotesDto`
- [ ] Implémenter `AppointmentsService.autoSaveConsultationNotes()`
- [ ] Validation: status = IN_CONSULTATION ou WAITING_RESULTS
- [ ] Validation: userId = doctorId (seul médecin assigné)
- [ ] Update champs:
  - `consultationNotesDraft`
  - `lastAutoSaveAt`
  - `isDraftConsultation = true`
- [ ] Créer endpoint `POST /api/appointments/:id/auto-save-notes`
- [ ] Guards DOCTOR/ADMIN

**Critères d'acceptation:**
- Forbidden si userId ≠ doctorId
- Timestamp `lastAutoSaveAt` mis à jour
- Flag `isDraftConsultation` activé

**Dépendances:** TASK-001

---

#### TASK-006: Endpoint - Get In-Progress Consultations
**Complexité**: Medium
**Durée estimée**: 3 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Implémenter `AppointmentsService.findInProgress()`
- [ ] Filtrer par status: IN_CONSULTATION, WAITING_RESULTS
- [ ] Filtrer par doctorId (auto-rempli si user.role = DOCTOR)
- [ ] Inclure: patient, doctor, vitals
- [ ] Trier par date décroissant
- [ ] Créer endpoint `GET /api/appointments/in-progress`
- [ ] Query params: `doctorId`, `status`, `date`
- [ ] Guards DOCTOR/ADMIN

**Critères d'acceptation:**
- Médecin voit uniquement ses propres consultations
- Admin voit toutes les consultations
- Includes complets (patient, doctor)

**Dépendances:** TASK-001

---

#### TASK-007: Endpoint - Get Appointment History
**Complexité**: Medium
**Durée estimée**: 2 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Implémenter `AppointmentsService.getHistory()`
- [ ] Récupérer appointment complet
- [ ] Récupérer audit logs via AuditService
- [ ] Récupérer vital history via VitalHistoryService
- [ ] Créer endpoint `GET /api/appointments/:id/history`
- [ ] Guards DOCTOR/ADMIN

**Critères d'acceptation:**
- Retourne: `{ appointment, auditLogs, vitalHistory }`
- Toutes les données triées par date

**Dépendances:** TASK-002, TASK-003

---

#### TASK-008: Modifier completeConsultation
**Complexité**: Low
**Durée estimée**: 2 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Modifier `AppointmentsService.completeConsultation()`
- [ ] Copier `consultationNotesDraft` → `consultationNotes` si non fourni
- [ ] Réinitialiser `consultationNotesDraft = null`
- [ ] Réinitialiser `isDraftConsultation = false`
- [ ] Tests unitaires

**Critères d'acceptation:**
- Notes brouillon copiées vers notes finales
- Champs brouillon réinitialisés

**Dépendances:** TASK-001

---

### Phase 3: Frontend - Secretary Features (Jour 3-4)

#### TASK-009: Component - AuditLogViewer
**Complexité**: Medium
**Durée estimée**: 3 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/components/common/AuditLogViewer.tsx`
- [ ] Implémenter fetch via API `/audit/entity/:type/:id`
- [ ] Utiliser Material-UI Timeline
- [ ] Formater dates en français
- [ ] Formater changements lisibles
- [ ] Gérer état loading/error
- [ ] Tests visuels (Storybook optionnel)

**Critères d'acceptation:**
- Timeline claire et lisible
- Affichage des changements old → new
- Format date français
- Gestion "Aucune modification"

**Dépendances:** TASK-002

---

#### TASK-010: Component - EditAppointmentModal
**Complexité**: Medium
**Durée estimée**: 4 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/pages/Secretary/EditAppointmentModal.tsx`
- [ ] Props: open, appointmentId, onClose, onSuccess
- [ ] Fetch appointment + doctors
- [ ] Material-UI Dialog avec formulaire
- [ ] DateTimePicker pour date
- [ ] Select pour médecin
- [ ] TextField pour motif et raison
- [ ] Validation côté client
- [ ] Bloquer si status >= IN_CONSULTATION
- [ ] Intégrer AuditLogViewer
- [ ] Appeler API `PATCH /appointments/:id/update-with-audit`
- [ ] Snackbar success/error

**Critères d'acceptation:**
- Formulaire pré-rempli avec données existantes
- Désactivé si consultation en cours
- Historique visible en bas du modal
- Message succès/erreur

**Dépendances:** TASK-004, TASK-009

---

#### TASK-011: Intégration EditAppointmentModal dans Appointments List
**Complexité**: Low
**Durée estimée**: 2 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Ouvrir fichier existant `frontend/src/pages/Secretary/AppointmentsList.tsx`
- [ ] Ajouter state pour modal: `editModalOpen`, `selectedAppointmentId`
- [ ] Ajouter bouton "Modifier" dans chaque ligne tableau
- [ ] Implémenter handler `handleOpenEditModal(id)`
- [ ] Implémenter handler `handleCloseEditModal()`
- [ ] Callback `onSuccess` recharge la liste
- [ ] Tester flux complet

**Critères d'acceptation:**
- Bouton "Modifier" visible pour chaque RDV
- Modal s'ouvre et se ferme correctement
- Liste se recharge après modification

**Dépendances:** TASK-010

---

### Phase 4: Frontend - Doctor Features (Jour 4-5)

#### TASK-012: Hook - useAutoSave
**Complexité**: Medium
**Durée estimée**: 3 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/hooks/useAutoSave.ts`
- [ ] Props: appointmentId, notes, interval (default 30000)
- [ ] Implémenter debouncing avec useRef + setTimeout
- [ ] Appeler API `POST /appointments/:id/auto-save-notes`
- [ ] États: isSaving, lastSavedAt, error
- [ ] Cleanup timeout on unmount
- [ ] Tests unitaires (Jest)

**Critères d'acceptation:**
- Auto-save déclenché après X secondes d'inactivité
- Pas de requêtes si notes identiques
- États corrects (isSaving true pendant requête)

**Dépendances:** TASK-005

---

#### TASK-013: Component - AutoSaveIndicator
**Complexité**: Low
**Durée estimée**: 1 heure
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/components/common/AutoSaveIndicator.tsx`
- [ ] Props: isSaving, lastSavedAt
- [ ] Afficher CircularProgress si isSaving
- [ ] Afficher CheckCircle + timestamp si saved
- [ ] Typography avec format français

**Critères d'acceptation:**
- Indicateur clair et visible
- Format heure français (HH:mm:ss)

**Dépendances:** Aucune

---

#### TASK-014: Page - ConsultationEditor
**Complexité**: High
**Durée estimée**: 6 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/pages/Doctor/ConsultationEditor.tsx`
- [ ] Route: `/doctor/consultation/:appointmentId`
- [ ] Fetch appointment via API
- [ ] Charger `consultationNotesDraft` ou `consultationNotes`
- [ ] Layout Grid: colonne gauche (infos patient + vitals), droite (éditeur)
- [ ] Intégrer hook useAutoSave
- [ ] TextField multiline pour notes
- [ ] Intégrer AutoSaveIndicator
- [ ] Bouton "Terminer la consultation" → API `PATCH /appointments/:id/consultation`
- [ ] Redirection vers dashboard après succès
- [ ] Snackbar notifications

**Critères d'acceptation:**
- Auto-save fonctionne toutes les 30s
- Indicateur visible et mis à jour
- Données patient/vitals affichées
- Notes sauvegardées correctement

**Dépendances:** TASK-012, TASK-013

---

#### TASK-015: Page - DoctorConsultationsDashboard
**Complexité**: Medium
**Durée estimée**: 5 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/pages/Doctor/DoctorConsultationsDashboard.tsx`
- [ ] Route: `/doctor/consultations-in-progress`
- [ ] Fetch via API `GET /appointments/in-progress`
- [ ] Filtres: status, date, patient name
- [ ] Grid de Cards Material-UI
- [ ] Afficher: patient, date, statut, motif
- [ ] Chip "Brouillon" si `isDraftConsultation = true`
- [ ] Afficher `lastAutoSaveAt` si disponible
- [ ] Bouton "Reprendre la consultation" → navigate vers ConsultationEditor
- [ ] État vide: "Aucune consultation en cours"

**Critères d'acceptation:**
- Liste affichée correctement
- Filtres fonctionnent
- Navigation vers ConsultationEditor OK
- Indicateurs visuels clairs

**Dépendances:** TASK-006, TASK-014

---

#### TASK-016: Ajouter route et lien dans navigation
**Complexité**: Low
**Durée estimée**: 1 heure
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Modifier `frontend/src/App.tsx`
- [ ] Ajouter routes:
  - `/doctor/consultations-in-progress`
  - `/doctor/consultation/:appointmentId`
- [ ] Modifier Sidebar/Navigation
- [ ] Ajouter lien "Consultations en cours" pour rôle DOCTOR
- [ ] Tester navigation

**Critères d'acceptation:**
- Routes accessibles
- Lien visible dans menu médecin

**Dépendances:** TASK-014, TASK-015

---

### Phase 5: Frontend - Nurse Features (Jour 5-6)

#### TASK-017: Component - VitalHistoryList
**Complexité**: Medium
**Durée estimée**: 2 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Créer fichier `frontend/src/components/common/VitalHistoryList.tsx`
- [ ] Props: appointmentId
- [ ] Fetch via API `GET /vital-history/:id`
- [ ] Afficher liste chronologique (Timeline ou List)
- [ ] Formater vitals lisiblement
- [ ] Afficher qui a saisi (enteredBy) et quand
- [ ] Différencier AUTO_SAVED vs CREATED

**Critères d'acceptation:**
- Liste claire et lisible
- Tri par date décroissant
- Distinction visuelle brouillon vs finalisé

**Dépendances:** TASK-003

---

#### TASK-018: Modifier VitalsEntryForm
**Complexité**: Medium
**Durée estimée**: 3 heures
**Assigné à**: Frontend Developer

**Sous-tâches:**
- [ ] Ouvrir fichier existant `frontend/src/pages/Nurse/VitalsEntryForm.tsx`
- [ ] Ajouter bouton "Sauvegarder brouillon"
- [ ] Handler `handleAutoSave()` → API `POST /vital-history/:id/auto-save`
- [ ] Renommer bouton existant en "Valider définitivement"
- [ ] Handler `handleFinalize()` → API `POST /vital-history/:id/finalize`
- [ ] Section "Historique des saisies"
- [ ] Intégrer VitalHistoryList
- [ ] Charger dernière saisie brouillon au montage (optionnel)

**Critères d'acceptation:**
- Deux boutons distincts
- Brouillon sauvegarde sans changer status
- Validation finalise et change status
- Historique visible

**Dépendances:** TASK-003, TASK-017

---

### Phase 6: Tests & Documentation (Jour 6-7)

#### TASK-019: Tests Backend - Unit Tests
**Complexité**: Medium
**Durée estimée**: 6 heures
**Assigné à**: Backend Developer

**Tests à créer:**

**AuditService:**
- [ ] log() crée entrée avec tous les champs
- [ ] findByEntity() retourne logs triés
- [ ] findByUser() retourne logs d'un utilisateur

**AppointmentsService:**
- [ ] updateWithAudit() crée audit log correct
- [ ] updateWithAudit() bloque si status >= IN_CONSULTATION
- [ ] updateWithAudit() calcule changements correctement
- [ ] autoSaveConsultationNotes() met à jour champs
- [ ] autoSaveConsultationNotes() rejette si userId ≠ doctorId
- [ ] findInProgress() retourne uniquement consultations en cours
- [ ] completeConsultation() copie brouillon vers notes finales

**VitalHistoryService:**
- [ ] autoSave() crée entrée avec actionType AUTO_SAVED
- [ ] finalize() crée entrée + update appointment
- [ ] findByAppointment() retourne historique trié

**Critères d'acceptation:**
- Tous les tests passent
- Coverage > 80%

**Dépendances:** TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-008

---

#### TASK-020: Tests Backend - Integration Tests
**Complexité**: Medium
**Durée estimée**: 4 heures
**Assigné à**: Backend Developer

**Scénarios:**
- [ ] Flux complet modification RDV avec audit
- [ ] Flux auto-save consultation notes
- [ ] Flux auto-save vitals puis finalize
- [ ] Vérification permissions guards

**Critères d'acceptation:**
- Tests E2E passent
- Transactions testées (rollback si erreur)

**Dépendances:** TASK-019

---

#### TASK-021: Tests Frontend - Component Tests
**Complexité**: Medium
**Durée estimée**: 4 heures
**Assigné à**: Frontend Developer

**Tests à créer:**
- [ ] AuditLogViewer affiche timeline correctement
- [ ] EditAppointmentModal pré-remplit formulaire
- [ ] EditAppointmentModal désactive si status invalid
- [ ] AutoSaveIndicator affiche états corrects
- [ ] useAutoSave hook déclenche auto-save

**Critères d'acceptation:**
- Tests unitaires React Testing Library
- Mocking API requests

**Dépendances:** TASK-009, TASK-010, TASK-012, TASK-013

---

#### TASK-022: Tests Frontend - E2E Tests (Optionnel)
**Complexité**: High
**Durée estimée**: 6 heures
**Assigné à**: QA / Frontend Developer

**Scénarios Playwright/Cypress:**
- [ ] Secrétaire modifie un RDV et vérifie audit
- [ ] Médecin reprend consultation en cours
- [ ] Médecin auto-save notes et termine consultation
- [ ] Infirmier sauvegarde brouillon vitals puis finalise

**Critères d'acceptation:**
- Scénarios E2E complets
- Tests stables (pas de flakiness)

**Dépendances:** Toutes les tâches frontend/backend

---

#### TASK-023: Documentation - API Documentation
**Complexité**: Low
**Durée estimée**: 2 heures
**Assigné à**: Backend Developer

**Sous-tâches:**
- [ ] Mettre à jour `docs/API.md`
- [ ] Documenter nouveaux endpoints
- [ ] Exemples de requêtes/réponses
- [ ] Documenter DTOs

**Critères d'acceptation:**
- Documentation complète et claire
- Exemples curl ou Postman

**Dépendances:** Toutes les tâches backend

---

#### TASK-024: Documentation - User Guide
**Complexité**: Low
**Durée estimée**: 2 heures
**Assigné à**: Product Owner / Tech Writer

**Sous-tâches:**
- [ ] Créer guide utilisateur pour secrétaires
- [ ] Créer guide pour médecins (dashboard consultations)
- [ ] Créer guide pour infirmiers (auto-save vitals)
- [ ] Screenshots et annotations

**Critères d'acceptation:**
- Guides clairs avec captures d'écran
- Processus étape par étape

**Dépendances:** Toutes les tâches fonctionnelles

---

### Récapitulatif Phases

| Phase | Durée | Tâches | Dépendances Critiques |
|-------|-------|--------|----------------------|
| 1. Database & Backend Foundation | 1.5 jours | TASK-001 à TASK-003 | Aucune |
| 2. Backend Appointments Enhancements | 1.5 jours | TASK-004 à TASK-008 | Phase 1 |
| 3. Frontend Secretary Features | 1 jour | TASK-009 à TASK-011 | Phase 2 |
| 4. Frontend Doctor Features | 1.5 jours | TASK-012 à TASK-016 | Phase 2 |
| 5. Frontend Nurse Features | 0.5 jour | TASK-017 à TASK-018 | Phase 2 |
| 6. Tests & Documentation | 2 jours | TASK-019 à TASK-024 | Toutes les phases |

**Durée totale estimée**: 7-8 jours

---

## Stratégie de Tests

### Tests Unitaires Backend

**Framework**: Jest + @nestjs/testing

**Fichiers de test:**

```
backend/src/
├── audit/
│   └── audit.service.spec.ts
├── appointments/
│   └── appointments.service.spec.ts (modifier existant)
└── vital-history/
    └── vital-history.service.spec.ts
```

**Exemple de test:**

```typescript
// audit.service.spec.ts
describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const mockData = {
        entityType: 'APPOINTMENT',
        entityId: 'uuid-123',
        action: 'UPDATED',
        performedBy: 'user-uuid',
        changes: { date: { old: '...', new: '...' } },
      };

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
        id: 'log-uuid',
        ...mockData,
        performedAt: new Date(),
        createdAt: new Date(),
      } as any);

      const result = await service.log(mockData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: mockData });
      expect(result.id).toBe('log-uuid');
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs sorted by date desc', async () => {
      const mockLogs = [
        { id: '1', performedAt: new Date('2025-01-05') },
        { id: '2', performedAt: new Date('2025-01-04') },
      ];

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(mockLogs as any);

      const result = await service.findByEntity('APPOINTMENT', 'uuid-123');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { entityType: 'APPOINTMENT', entityId: 'uuid-123' },
        orderBy: { performedAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
```

**Tests AppointmentsService:**

```typescript
describe('AppointmentsService - updateWithAudit', () => {
  it('should block update if status >= IN_CONSULTATION', async () => {
    const mockAppointment = {
      id: 'uuid',
      status: AppointmentStatus.IN_CONSULTATION,
      // ... autres champs
    };

    jest.spyOn(service, 'findOne').mockResolvedValue(mockAppointment as any);

    await expect(
      service.updateWithAudit('uuid', { date: '...' }, 'user-uuid')
    ).rejects.toThrow(BadRequestException);
  });

  it('should create audit log on successful update', async () => {
    // Mock transaction
    const txMock = {
      appointment: { update: jest.fn().mockResolvedValue({ id: 'uuid' }) },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'log-uuid' }) },
    };

    jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      return callback(txMock as any);
    });

    const result = await service.updateWithAudit(
      'uuid',
      { date: '2025-01-06', reason: 'Test' },
      'user-uuid'
    );

    expect(txMock.auditLog.create).toHaveBeenCalled();
  });
});
```

---

### Tests d'Intégration Backend

**Fichier**: `backend/test/appointments.e2e-spec.ts`

```typescript
describe('Appointments E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookie: string;

  beforeAll(async () => {
    // Setup app et DB test
  });

  describe('PATCH /appointments/:id/update-with-audit', () => {
    it('should update appointment and create audit log', async () => {
      // 1. Créer un RDV
      const appointment = await prisma.appointment.create({ ... });

      // 2. Modifier via API
      const response = await request(app.getHttpServer())
        .patch(`/appointments/${appointment.id}/update-with-audit`)
        .set('Cookie', authCookie)
        .send({
          date: '2025-01-06T10:00:00Z',
          reason: 'Médecin absent'
        })
        .expect(200);

      // 3. Vérifier RDV modifié
      const updated = await prisma.appointment.findUnique({ where: { id: appointment.id } });
      expect(updated.modificationCount).toBe(1);

      // 4. Vérifier audit log créé
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: appointment.id }
      });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].changes).toHaveProperty('date');
    });
  });

  describe('POST /appointments/:id/auto-save-notes', () => {
    it('should auto-save consultation notes', async () => {
      const appointment = await prisma.appointment.create({
        data: {
          status: AppointmentStatus.IN_CONSULTATION,
          // ...
        }
      });

      const response = await request(app.getHttpServer())
        .post(`/appointments/${appointment.id}/auto-save-notes`)
        .set('Cookie', authCookie)
        .send({ consultationNotesDraft: 'Test notes' })
        .expect(201);

      const updated = await prisma.appointment.findUnique({ where: { id: appointment.id } });
      expect(updated.consultationNotesDraft).toBe('Test notes');
      expect(updated.isDraftConsultation).toBe(true);
      expect(updated.lastAutoSaveAt).toBeTruthy();
    });
  });
});
```

---

### Tests Frontend

**Framework**: Jest + React Testing Library

**Exemple test component:**

```typescript
// EditAppointmentModal.test.tsx
describe('EditAppointmentModal', () => {
  it('should pre-fill form with existing data', async () => {
    const mockAppointment = {
      id: 'uuid',
      date: '2025-01-05T10:00:00Z',
      motif: 'Consultation',
      doctorId: 'doctor-uuid',
      status: 'SCHEDULED',
    };

    jest.spyOn(api, 'get').mockResolvedValue({ data: { data: mockAppointment } });

    render(
      <EditAppointmentModal
        open={true}
        appointmentId="uuid"
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Motif')).toHaveValue('Consultation');
    });
  });

  it('should disable form if status >= IN_CONSULTATION', async () => {
    const mockAppointment = {
      id: 'uuid',
      status: 'IN_CONSULTATION',
      // ...
    };

    jest.spyOn(api, 'get').mockResolvedValue({ data: { data: mockAppointment } });

    render(<EditAppointmentModal ... />);

    await waitFor(() => {
      expect(screen.getByLabelText('Motif')).toBeDisabled();
    });
  });
});
```

**Test hook useAutoSave:**

```typescript
// useAutoSave.test.ts
describe('useAutoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should trigger auto-save after interval', async () => {
    const mockPost = jest.spyOn(api, 'post').mockResolvedValue({});

    const { result } = renderHook(() =>
      useAutoSave({
        appointmentId: 'uuid',
        notes: 'Test notes',
        interval: 5000,
      })
    );

    expect(result.current.isSaving).toBe(false);

    // Fast-forward 5 secondes
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/appointments/uuid/auto-save-notes', {
        consultationNotesDraft: 'Test notes',
      });
    });
  });

  it('should not trigger if notes unchanged', async () => {
    const mockPost = jest.spyOn(api, 'post').mockResolvedValue({});

    const { rerender } = renderHook(
      ({ notes }) => useAutoSave({ appointmentId: 'uuid', notes, interval: 5000 }),
      { initialProps: { notes: 'Test' } }
    );

    // Rerender avec mêmes notes
    rerender({ notes: 'Test' });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockPost).not.toHaveBeenCalled();
  });
});
```

---

### Tests E2E (Optionnel mais Recommandé)

**Framework**: Playwright

**Scénario complet:**

```typescript
// e2e/consultation-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Consultation Workflow with Traceability', () => {
  test('Secretary modifies appointment and audit log is created', async ({ page }) => {
    // 1. Login as secretary
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'secretary@hospital.com');
    await page.fill('input[name="password"]', 'secretary123');
    await page.click('button[type="submit"]');

    // 2. Navigate to appointments
    await page.click('text=Rendez-vous');
    await expect(page.locator('h4')).toContainText('Liste des Rendez-vous');

    // 3. Click "Modifier" on first appointment
    await page.click('button:has-text("Modifier")').first();

    // 4. Wait for modal to open
    await expect(page.locator('h2')).toContainText('Modifier le Rendez-vous');

    // 5. Change date
    await page.fill('input[label="Date et heure"]', '2025-01-06T14:00');

    // 6. Add reason
    await page.fill('textarea[label="Raison de la modification"]', 'Médecin en congé');

    // 7. Save
    await page.click('button:has-text("Enregistrer")');

    // 8. Verify snackbar success
    await expect(page.locator('.MuiSnackbar-root')).toContainText('Rendez-vous modifié');

    // 9. Reopen modal and check audit log
    await page.click('button:has-text("Modifier")').first();
    await expect(page.locator('.MuiTimeline-root')).toContainText('modifié');
    await expect(page.locator('.MuiTimeline-root')).toContainText('Médecin en congé');
  });

  test('Doctor auto-saves consultation notes', async ({ page }) => {
    // 1. Login as doctor
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'doctor@hospital.com');
    await page.fill('input[name="password"]', 'doctor123');
    await page.click('button[type="submit"]');

    // 2. Navigate to in-progress consultations
    await page.click('text=Consultations en cours');

    // 3. Click "Reprendre la consultation"
    await page.click('button:has-text("Reprendre la consultation")').first();

    // 4. Type notes
    await page.fill('textarea', 'Patient présente des symptômes de...');

    // 5. Wait for auto-save (30 secondes)
    await page.waitForTimeout(31000);

    // 6. Verify auto-save indicator
    await expect(page.locator('text=Sauvegardé à')).toBeVisible();

    // 7. Complete consultation
    await page.click('button:has-text("Terminer la consultation")');

    // 8. Verify redirect to dashboard
    await expect(page).toHaveURL(/\/doctor\/dashboard/);
  });
});
```

---

## Migration et Déploiement

### Checklist Pre-Migration

- [ ] Backup complet de la base de données
- [ ] Vérifier version Prisma (v6.x)
- [ ] Tester migration sur environnement de staging
- [ ] Vérifier espace disque disponible
- [ ] Documenter plan de rollback

### Commandes Migration

```bash
# 1. Développement: Créer et appliquer migration
cd backend
npx prisma migrate dev --name add_audit_traceability

# 2. Staging: Appliquer migration
npx prisma migrate deploy

# 3. Production: Appliquer migration
DATABASE_URL="postgresql://user:password@prod-server:5432/hospital_prod" \
  npx prisma migrate deploy

# 4. Vérifier état migrations
npx prisma migrate status
```

### Plan de Rollback

**Si problème détecté après migration:**

```bash
# Option 1: Rollback via migration inverse (si créée)
npx prisma migrate resolve --rolled-back XXX_add_audit_traceability

# Option 2: Restauration backup
pg_restore -d hospital_mvp backup_pre_migration.dump

# Option 3: SQL manuel pour supprimer les changements
psql -d hospital_mvp -c "DROP TABLE IF EXISTS audit_logs CASCADE;"
psql -d hospital_mvp -c "DROP TABLE IF EXISTS vital_history CASCADE;"
psql -d hospital_mvp -c "ALTER TABLE appointments DROP COLUMN IF EXISTS consultationNotesDraft;"
# ... autres DROP COLUMN ...
```

### Déploiement Frontend

```bash
# 1. Build production
cd frontend
npm run build

# 2. Tester build localement
npm run preview

# 3. Déployer (selon infrastructure)
# Option A: Electron packaging
npm run electron:build

# Option B: Serveur web
rsync -avz dist/ user@server:/var/www/hospital-app/
```

### Vérifications Post-Déploiement

**Backend:**
- [ ] Tous les endpoints répondent (status 200/201)
- [ ] Logs applicatifs sans erreurs
- [ ] Performance acceptable (< 500ms par requête)
- [ ] Connexions DB stables

**Frontend:**
- [ ] Application se charge sans erreurs console
- [ ] Auto-save fonctionne
- [ ] Modals s'ouvrent correctement
- [ ] Navigation fluide

**Base de données:**
- [ ] Tables créées avec bons index
- [ ] Foreign keys actives
- [ ] Pas de données corrompues

**Tests de bout en bout:**
- [ ] Secrétaire peut modifier RDV
- [ ] Audit log enregistré correctement
- [ ] Médecin voit consultations en cours
- [ ] Auto-save notes fonctionne
- [ ] Infirmier peut sauvegarder vitals

---

## Risques et Mitigation

### Risques Techniques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Migration Prisma échoue | Haut | Faible | Tester en staging, backup complet |
| Performances dégradées (audit logs) | Moyen | Moyen | Index sur tables, limiter historique |
| Auto-save surcharge serveur | Moyen | Moyen | Debouncing frontend, rate limiting backend |
| Conflits concurrence (auto-save) | Faible | Faible | Optimistic locking avec version field |
| Erreurs transaction Prisma | Moyen | Faible | Tests unitaires complets, rollback automatique |

### Risques Fonctionnels

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Utilisateurs perdent données brouillon | Haut | Faible | Auto-save fréquent, indicateur visuel |
| Confusion entre brouillon/finalisé | Moyen | Moyen | UI claire, confirmations |
| Audit log trop verbeux | Faible | Moyen | Filtrer actions importantes uniquement |
| Permissions incorrectes | Haut | Faible | Tests guards complets |

### Plan de Contingence

**Si auto-save ne fonctionne pas:**
- Fallback: Bouton "Sauvegarder manuellement"
- LocalStorage temporaire côté frontend

**Si audit logs surchargent DB:**
- Archive mensuelle vers table séparée
- Limite 1000 dernières entrées par entité

**Si performances dégradées:**
- Pagination audit logs
- Lazy loading historique
- Cache Redis pour consultations en cours

---

## Métriques de Succès

### Métriques Techniques

- **Temps de réponse API** < 500ms (p95)
- **Auto-save** déclenché < 35 secondes après dernière modification
- **Coverage tests** > 80%
- **Taux d'erreur** < 1%

### Métriques Fonctionnelles

- **Adoption modification RDV avec audit** > 90% des modifications
- **Utilisation dashboard consultations** > 70% des médecins
- **Auto-save activé** sur toutes les consultations en cours
- **Satisfaction utilisateur** (survey post-déploiement) > 4/5

### KPIs Post-Déploiement (30 jours)

- Nombre de modifications RDV tracées
- Nombre de consultations reprises via dashboard
- Nombre d'auto-saves déclenchés
- Temps moyen consultation réduit (objectif: -20%)

---

## Annexes

### A. Schéma de Base de Données Complet

```prisma
// Voir section "Modifications du Schéma Prisma"
```

### B. Exemples de Payload API

**PATCH /api/appointments/:id/update-with-audit**

Request:
```json
{
  "date": "2025-01-06T14:00:00Z",
  "doctorId": "new-doctor-uuid",
  "reason": "Médecin initialement prévu en congé"
}
```

Response:
```json
{
  "data": {
    "id": "appointment-uuid",
    "date": "2025-01-06T14:00:00.000Z",
    "motif": "Consultation générale",
    "status": "SCHEDULED",
    "modifiedBy": "secretary-uuid",
    "modifiedAt": "2025-01-05T15:30:00.000Z",
    "modificationCount": 1,
    "patient": { ... },
    "doctor": { ... }
  },
  "message": "Rendez-vous modifié avec succès"
}
```

**GET /api/audit/entity/APPOINTMENT/:appointmentId**

Response:
```json
{
  "data": [
    {
      "id": "log-uuid-1",
      "entityType": "APPOINTMENT",
      "entityId": "appointment-uuid",
      "action": "UPDATED",
      "performedBy": "secretary-uuid",
      "performer": {
        "id": "secretary-uuid",
        "name": "Marie Dubois",
        "email": "secretary@hospital.com",
        "role": "SECRETARY"
      },
      "performedAt": "2025-01-05T15:30:00.000Z",
      "changes": {
        "date": {
          "old": "2025-01-05T10:00:00.000Z",
          "new": "2025-01-06T14:00:00.000Z"
        },
        "doctorId": {
          "old": "doctor-1-uuid",
          "new": "doctor-2-uuid"
        }
      },
      "reason": "Médecin initialement prévu en congé"
    }
  ]
}
```

### C. Structure Complète des Fichiers

```
backend/
├── src/
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   ├── audit.service.spec.ts
│   │   ├── audit.controller.ts
│   │   └── dto/
│   │       └── query-audit-logs.dto.ts
│   ├── vital-history/
│   │   ├── vital-history.module.ts
│   │   ├── vital-history.service.ts
│   │   ├── vital-history.service.spec.ts
│   │   ├── vital-history.controller.ts
│   │   └── dto/
│   │       └── auto-save-vitals.dto.ts
│   └── appointments/
│       ├── dto/
│       │   ├── update-appointment-with-audit.dto.ts (NOUVEAU)
│       │   └── auto-save-consultation-notes.dto.ts (NOUVEAU)
│       ├── appointments.service.ts (MODIFIÉ)
│       └── appointments.controller.ts (MODIFIÉ)
│
frontend/
├── src/
│   ├── pages/
│   │   ├── Secretary/
│   │   │   └── EditAppointmentModal.tsx (NOUVEAU)
│   │   ├── Doctor/
│   │   │   ├── DoctorConsultationsDashboard.tsx (NOUVEAU)
│   │   │   └── ConsultationEditor.tsx (NOUVEAU)
│   │   └── Nurse/
│   │       └── VitalsEntryForm.tsx (MODIFIÉ)
│   ├── components/
│   │   └── common/
│   │       ├── AuditLogViewer.tsx (NOUVEAU)
│   │       ├── AutoSaveIndicator.tsx (NOUVEAU)
│   │       └── VitalHistoryList.tsx (NOUVEAU)
│   └── hooks/
│       ├── useAutoSave.ts (NOUVEAU)
│       └── useAuditHistory.ts (NOUVEAU - optionnel)
```

---

## Conclusion

Ce plan d'implémentation fournit une roadmap complète pour ajouter la traçabilité et l'auto-sauvegarde au système hospitalier.

**Points clés:**
- Architecture solide avec modèles `AuditLog` et `VitalHistory`
- API RESTful complète pour toutes les fonctionnalités
- UI intuitive avec Material-UI
- Tests complets (unit + intégration + E2E)
- Migration sécurisée avec plan de rollback

**Prochaines étapes:**
1. Validation du plan par l'équipe technique
2. Démarrage Phase 1 (Database & Backend Foundation)
3. Revue de code après chaque phase
4. Tests progressifs en staging
5. Déploiement en production avec monitoring

**Ressources nécessaires:**
- 1 Backend Developer (NestJS/Prisma)
- 1 Frontend Developer (React/TypeScript)
- 1 QA Engineer (optionnel pour E2E)
- DBA pour supervision migration

**Durée totale**: 7-8 jours de développement + 2 jours de tests/déploiement = **~2 semaines**

---

**Auteur**: Specification Planner
**Date de création**: 2025-01-05
**Dernière mise à jour**: 2025-01-05
**Version**: 1.0
