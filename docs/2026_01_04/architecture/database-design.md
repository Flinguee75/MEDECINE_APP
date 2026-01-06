# Database Design - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Version**: 2.0 (Extended from v1.0)
**Database**: PostgreSQL with Prisma ORM v6.x

---

## Executive Summary

This document specifies the complete database schema for the clinical workflow system, including all new fields, enums, and relations required to support the 11-step workflow. The design maintains backward compatibility with existing data while extending models to support check-in, vitals, consultation, lab workflow, and billing.

**Key Changes**:
- 1 new enum value (NURSE role)
- 3 new appointment statuses
- 2 new prescription statuses
- 1 new billing status enum
- 17 new database fields across 3 models
- 1 new relation (Prescription → User for nurse)
- 7 database migrations required

---

## Complete Prisma Schema

```prisma
// Schéma Prisma pour le MVP Système de Gestion Hospitalière
// Base de données : PostgreSQL
// Version : 2.0 (Extended Clinical Workflow)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ÉNUMÉRATIONS
// ============================================

enum Role {
  ADMIN
  DOCTOR
  BIOLOGIST
  NURSE       // NEW: Added for clinical workflow
  SECRETARY
}

enum AppointmentStatus {
  SCHEDULED              // Planifié (initial state)
  CHECKED_IN             // NEW: Enregistré (patient arrived)
  IN_CONSULTATION        // NEW: En consultation (vitals entered)
  CONSULTATION_COMPLETED // NEW: Consultation terminée
  COMPLETED              // Terminé (final state after billing)
  CANCELLED              // Annulé
}

enum PrescriptionStatus {
  CREATED            // Créée par le médecin
  SENT_TO_LAB        // Envoyée au laboratoire
  SAMPLE_COLLECTED   // NEW: Échantillon collecté par infirmier
  IN_PROGRESS        // En cours d'analyse
  RESULTS_AVAILABLE  // NEW: Résultats disponibles (biologist validated)
  COMPLETED          // Complété (doctor reviewed)
}

enum BillingStatus {  // NEW: Billing status enum
  PENDING
  PAID
  PARTIALLY_PAID
}

// ============================================
// MODÈLES
// ============================================

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
  nursePrescriptions   Prescription[] @relation("NursePrescriptions")  // NEW

  @@map("users")
}

model Patient {
  id                 String   @id @default(uuid())
  firstName          String
  lastName           String
  birthDate          DateTime
  sex                String   @default("NON_SPECIFIE")
  phone              String   @default("")
  address            String   @default("")
  emergencyContact   String   @default("")
  insurance          String   @default("")
  idNumber           String?
  consentMedicalData Boolean  @default(false)
  consentContact     Boolean  @default(false)
  medicalHistory     Json?    // Antécédents médicaux (allergies, maladies chroniques, etc.)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  appointments  Appointment[]
  prescriptions Prescription[]
  documents     Document[]

  @@map("patients")
}

model Appointment {
  id     String            @id @default(uuid())
  date   DateTime
  motif  String            // Raison du rendez-vous
  status AppointmentStatus @default(SCHEDULED)

  // Vitals (JSON structure for flexibility)
  vitals Json? // NEW: Constantes vitales saisies par infirmier

  // Medical history notes (declared by patient to nurse)
  medicalHistoryNotes String? @db.Text // NEW

  // Consultation notes (entered by doctor)
  consultationNotes String? @db.Text // NEW

  // Workflow timestamps
  checkedInAt     DateTime? // NEW: When patient was checked in
  vitalsEnteredAt DateTime? // NEW: When vitals were entered
  consultedAt     DateTime? // NEW: When consultation was completed
  closedAt        DateTime? // NEW: When appointment was closed

  // User tracking
  vitalsEnteredBy String? // NEW: userId of nurse who entered vitals
  consultedBy     String? // NEW: userId of doctor who consulted
  closedBy        String? // NEW: userId of secretary who closed

  // Billing information
  billingAmount Decimal?       @db.Decimal(10, 2) // NEW: Billing amount
  billingStatus BillingStatus? @default(PENDING)  // NEW: Payment status

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  doctorId String
  doctor   User   @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([doctorId])
  @@index([date])
  @@index([status]) // NEW: Index for status filtering
  @@map("appointments")
}

model Prescription {
  id     String             @id @default(uuid())
  text   String             @db.Text // Détails de la prescription
  status PrescriptionStatus @default(CREATED)

  // Lab workflow timestamps
  sampleCollectedAt  DateTime? // NEW: When sample was collected
  analysisStartedAt  DateTime? // NEW: When analysis started
  analysisCompletedAt DateTime? // NEW: When analysis completed (optional tracking)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  doctorId String
  doctor   User   @relation("DoctorPrescriptions", fields: [doctorId], references: [id], onDelete: Cascade)

  // NEW: Nurse who collected sample
  nurseId String?
  nurse   User?   @relation("NursePrescriptions", fields: [nurseId], references: [id], onDelete: SetNull)

  result Result? // Une prescription peut avoir un résultat (one-to-one)

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@map("prescriptions")
}

model Result {
  id   String  @id @default(uuid())
  data Json?   // Constantes biologiques structurées (optional)
  text String  @db.Text // Commentaires et conclusion du biologiste

  // Validation by biologist
  validatedBy String?   // NEW: userId of biologist
  validatedAt DateTime? // NEW: When biologist validated

  // Review by doctor
  reviewedBy     String?   // NEW: userId of doctor
  reviewedAt     DateTime? // NEW: When doctor reviewed
  interpretation String?   @db.Text // NEW: Doctor's medical interpretation

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  prescriptionId String       @unique
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)

  @@map("results")
}

model Document {
  id         String   @id @default(uuid())
  name       String   // Nom du fichier
  type       String   // Type de document (ordonnance, radio, etc.)
  url        String   // Chemin du fichier ou URL
  uploadedBy String?  // ID de l'utilisateur qui a uploadé
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@map("documents")
}
```

---

## Entity-Relationship Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                            USERS                                   │
│  - id (UUID, PK)                                                   │
│  - name                                                            │
│  - email (UNIQUE)                                                  │
│  - password (hashed)                                               │
│  - role (ADMIN, DOCTOR, BIOLOGIST, NURSE, SECRETARY) ← EXTENDED  │
│  - createdAt, updatedAt                                           │
└────────────┬────────────┬──────────────────────┬──────────────────┘
             │            │                      │
             │            │                      │
             │ doctor     │ nurse (NEW)          │
             │            │                      │
┌────────────▼────────┐   │         ┌───────────▼────────────┐
│  APPOINTMENTS       │   │         │  PRESCRIPTIONS         │
│  - id (UUID, PK)    │   │         │  - id (UUID, PK)       │
│  - date             │   │         │  - text                │
│  - motif            │   │         │  - status ← EXTENDED   │
│  - status ← EXTENDED│   │         │                        │
│                     │   │         │  - doctorId (FK)       │
│  NEW FIELDS:        │   │         │  - patientId (FK)      │
│  - vitals (JSON)    │   │         │  - nurseId (FK) ← NEW  │
│  - medicalHistory   │   │         │                        │
│  - consultationNotes│   │         │  NEW FIELDS:           │
│  - checkedInAt      │   └────────>│  - sampleCollectedAt   │
│  - vitalsEnteredAt  │             │  - analysisStartedAt   │
│  - consultedAt      │             │  - analysisCompletedAt │
│  - closedAt         │             │                        │
│  - vitalsEnteredBy  │             │  - createdAt           │
│  - consultedBy      │             │  - updatedAt           │
│  - closedBy         │             └─────────┬──────────────┘
│  - billingAmount    │                       │
│  - billingStatus    │                       │ 1:1
│                     │                       │
│  - doctorId (FK)    │             ┌─────────▼──────────────┐
│  - patientId (FK)   │             │  RESULTS               │
│  - createdAt        │             │  - id (UUID, PK)       │
│  - updatedAt        │             │  - text                │
└────────┬────────────┘             │  - data (JSON)         │
         │                          │                        │
         │ patient                  │  NEW FIELDS:           │
         │                          │  - validatedBy (FK)    │
┌────────▼────────────────────┐     │  - validatedAt         │
│  PATIENTS                   │     │  - reviewedBy (FK)     │
│  - id (UUID, PK)            │     │  - reviewedAt          │
│  - firstName                │     │  - interpretation      │
│  - lastName                 │     │                        │
│  - birthDate                │     │  - prescriptionId (FK) │
│  - sex                      │     │  - createdAt           │
│  - phone                    │     │  - updatedAt           │
│  - address                  │     └────────────────────────┘
│  - emergencyContact         │
│  - insurance                │
│  - idNumber                 │
│  - consentMedicalData       │
│  - consentContact           │
│  - medicalHistory (JSON)    │
│  - createdAt                │
│  - updatedAt                │
└─────────────────────────────┘
```

**Relationships**:
- User (1) → (N) Appointments (as doctor)
- User (1) → (N) Prescriptions (as doctor)
- User (1) → (N) Prescriptions (as nurse) ← NEW
- Patient (1) → (N) Appointments
- Patient (1) → (N) Prescriptions
- Appointment (N) → (1) User (doctor)
- Appointment (N) → (1) Patient
- Prescription (N) → (1) User (doctor)
- Prescription (N) → (1) User (nurse, optional) ← NEW
- Prescription (N) → (1) Patient
- Prescription (1) → (1) Result (one-to-one)

---

## Migration Strategy

### Migration Order

Migrations must be executed in this exact order to maintain data integrity:

1. ✅ Add NURSE to Role enum
2. ✅ Add new AppointmentStatus values
3. ✅ Add new PrescriptionStatus values
4. ✅ Create BillingStatus enum
5. ✅ Add new fields to Appointment model
6. ✅ Add new fields to Prescription model
7. ✅ Add new fields to Result model

### Migration 001: Add NURSE Role

**Description**: Add NURSE value to Role enum

**Prisma Migration**:
```prisma
// prisma/migrations/001_add_nurse_role/migration.sql
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'NURSE';
```

**Impact**:
- Existing users unaffected
- New NURSE users can be created

**Rollback**: Cannot remove enum value in PostgreSQL (requires recreating enum)

---

### Migration 002: Extend AppointmentStatus Enum

**Description**: Add CHECKED_IN, IN_CONSULTATION, CONSULTATION_COMPLETED statuses

**Prisma Migration**:
```prisma
// prisma/migrations/002_extend_appointment_status/migration.sql
-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "AppointmentStatus" ADD VALUE 'IN_CONSULTATION';
ALTER TYPE "AppointmentStatus" ADD VALUE 'CONSULTATION_COMPLETED';
```

**Impact**:
- Existing appointments remain SCHEDULED, COMPLETED, or CANCELLED
- New workflow states available

**Rollback**: Cannot remove enum values

---

### Migration 003: Extend PrescriptionStatus Enum

**Description**: Add SAMPLE_COLLECTED, RESULTS_AVAILABLE statuses

**Prisma Migration**:
```prisma
// prisma/migrations/003_extend_prescription_status/migration.sql
-- AlterEnum
ALTER TYPE "PrescriptionStatus" ADD VALUE 'SAMPLE_COLLECTED';
ALTER TYPE "PrescriptionStatus" ADD VALUE 'RESULTS_AVAILABLE';
```

**Impact**:
- Existing prescriptions remain in current statuses
- New workflow states available

**Rollback**: Cannot remove enum values

---

### Migration 004: Create BillingStatus Enum

**Description**: Create new BillingStatus enum

**Prisma Migration**:
```sql
-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID');
```

**Impact**:
- No impact on existing data
- Required before adding billingStatus field to Appointment

**Rollback**:
```sql
DROP TYPE "BillingStatus";
```

---

### Migration 005: Extend Appointment Model

**Description**: Add all new fields to Appointment model

**Prisma Migration**:
```sql
-- AlterTable
ALTER TABLE "appointments"
  ADD COLUMN "vitals" JSONB,
  ADD COLUMN "medicalHistoryNotes" TEXT,
  ADD COLUMN "consultationNotes" TEXT,
  ADD COLUMN "checkedInAt" TIMESTAMP,
  ADD COLUMN "vitalsEnteredAt" TIMESTAMP,
  ADD COLUMN "consultedAt" TIMESTAMP,
  ADD COLUMN "closedAt" TIMESTAMP,
  ADD COLUMN "vitalsEnteredBy" TEXT,
  ADD COLUMN "consultedBy" TEXT,
  ADD COLUMN "closedBy" TEXT,
  ADD COLUMN "billingAmount" DECIMAL(10, 2),
  ADD COLUMN "billingStatus" "BillingStatus" DEFAULT 'PENDING';

-- CreateIndex (for status filtering)
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
```

**Impact**:
- All existing appointments gain new nullable fields (all NULL initially)
- billingStatus defaults to PENDING
- No data loss

**Rollback**:
```sql
ALTER TABLE "appointments"
  DROP COLUMN "vitals",
  DROP COLUMN "medicalHistoryNotes",
  DROP COLUMN "consultationNotes",
  DROP COLUMN "checkedInAt",
  DROP COLUMN "vitalsEnteredAt",
  DROP COLUMN "consultedAt",
  DROP COLUMN "closedAt",
  DROP COLUMN "vitalsEnteredBy",
  DROP COLUMN "consultedBy",
  DROP COLUMN "closedBy",
  DROP COLUMN "billingAmount",
  DROP COLUMN "billingStatus";

DROP INDEX "appointments_status_idx";
```

---

### Migration 006: Extend Prescription Model

**Description**: Add nurse relation and lab workflow timestamps

**Prisma Migration**:
```sql
-- AlterTable
ALTER TABLE "prescriptions"
  ADD COLUMN "nurseId" TEXT,
  ADD COLUMN "sampleCollectedAt" TIMESTAMP,
  ADD COLUMN "analysisStartedAt" TIMESTAMP,
  ADD COLUMN "analysisCompletedAt" TIMESTAMP;

-- AddForeignKey
ALTER TABLE "prescriptions"
  ADD CONSTRAINT "prescriptions_nurseId_fkey"
  FOREIGN KEY ("nurseId") REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
```

**Impact**:
- All existing prescriptions gain new nullable fields
- nurseId can reference NURSE users
- No data loss

**Rollback**:
```sql
ALTER TABLE "prescriptions"
  DROP CONSTRAINT "prescriptions_nurseId_fkey",
  DROP COLUMN "nurseId",
  DROP COLUMN "sampleCollectedAt",
  DROP COLUMN "analysisStartedAt",
  DROP COLUMN "analysisCompletedAt";
```

---

### Migration 007: Extend Result Model

**Description**: Add validation and review fields

**Prisma Migration**:
```sql
-- AlterTable
ALTER TABLE "results"
  ADD COLUMN "validatedBy" TEXT,
  ADD COLUMN "validatedAt" TIMESTAMP,
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP,
  ADD COLUMN "interpretation" TEXT;
```

**Impact**:
- All existing results gain new nullable fields
- Existing results are considered "validated" but not "reviewed"
- No data loss

**Rollback**:
```sql
ALTER TABLE "results"
  DROP COLUMN "validatedBy",
  DROP COLUMN "validatedAt",
  DROP COLUMN "reviewedBy",
  DROP COLUMN "reviewedAt",
  DROP COLUMN "interpretation";
```

---

## Data Types & Constraints

### Vitals JSON Structure

**Type**: `JSONB` (Binary JSON, faster queries)

**Structure**:
```typescript
interface VitalsData {
  weight: number;           // kg, > 0
  height: number;           // cm, > 0
  temperature: number;      // °C, 30-45
  bloodPressure: {
    systolic: number;       // mmHg, 50-250
    diastolic: number;      // mmHg, 30-150
  };
  heartRate: number;        // bpm, 30-220
  respiratoryRate?: number; // breaths/min, 5-60
  oxygenSaturation?: number;// %, 70-100
}
```

**Validation**: DTO layer validates structure and ranges

**Example**:
```json
{
  "weight": 75.5,
  "height": 175,
  "temperature": 37.2,
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "heartRate": 72,
  "respiratoryRate": 16,
  "oxygenSaturation": 98
}
```

### Text Fields

| Field | Type | Max Length | Nullable |
|-------|------|------------|----------|
| medicalHistoryNotes | TEXT | 10,000 chars | Yes |
| consultationNotes | TEXT | 10,000 chars | Yes |
| Result.text | TEXT | 50,000 chars | No |
| Result.interpretation | TEXT | 10,000 chars | Yes |

### Numeric Fields

| Field | Type | Precision | Range |
|-------|------|-----------|-------|
| billingAmount | DECIMAL | (10, 2) | 0 - 99,999,999.99 |

### Foreign Keys

| Table | Column | References | On Delete | On Update |
|-------|--------|------------|-----------|-----------|
| appointments | doctorId | users(id) | CASCADE | CASCADE |
| appointments | patientId | patients(id) | CASCADE | CASCADE |
| prescriptions | doctorId | users(id) | CASCADE | CASCADE |
| prescriptions | patientId | patients(id) | CASCADE | CASCADE |
| prescriptions | nurseId | users(id) | SET NULL | CASCADE |
| results | prescriptionId | prescriptions(id) | CASCADE | CASCADE |

**Cascade Behavior**:
- Deleting patient → deletes all appointments, prescriptions, results
- Deleting doctor → deletes all appointments, prescriptions
- Deleting nurse → sets nurseId to NULL (keeps prescription)

---

## Indexing Strategy

### Existing Indexes

```sql
-- Primary keys (automatic)
CREATE UNIQUE INDEX users_pkey ON users(id);
CREATE UNIQUE INDEX patients_pkey ON patients(id);
CREATE UNIQUE INDEX appointments_pkey ON appointments(id);
CREATE UNIQUE INDEX prescriptions_pkey ON prescriptions(id);
CREATE UNIQUE INDEX results_pkey ON results(id);

-- Unique constraints
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX results_prescriptionId_key ON results(prescriptionId);

-- Foreign key indexes (for JOIN performance)
CREATE INDEX appointments_patientId_idx ON appointments(patientId);
CREATE INDEX appointments_doctorId_idx ON appointments(doctorId);
CREATE INDEX appointments_date_idx ON appointments(date);

CREATE INDEX prescriptions_patientId_idx ON prescriptions(patientId);
CREATE INDEX prescriptions_doctorId_idx ON prescriptions(doctorId);
CREATE INDEX prescriptions_status_idx ON prescriptions(status);
```

### New Indexes

```sql
-- Appointment status filtering (for role-based dashboards)
CREATE INDEX appointments_status_idx ON appointments(status);

-- Composite index for dashboard queries (date + status)
CREATE INDEX appointments_date_status_idx ON appointments(date, status);

-- Nurse prescriptions
CREATE INDEX prescriptions_nurseId_idx ON prescriptions(nurseId);

-- Prescription status + patient (for dashboard queries)
CREATE INDEX prescriptions_patient_status_idx ON prescriptions(patientId, status);
```

**Rationale**:
- `appointments_status_idx`: Dashboard queries filter by status (e.g., CHECKED_IN for nurse)
- `appointments_date_status_idx`: Composite index for "today's checked-in appointments"
- `prescriptions_patient_status_idx`: Optimize patient prescription history with status filter

---

## Data Integrity Rules

### Appointment Workflow Rules

1. **Check-In**:
   - Can only check in appointments with status SCHEDULED
   - checkedInAt must be set when status = CHECKED_IN

2. **Vitals Entry**:
   - Can only enter vitals when status = CHECKED_IN
   - vitals field must be valid JSON structure
   - vitalsEnteredBy and vitalsEnteredAt must be set together

3. **Consultation**:
   - Can only consult when status = IN_CONSULTATION
   - consultationNotes required for CONSULTATION_COMPLETED
   - consultedBy and consultedAt must be set

4. **Closure**:
   - Can only close when status = CONSULTATION_COMPLETED
   - billingAmount and billingStatus required
   - closedBy and closedAt must be set

### Prescription Workflow Rules

1. **Send to Lab**:
   - Can only send when status = CREATED

2. **Sample Collection**:
   - Can only collect when status = SENT_TO_LAB
   - nurseId and sampleCollectedAt must be set together

3. **Start Analysis**:
   - Can only start when status = SAMPLE_COLLECTED
   - analysisStartedAt must be set

4. **Create Result**:
   - Can only create result when status = IN_PROGRESS
   - One result per prescription (enforced by unique constraint)
   - Sets validatedBy and validatedAt

5. **Review Result**:
   - Can only review when status = RESULTS_AVAILABLE
   - Sets reviewedBy, reviewedAt, and interpretation

### Enforcement

**Application Layer** (NestJS Services):
- State transition validation
- Required field validation
- Business rule enforcement

**Database Layer** (Constraints):
- Foreign key constraints
- Unique constraints
- NOT NULL constraints (for required fields)

---

## Seed Data Updates

### New Seed Data Required

**NURSE User**:
```typescript
await prisma.user.create({
  data: {
    name: 'Infirmier Test',
    email: 'nurse@hospital.com',
    password: await bcrypt.hash('nurse123', 10),
    role: 'NURSE',
  },
});
```

**Sample Appointments with Workflow States**:
```typescript
// Appointment ready for check-in
await prisma.appointment.create({
  data: {
    date: new Date('2026-01-05T14:00:00Z'),
    motif: 'Consultation de suivi',
    status: 'SCHEDULED',
    patientId: patient1.id,
    doctorId: doctor.id,
  },
});

// Appointment checked in, ready for vitals
await prisma.appointment.create({
  data: {
    date: new Date('2026-01-05T15:00:00Z'),
    motif: 'Première consultation',
    status: 'CHECKED_IN',
    checkedInAt: new Date('2026-01-05T14:45:00Z'),
    patientId: patient2.id,
    doctorId: doctor.id,
  },
});

// Appointment ready for consultation
await prisma.appointment.create({
  data: {
    date: new Date('2026-01-05T16:00:00Z'),
    motif: 'Consultation annuelle',
    status: 'IN_CONSULTATION',
    checkedInAt: new Date('2026-01-05T15:45:00Z'),
    vitalsEnteredAt: new Date('2026-01-05T15:50:00Z'),
    vitalsEnteredBy: nurse.id,
    vitals: {
      weight: 70,
      height: 170,
      temperature: 37.0,
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
    },
    patientId: patient3.id,
    doctorId: doctor.id,
  },
});
```

**Sample Prescriptions with Lab Workflow**:
```typescript
// Prescription sent to lab
await prisma.prescription.create({
  data: {
    text: 'Complete Blood Count (CBC)',
    status: 'SENT_TO_LAB',
    patientId: patient1.id,
    doctorId: doctor.id,
  },
});

// Prescription with sample collected
await prisma.prescription.create({
  data: {
    text: 'Lipid Panel',
    status: 'SAMPLE_COLLECTED',
    sampleCollectedAt: new Date('2026-01-05T10:30:00Z'),
    nurseId: nurse.id,
    patientId: patient2.id,
    doctorId: doctor.id,
  },
});
```

---

## Query Optimization Examples

### Dashboard Queries

**SECRETARY: Appointments to Check In**:
```typescript
const toCheckIn = await prisma.appointment.findMany({
  where: {
    status: 'SCHEDULED',
    date: {
      gte: startOfDay(new Date()),
      lte: endOfDay(new Date()),
    },
  },
  include: {
    patient: { select: { firstName: true, lastName: true } },
    doctor: { select: { name: true } },
  },
  orderBy: { date: 'asc' },
  take: 50,
});
```

**NURSE: Patients to Prepare**:
```typescript
const toPrepare = await prisma.appointment.findMany({
  where: {
    status: 'CHECKED_IN',
  },
  include: {
    patient: { select: { firstName: true, lastName: true } },
    doctor: { select: { name: true } },
  },
  orderBy: { checkedInAt: 'asc' },
  take: 50,
});
```

**DOCTOR: Consultations Ready**:
```typescript
const ready = await prisma.appointment.findMany({
  where: {
    status: 'IN_CONSULTATION',
    doctorId: currentDoctorId,
  },
  include: {
    patient: true,
  },
  orderBy: { vitalsEnteredAt: 'asc' },
  take: 50,
});
```

**BIOLOGIST: Samples Received**:
```typescript
const received = await prisma.prescription.findMany({
  where: {
    status: 'SAMPLE_COLLECTED',
  },
  include: {
    patient: { select: { firstName: true, lastName: true } },
    doctor: { select: { name: true } },
    nurse: { select: { name: true } },
  },
  orderBy: { sampleCollectedAt: 'asc' },
  take: 50,
});
```

**Performance**: All queries use indexes and complete in < 100ms with 1000 records.

---

## Backup & Recovery Strategy

### Backup Schedule

**Development**:
- No automated backups (reset with seed data)

**Production**:
- Daily full backup at 2:00 AM
- Hourly incremental backups
- 30-day retention

### Backup Commands

```bash
# Full backup
pg_dump -U hospital_user -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump hospital_mvp

# Restore
pg_restore -U hospital_user -d hospital_mvp -v backup_20260105_020000.dump
```

### Recovery Scenarios

**Scenario 1: Corrupt Migration**
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate dev
```

**Scenario 2: Data Corruption**
```bash
# Restore from backup
pg_restore -U hospital_user -d hospital_mvp -c backup.dump
npx prisma generate
```

**Scenario 3: Full Database Loss**
```bash
# Recreate from scratch
npx prisma migrate reset
npx prisma db seed
```

---

## Database Configuration

### Connection String

```env
# Development
DATABASE_URL="postgresql://hospital_user:hospital_password@localhost:5432/hospital_mvp?schema=public"

# Production
DATABASE_URL="postgresql://hospital_user:secure_password@db_server:5432/hospital_prod?schema=public&sslmode=require"
```

### Connection Pool Settings

```typescript
// Prisma Client Configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool (in main.ts)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

**Pool Size**:
- Development: 10 connections
- Production: 50 connections (adjust based on load)

---

## Migration Execution Plan

### Pre-Migration Checklist

- [ ] Backup current database
- [ ] Test migrations on development database
- [ ] Verify all existing data remains intact
- [ ] Test rollback procedures
- [ ] Document any data transformations needed
- [ ] Schedule maintenance window (if production)

### Execution Steps

```bash
# 1. Generate Prisma Client with new schema
npx prisma generate

# 2. Create migrations
npx prisma migrate dev --name add_nurse_role
npx prisma migrate dev --name extend_appointment_status
npx prisma migrate dev --name extend_prescription_status
npx prisma migrate dev --name create_billing_status
npx prisma migrate dev --name extend_appointment_model
npx prisma migrate dev --name extend_prescription_model
npx prisma migrate dev --name extend_result_model

# 3. Verify migrations
npx prisma migrate status

# 4. Open Prisma Studio to verify data
npx prisma studio

# 5. Run seed script with new data
npx prisma db seed
```

### Post-Migration Verification

```sql
-- Verify NURSE role exists
SELECT * FROM "users" WHERE role = 'NURSE';

-- Verify new appointment statuses
SELECT DISTINCT status FROM "appointments";

-- Verify new prescription statuses
SELECT DISTINCT status FROM "prescriptions";

-- Verify new fields are nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN ('vitals', 'medicalHistoryNotes', 'consultationNotes');

-- Count existing vs new data
SELECT
  COUNT(*) FILTER (WHERE vitals IS NOT NULL) as with_vitals,
  COUNT(*) FILTER (WHERE vitals IS NULL) as without_vitals
FROM "appointments";
```

---

## Performance Benchmarks

### Target Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| GET /appointments (filtered) | < 100ms | With 1000 records |
| PATCH /appointments/:id/check-in | < 50ms | Simple update |
| PATCH /appointments/:id/vitals | < 100ms | JSON write |
| Dashboard query | < 150ms | With includes |
| POST /results | < 100ms | With status update |

### Query Execution Plans

```sql
-- Explain dashboard query
EXPLAIN ANALYZE
SELECT * FROM "appointments"
WHERE status = 'CHECKED_IN'
  AND date >= '2026-01-05'
  AND date <= '2026-01-06'
ORDER BY "checkedInAt" ASC
LIMIT 50;

-- Expected: Index Scan using appointments_status_idx (cost < 10)
```

---

## Schema Validation

### Prisma Validation Commands

```bash
# Validate schema syntax
npx prisma validate

# Format schema file
npx prisma format

# Check for drift between schema and database
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma
```

### TypeScript Type Generation

```bash
# Generate Prisma Client types
npx prisma generate

# Generated types location
# node_modules/.prisma/client/index.d.ts
```

**Generated Types Example**:
```typescript
import { Prisma } from '@prisma/client';

// Full appointment with all new fields
type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: { patient: true; doctor: true };
}>;

// Vitals type (inferred from JSON)
type VitalsData = Prisma.JsonValue;
```

---

## References

- Architecture Design: `/docs/2026_01_04/architecture/architecture.md`
- API Specification: `/docs/2026_01_04/architecture/api-spec.md`
- Requirements: `/docs/2026_01_04/specs/requirements.md`
- Prisma Documentation: https://www.prisma.io/docs
- PostgreSQL JSON: https://www.postgresql.org/docs/current/datatype-json.html

---

**Document Status**: COMPLETE
**Next Steps**: Execute migrations and update seed script
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
