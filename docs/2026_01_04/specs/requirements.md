# Requirements Specification - Complete Clinical Workflow Implementation

**Project**: Hospital Management System - Complete Clinical Workflow
**Date**: 2026-01-04
**Version**: 1.0
**Quality Threshold**: 75% (MVP Standard)

---

## Executive Summary

This document specifies the requirements to implement a complete clinical patient workflow based on the official specification. The system currently implements a partial workflow (Appointment → Consultation → Prescription) and needs to be extended to support the full 11-step clinical process with proper role-based access, workflow state management, and clear dashboard navigation.

**Current State**: 4 roles (ADMIN, DOCTOR, BIOLOGIST, SECRETARY), partial workflow
**Target State**: 5 roles (add NURSE), complete 11-step workflow with state transitions

---

## Stakeholders

### Primary Users

#### 1. Patient (External)
- **Needs**: Request appointments, receive care
- **Interaction**: Through secretary (no direct system access)

#### 2. Secretary (SECRETARY Role)
- **Needs**:
  - Patient registration and administrative data entry
  - Appointment scheduling and management
  - Patient check-in on appointment day
  - Administrative closure and billing
- **Current Capabilities**: Patient CRUD, Appointment CRUD
- **Missing Capabilities**: Check-in workflow, billing/closure

#### 3. Nurse (NURSE Role) - MISSING
- **Needs**:
  - Pre-consultation data entry (vitals, medical history)
  - Biological sample collection
- **Current Status**: Role does not exist in system
- **Required Implementation**: New role, new workflows

#### 4. Doctor (DOCTOR Role)
- **Needs**:
  - Conduct medical consultations
  - Access pre-consultation data from nurse
  - Create prescriptions
  - Review and interpret lab results
  - Make medical decisions based on complete patient data
- **Current Capabilities**: View appointments, create prescriptions
- **Missing Capabilities**: Access to vitals/history, result interpretation workflow

#### 5. Biologist (BIOLOGIST Role)
- **Needs**:
  - Receive lab test prescriptions
  - Analyze samples and enter results
  - Validate results before sending to doctor
- **Current Capabilities**: View prescriptions, create results
- **Missing Capabilities**: Sample tracking, validation workflow

### Secondary Users

#### 6. Administrator (ADMIN Role)
- **Needs**: User management, system oversight, reporting
- **Current Capabilities**: User CRUD, full system access
- **Status**: Complete (no changes needed)

---

## Functional Requirements

### FR-001: NURSE Role Implementation
**Priority**: HIGH
**Description**: Add NURSE role to the system with appropriate permissions

**Acceptance Criteria**:
- [ ] NURSE enum value added to Role enumeration in Prisma schema
- [ ] Seed script includes at least one NURSE user account (nurse@hospital.com / nurse123)
- [ ] Authentication system recognizes NURSE role
- [ ] Role guards allow NURSE access to vitals and sample collection endpoints
- [ ] Dashboard displays NURSE-specific view

**Database Changes**:
```prisma
enum Role {
  ADMIN
  DOCTOR
  BIOLOGIST
  SECRETARY
  NURSE  // NEW
}
```

**Migration Required**: Yes

---

### FR-002: Appointment Check-In Workflow
**Priority**: HIGH
**Description**: Allow secretary to check in patients when they arrive for appointments

**Acceptance Criteria**:
- [ ] Appointment model includes `checkedInAt` field (DateTime, nullable)
- [ ] AppointmentStatus enum includes CHECKED_IN state
- [ ] PATCH /api/appointments/:id/check-in endpoint created (SECRETARY only)
- [ ] UI displays check-in button on appointment list (SECRETARY dashboard)
- [ ] Checked-in appointments are visually distinguished in UI
- [ ] Only SCHEDULED appointments can be checked in
- [ ] Check-in timestamp is recorded

**Database Changes**:
```prisma
model Appointment {
  // ... existing fields
  checkedInAt DateTime?
}

enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN    // NEW
  COMPLETED
  CANCELLED
}
```

**API Endpoint**:
```
PATCH /api/appointments/:id/check-in
Permissions: SECRETARY
Body: {} (empty)
Response: { data: { id, status: 'CHECKED_IN', checkedInAt } }
```

**Migration Required**: Yes

---

### FR-003: Pre-Consultation Data Entry (Vitals & Medical History)
**Priority**: HIGH
**Description**: Nurse enters patient vitals and medical history before doctor consultation

**Acceptance Criteria**:
- [ ] Appointment model includes comprehensive vitals structure in JSON field
- [ ] Appointment model includes medicalHistoryNotes field
- [ ] PATCH /api/appointments/:id/vitals endpoint created (NURSE only)
- [ ] Vitals include: weight, height, temperature, blood pressure, heart rate, respiratory rate, oxygen saturation
- [ ] Medical history notes can include: allergies, chronic conditions, current medications, family history
- [ ] Only CHECKED_IN appointments can receive vitals
- [ ] Status changes to IN_CONSULTATION after vitals entry
- [ ] UI form for vitals entry on NURSE dashboard
- [ ] Validation ensures all required vitals are entered

**Database Changes**:
```prisma
model Appointment {
  // ... existing fields
  vitals Json?  // ENHANCED structure
  medicalHistoryNotes String? @db.Text
  vitalsEnteredBy String?  // userId of nurse
  vitalsEnteredAt DateTime?
}

enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  IN_CONSULTATION    // NEW
  COMPLETED
  CANCELLED
}
```

**Vitals JSON Structure**:
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

**API Endpoint**:
```
PATCH /api/appointments/:id/vitals
Permissions: NURSE
Body: { vitals: {...}, medicalHistoryNotes: "..." }
```

**Migration Required**: Yes (add fields)

---

### FR-004: Enhanced Consultation Workflow
**Priority**: HIGH
**Description**: Doctor conducts consultation with access to pre-consultation data

**Acceptance Criteria**:
- [ ] Doctor can view vitals and medical history notes entered by nurse
- [ ] Appointment detail view displays complete pre-consultation data
- [ ] Appointment model includes consultationNotes field
- [ ] PATCH /api/appointments/:id/consultation endpoint created (DOCTOR only)
- [ ] Only IN_CONSULTATION appointments can be updated
- [ ] Status changes to CONSULTATION_COMPLETED after notes entry
- [ ] UI displays read-only vitals and editable consultation notes
- [ ] Doctor can create prescription from consultation view

**Database Changes**:
```prisma
model Appointment {
  // ... existing fields
  consultationNotes String? @db.Text
  consultedBy String?  // doctorId
  consultedAt DateTime?
}

enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  IN_CONSULTATION
  CONSULTATION_COMPLETED    // NEW
  COMPLETED
  CANCELLED
}
```

**API Endpoint**:
```
PATCH /api/appointments/:id/consultation
Permissions: DOCTOR
Body: { consultationNotes: "..." }
```

**Migration Required**: Yes

---

### FR-005: Enhanced Prescription Status Workflow
**Priority**: HIGH
**Description**: Extend prescription workflow to support complete lab workflow

**Acceptance Criteria**:
- [ ] PrescriptionStatus includes new states for complete workflow
- [ ] Prescription model includes nurseId for sample collection tracking
- [ ] Prescription model includes sampleCollectedAt timestamp
- [ ] PATCH /api/prescriptions/:id/send-to-lab endpoint (DOCTOR or SECRETARY)
- [ ] PATCH /api/prescriptions/:id/collect-sample endpoint (NURSE)
- [ ] PATCH /api/prescriptions/:id/start-analysis endpoint (BIOLOGIST)
- [ ] Status transitions are enforced by backend validation
- [ ] UI displays current status with visual indicators
- [ ] Each role sees only relevant prescriptions in their workflow

**Database Changes**:
```prisma
model Prescription {
  // ... existing fields
  nurseId String?
  nurse User? @relation("NursePrescriptions", fields: [nurseId], references: [id])
  sampleCollectedAt DateTime?
  analysisStartedAt DateTime?
  analysisCompletedAt DateTime?
}

enum PrescriptionStatus {
  CREATED              // Doctor created
  SENT_TO_LAB          // Sent for lab work
  SAMPLE_COLLECTED     // NEW - Nurse collected sample
  IN_PROGRESS          // Biologist analyzing
  RESULTS_AVAILABLE    // NEW - Results entered but not reviewed
  COMPLETED            // Doctor reviewed results
}
```

**Status Transitions**:
```
CREATED → SENT_TO_LAB (DOCTOR/SECRETARY)
SENT_TO_LAB → SAMPLE_COLLECTED (NURSE)
SAMPLE_COLLECTED → IN_PROGRESS (BIOLOGIST)
IN_PROGRESS → RESULTS_AVAILABLE (BIOLOGIST creates Result)
RESULTS_AVAILABLE → COMPLETED (DOCTOR reviews)
```

**Migration Required**: Yes

---

### FR-006: Sample Collection Workflow
**Priority**: MEDIUM
**Description**: Nurse collects biological samples for lab analysis

**Acceptance Criteria**:
- [ ] NURSE can view prescriptions with status SENT_TO_LAB
- [ ] PATCH /api/prescriptions/:id/collect-sample endpoint created
- [ ] Sample collection updates status to SAMPLE_COLLECTED
- [ ] Timestamp and nurse ID are recorded
- [ ] UI shows sample collection interface on NURSE dashboard
- [ ] Collected samples appear in BIOLOGIST queue
- [ ] Collection notes can be added (optional)

**API Endpoint**:
```
PATCH /api/prescriptions/:id/collect-sample
Permissions: NURSE
Body: { notes?: "..." }
Response: {
  data: {
    id,
    status: 'SAMPLE_COLLECTED',
    sampleCollectedAt,
    nurseId
  }
}
```

**UI Requirements**:
- NURSE dashboard section: "Samples to Collect"
- List shows patient name, prescription details, doctor name
- One-click "Collect Sample" button
- Optional notes field for special instructions

---

### FR-007: Lab Result Validation & Review Workflow
**Priority**: HIGH
**Description**: Separate result entry (BIOLOGIST) from result review (DOCTOR)

**Acceptance Criteria**:
- [ ] Result model includes validatedBy and validatedAt fields
- [ ] Result model includes reviewedBy and reviewedAt fields
- [ ] Creating a result sets status to RESULTS_AVAILABLE (not COMPLETED)
- [ ] DOCTOR must explicitly review results to mark COMPLETED
- [ ] PATCH /api/results/:id/review endpoint created (DOCTOR only)
- [ ] Result review includes interpretation notes field
- [ ] UI shows "Pending Review" indicator on DOCTOR dashboard
- [ ] Reviewed results show doctor interpretation

**Database Changes**:
```prisma
model Result {
  id        String   @id @default(uuid())
  data      Json?
  text      String   @db.Text

  // NEW fields
  validatedBy String?  // biologistId
  validatedAt DateTime?
  reviewedBy String?   // doctorId
  reviewedAt DateTime?
  interpretation String? @db.Text  // Doctor's medical interpretation

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  prescriptionId String       @unique
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)

  @@map("results")
}
```

**API Endpoints**:
```
POST /api/results
Permissions: BIOLOGIST
Effect: Creates result, sets prescription status to RESULTS_AVAILABLE

PATCH /api/results/:id/review
Permissions: DOCTOR
Body: { interpretation: "..." }
Effect: Sets reviewedBy, reviewedAt, changes prescription to COMPLETED
```

**Migration Required**: Yes

---

### FR-008: Administrative Closure & Billing
**Priority**: MEDIUM
**Description**: Secretary closes appointment and processes billing

**Acceptance Criteria**:
- [ ] Appointment model includes closedBy and closedAt fields
- [ ] Appointment model includes billing information (amount, paid status)
- [ ] PATCH /api/appointments/:id/close endpoint created (SECRETARY only)
- [ ] Only CONSULTATION_COMPLETED or COMPLETED appointments can be closed
- [ ] Closing sets final status to COMPLETED
- [ ] Billing amount can be entered
- [ ] Payment status tracked (PENDING, PAID, PARTIALLY_PAID)
- [ ] UI shows billing form on SECRETARY dashboard

**Database Changes**:
```prisma
model Appointment {
  // ... existing fields
  closedBy String?
  closedAt DateTime?
  billingAmount Decimal? @db.Decimal(10, 2)
  billingStatus BillingStatus @default(PENDING)
}

enum BillingStatus {
  PENDING
  PAID
  PARTIALLY_PAID
}

enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  IN_CONSULTATION
  CONSULTATION_COMPLETED
  COMPLETED    // FINAL STATE (after closure)
  CANCELLED
}
```

**API Endpoint**:
```
PATCH /api/appointments/:id/close
Permissions: SECRETARY
Body: { billingAmount: 150.00, billingStatus: "PAID" }
```

**Migration Required**: Yes

---

### FR-009: Dashboard Navigation & Role-Based UI
**Priority**: HIGH
**Description**: Clear dashboard sections for each role showing workflow steps

**Acceptance Criteria**:
- [ ] Each role has distinct dashboard sections matching their workflow
- [ ] No hidden functionality - all workflow steps clearly visible
- [ ] Navigation cards show counts and pending actions
- [ ] Color coding indicates urgency/status
- [ ] Breadcrumbs show user's position in workflow
- [ ] Quick action buttons for common tasks
- [ ] Empty states guide users on next actions

**Role-Specific Sections**:

**SECRETARY Dashboard**:
1. "Appointments Today" - Check-in pending patients
2. "Schedule New Appointment" - Quick access
3. "Patient Registration" - Create new patients
4. "Appointments to Close" - Billing and closure
5. "Search Patients" - Quick lookup

**NURSE Dashboard**:
1. "Patients to Prepare" - Checked-in, waiting for vitals
2. "Samples to Collect" - Prescriptions sent to lab
3. "Today's Schedule" - Overview of appointments
4. "Quick Vitals Entry" - Fast form access

**DOCTOR Dashboard**:
1. "Consultations Ready" - Patients with vitals entered
2. "Results to Review" - Lab results pending interpretation
3. "My Appointments" - Day schedule
4. "Prescriptions Sent" - Tracking lab work
5. "Patient Search" - Quick access to records

**BIOLOGIST Dashboard**:
1. "Samples Received" - Collected samples awaiting analysis
2. "In Progress" - Currently analyzing
3. "Completed Today" - Daily summary
4. "Result Entry" - Quick form access

**UI Requirements**: See dashboard-navigation.md for detailed wireframes

---

### FR-010: Workflow State Validation
**Priority**: HIGH
**Description**: Backend enforces valid state transitions to prevent workflow errors

**Acceptance Criteria**:
- [ ] All state transitions validated in backend services
- [ ] Invalid transitions return 400 with descriptive error message
- [ ] Guards check role permissions for each transition
- [ ] Audit trail records who performed each transition
- [ ] UI disables invalid actions based on current state
- [ ] Error messages guide user on correct workflow

**Validation Rules**:
```
Appointment States:
SCHEDULED → CHECKED_IN (SECRETARY)
CHECKED_IN → IN_CONSULTATION (NURSE enters vitals)
IN_CONSULTATION → CONSULTATION_COMPLETED (DOCTOR enters notes)
CONSULTATION_COMPLETED → COMPLETED (SECRETARY closes)

Prescription States:
CREATED → SENT_TO_LAB (DOCTOR/SECRETARY)
SENT_TO_LAB → SAMPLE_COLLECTED (NURSE)
SAMPLE_COLLECTED → IN_PROGRESS (BIOLOGIST)
IN_PROGRESS → RESULTS_AVAILABLE (BIOLOGIST creates Result)
RESULTS_AVAILABLE → COMPLETED (DOCTOR reviews)
```

**Implementation**: Service layer methods for state transitions with validation

---

## Non-Functional Requirements

### NFR-001: Performance
**Description**: System must remain responsive during workflow operations

**Metrics**:
- Page load time < 2 seconds (desktop, local network)
- API response time < 500ms for 95th percentile
- Dashboard refresh < 1 second
- Form submission feedback < 200ms

**Implementation**:
- Database indexes on status and date fields
- Pagination for large lists (50 items per page)
- Optimistic UI updates where appropriate

---

### NFR-002: Usability
**Description**: Clear, intuitive interface for medical staff

**Requirements**:
- French language throughout UI
- Medical terminology used correctly
- Visual status indicators (colors, icons)
- Minimal clicks to complete common tasks (≤3 clicks)
- Form validation with helpful error messages
- Confirmation dialogs for critical actions

**Implementation**:
- Material-UI components with consistent styling
- Color scheme: Blue (doctor), Orange (secretary), Green (nurse), Purple (biologist)
- Icons from Material Icons library
- Form validation with Yup or Zod

---

### NFR-003: Data Integrity
**Description**: Ensure accuracy and consistency of medical data

**Requirements**:
- Cascade deletes configured correctly
- Timestamps recorded for all workflow transitions
- User IDs tracked for accountability
- Database constraints prevent invalid states
- Transactions for multi-step operations

**Implementation**:
- Prisma schema constraints
- Database triggers (if needed)
- Backend validation before saves
- Unit tests for validation logic

---

### NFR-004: Security
**Description**: Role-based access control strictly enforced

**Requirements**:
- Session-based authentication (existing)
- Role guards on all protected endpoints
- Frontend hides unauthorized actions
- Backend validates permissions (defense in depth)
- Audit trail for sensitive operations

**Implementation**:
- AuthGuard + RolesGuard on all routes
- @Roles decorator specifies allowed roles
- Frontend ProtectedRoute checks user role
- Logging of state transitions

---

### NFR-005: Maintainability
**Description**: Code should be maintainable by development team

**Requirements**:
- Clear module separation (one module per domain)
- Consistent naming conventions
- DTOs for all API inputs/outputs
- Comments on complex business logic
- README updates with new workflows

**Implementation**:
- NestJS module structure
- TypeScript strict mode
- API documentation in API.md
- Inline comments for validation rules

---

## Constraints

### Technical Constraints
1. **Database**: PostgreSQL only (existing infrastructure)
2. **ORM**: Prisma v6.x (avoid v7 due to migration issues)
3. **Authentication**: Session-based (no JWT)
4. **UI Framework**: Material-UI (existing design system)
5. **Desktop Only**: No mobile responsive design needed

### Business Constraints
1. **Timeline**: 7-day MVP scope
2. **Quality**: 75% threshold (acceptable for prototype)
3. **Scope**: Hospital workflow only (no telemedicine, billing integrations)
4. **Language**: French UI (medical staff preference)

### Regulatory Constraints
1. **GDPR**: Out of scope for MVP
2. **Medical Compliance**: Out of scope for MVP
3. **Data Encryption**: Basic bcrypt for passwords, no field-level encryption

---

## Assumptions

1. **Single Facility**: System serves one hospital location
2. **Network**: Local network with reliable connectivity
3. **Training**: Staff will receive training on new workflow
4. **Concurrent Users**: ≤50 concurrent users (small hospital)
5. **Sample Types**: All sample collection treated uniformly (no complex lab workflows)
6. **Billing**: Simple flat-rate billing (no insurance integration)

---

## Dependencies

### External Systems
- **None**: Standalone system

### Third-Party Services
- **None**: No external APIs

### Internal Dependencies
- Existing authentication system (AuthModule)
- Existing patient management (PatientModule)
- Existing appointment system (AppointmentModule)

---

## Out of Scope

Explicitly NOT included in this implementation:

1. **Document Management**: File uploads, PDF generation
2. **Notifications**: Email, SMS, push notifications
3. **Real-Time Updates**: WebSocket, live dashboard updates
4. **Advanced Scheduling**: Calendar view, recurring appointments
5. **Reporting**: Analytics, export to Excel/PDF
6. **Telemedicine**: Video consultations
7. **Inventory**: Medical supplies, equipment tracking
8. **Pharmacy Integration**: Medication dispensing
9. **Insurance Processing**: Claim submission
10. **Multi-Language**: English/other languages (French only)

---

## Migration Strategy

### Database Migrations Required

**Migration 1**: Add NURSE role
```sql
ALTER TYPE "Role" ADD VALUE 'NURSE';
```

**Migration 2**: Extend Appointment model
```sql
ALTER TABLE appointments
  ADD COLUMN "checkedInAt" TIMESTAMP,
  ADD COLUMN "medicalHistoryNotes" TEXT,
  ADD COLUMN "vitalsEnteredBy" TEXT,
  ADD COLUMN "vitalsEnteredAt" TIMESTAMP,
  ADD COLUMN "consultationNotes" TEXT,
  ADD COLUMN "consultedBy" TEXT,
  ADD COLUMN "consultedAt" TIMESTAMP,
  ADD COLUMN "closedBy" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP,
  ADD COLUMN "billingAmount" DECIMAL(10, 2),
  ADD COLUMN "billingStatus" "BillingStatus" DEFAULT 'PENDING';
```

**Migration 3**: Extend AppointmentStatus enum
```sql
ALTER TYPE "AppointmentStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "AppointmentStatus" ADD VALUE 'IN_CONSULTATION';
ALTER TYPE "AppointmentStatus" ADD VALUE 'CONSULTATION_COMPLETED';
```

**Migration 4**: Extend Prescription model
```sql
ALTER TABLE prescriptions
  ADD COLUMN "nurseId" TEXT,
  ADD COLUMN "sampleCollectedAt" TIMESTAMP,
  ADD COLUMN "analysisStartedAt" TIMESTAMP,
  ADD COLUMN "analysisCompletedAt" TIMESTAMP;

ALTER TABLE prescriptions
  ADD CONSTRAINT "prescriptions_nurseId_fkey"
  FOREIGN KEY ("nurseId") REFERENCES users(id) ON DELETE SET NULL;
```

**Migration 5**: Extend PrescriptionStatus enum
```sql
ALTER TYPE "PrescriptionStatus" ADD VALUE 'SAMPLE_COLLECTED';
ALTER TYPE "PrescriptionStatus" ADD VALUE 'RESULTS_AVAILABLE';
```

**Migration 6**: Extend Result model
```sql
ALTER TABLE results
  ADD COLUMN "validatedBy" TEXT,
  ADD COLUMN "validatedAt" TIMESTAMP,
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP,
  ADD COLUMN "interpretation" TEXT;
```

**Migration 7**: Create BillingStatus enum
```sql
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID');
```

### Seed Data Updates

Add NURSE user to seed script:
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

---

## Success Criteria

This implementation will be considered successful when:

1. **Workflow Completeness**: All 11 steps of clinical workflow are implemented
2. **Role Coverage**: All 5 roles have functional dashboards
3. **State Management**: Workflow states transition correctly with validation
4. **UI Clarity**: Users can navigate without confusion (usability testing)
5. **Data Integrity**: No orphaned records, consistent state
6. **Performance**: Meets NFR-001 metrics
7. **Demo Ready**: Complete patient journey can be demonstrated end-to-end

**Acceptance Test**:
Complete patient journey from appointment request to billing closure without errors, with each role performing their designated tasks.

---

## Glossary

- **Check-In**: Patient arrival confirmation by secretary
- **Vitals**: Physical measurements (weight, BP, temperature, etc.)
- **Pre-Consultation**: Nurse preparation before doctor sees patient
- **Consultation**: Doctor examination and diagnosis
- **Prescription**: Lab test order (not medication in this context)
- **Sample Collection**: Nurse taking blood or other biological samples
- **Result Validation**: Biologist confirming lab analysis accuracy
- **Result Review**: Doctor interpreting clinical significance of results
- **Closure**: Administrative finalization and billing by secretary

---

## References

- Official PDF Specification (11-step workflow)
- ARCHITECTURE.md (current system architecture)
- API.md (existing API endpoints)
- Prisma Schema (backend/prisma/schema.prisma)
- Dashboard Component (frontend/src/pages/Dashboard/Dashboard.tsx)

---

**Document Status**: DRAFT
**Next Steps**: Review with development team, create user stories, design API endpoints
**Author**: Requirements Analyst
**Last Updated**: 2026-01-04
