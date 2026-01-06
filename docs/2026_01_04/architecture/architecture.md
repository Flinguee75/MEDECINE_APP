# System Architecture Design - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Version**: 1.0
**Architect**: System Architecture Specialist

---

## Executive Summary

This document defines the technical architecture for implementing the complete 11-step clinical workflow based on Phase 1 requirements analysis. The design extends the existing partial workflow (Appointment → Consultation → Prescription) to support the full clinical process with proper state management, role-based access, and clear navigation.

**Key Architectural Decisions**:
- Extend existing modules rather than create separate modules for each workflow step
- Use JSON fields for vitals to maintain flexibility
- Implement state transition validation at service layer
- Keep session-based authentication (no JWT)
- Maintain monorepo structure with desktop-only focus

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DESKTOP APPLICATION                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  FRONTEND (React + TypeScript)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │Secretary │  │  Nurse   │  │  Doctor  │  │Biologist │       │ │
│  │  │Dashboard │  │Dashboard │  │Dashboard │  │Dashboard │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │           AuthContext (Session Management)              │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │    API Client (Axios with withCredentials: true)        │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP + Session Cookie
                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS + TypeScript)                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  AUTHENTICATION LAYER                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │  AuthGuard   │  │  RolesGuard  │  │ CurrentUser  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      BUSINESS LOGIC LAYER                       │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │ AppointmentsModule (EXTENDED)                         │     │ │
│  │  │  - Check-in workflow                                  │     │ │
│  │  │  - Vitals entry                                       │     │ │
│  │  │  - Consultation notes                                 │     │ │
│  │  │  - Administrative closure & billing                   │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │ PrescriptionsModule (EXTENDED)                        │     │ │
│  │  │  - Send to lab                                        │     │ │
│  │  │  - Sample collection                                  │     │ │
│  │  │  - Start analysis                                     │     │ │
│  │  │  - Status transition validation                       │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │ ResultsModule (EXTENDED)                              │     │ │
│  │  │  - Result validation by biologist                     │     │ │
│  │  │  - Result review by doctor                            │     │ │
│  │  │  - Interpretation notes                               │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │ PatientsModule (EXISTING - No Changes)                │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │ UsersModule (EXISTING - No Changes)                   │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                       DATA ACCESS LAYER                         │ │
│  │  ┌───────────────────────────────────────────────────────┐     │ │
│  │  │         PrismaModule (Global Database Access)         │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ SQL Queries
                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                                │
│  ┌────────┐  ┌────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │ Users  │  │Patients│  │Appointments │  │Prescriptions │        │
│  └────────┘  └────────┘  └─────────────┘  └──────────────┘        │
│                              │                    │                  │
│                              └────────┬───────────┘                  │
│                                       │                              │
│                              ┌────────────┐                          │
│                              │  Results   │                          │
│                              └────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
┌─────────────┐
│ AuthModule  │  (Global, provides AuthGuard, RolesGuard)
└─────────────┘
       │
       └──────────────────────────┬──────────────────────────┐
                                  │                          │
                       ┌──────────▼────────┐   ┌────────────▼──────────┐
                       │  PrismaModule     │   │   UsersModule         │
                       │  (Global)         │   │   (User CRUD)         │
                       └──────────┬────────┘   └───────────────────────┘
                                  │
             ┌────────────────────┼────────────────────┬─────────────────┐
             │                    │                    │                 │
    ┌────────▼──────────┐ ┌──────▼────────────┐ ┌────▼─────────────┐  │
    │ PatientsModule    │ │AppointmentsModule │ │PrescriptionsModule│  │
    │ (No changes)      │ │ (EXTENDED)        │ │ (EXTENDED)        │  │
    └───────────────────┘ └──────┬────────────┘ └────┬──────────────┘  │
                                  │                    │                 │
                                  │              ┌─────▼──────────┐     │
                                  │              │ ResultsModule  │     │
                                  │              │ (EXTENDED)     │     │
                                  │              └────────────────┘     │
                                  │                                     │
                                  └─────────────────────────────────────┘
                                  All modules depend on PrismaModule
```

**Key Dependencies**:
- All modules depend on PrismaModule for database access
- AuthModule is global and provides guards to all routes
- AppointmentsModule extends to handle check-in, vitals, consultation, closure
- PrescriptionsModule extends to handle lab workflow transitions
- ResultsModule extends to separate validation from review

---

## Data Flow Diagrams

### Workflow 1: Patient Check-In to Consultation

```
SECRETARY                   NURSE                    DOCTOR
    │                         │                         │
    │ 1. Check-In Patient     │                         │
    ├─────────────────────────┼─────────────────────────┤
    │ PATCH /appointments/:id │                         │
    │    /check-in            │                         │
    │                         │                         │
    │ Status: SCHEDULED       │                         │
    │      ↓                  │                         │
    │ Status: CHECKED_IN      │                         │
    ├─────────────────────────┼─────────────────────────┤
    │                         │                         │
    │                         │ 2. Enter Vitals         │
    │                         ├─────────────────────────┤
    │                         │ PATCH /appointments/:id │
    │                         │    /vitals              │
    │                         │                         │
    │                         │ Status: CHECKED_IN      │
    │                         │      ↓                  │
    │                         │ Status: IN_CONSULTATION │
    ├─────────────────────────┼─────────────────────────┤
    │                         │                         │
    │                         │                         │ 3. Consultation
    │                         │                         ├───────────────
    │                         │                         │ PATCH /appointments/:id
    │                         │                         │    /consultation
    │                         │                         │
    │                         │                         │ Status: IN_CONSULTATION
    │                         │                         │      ↓
    │                         │                         │ Status: CONSULTATION_COMPLETED
    ├─────────────────────────┼─────────────────────────┼───────────────
    │                         │                         │
    │ 4. Close Appointment    │                         │
    ├─────────────────────────┼─────────────────────────┤
    │ PATCH /appointments/:id │                         │
    │    /close               │                         │
    │                         │                         │
    │ Status: CONSULTATION_   │                         │
    │         COMPLETED       │                         │
    │      ↓                  │                         │
    │ Status: COMPLETED       │                         │
    └─────────────────────────┴─────────────────────────┘
```

### Workflow 2: Lab Test Prescription to Result Review

```
DOCTOR                      NURSE                   BIOLOGIST
   │                          │                         │
   │ 1. Create Prescription   │                         │
   ├──────────────────────────┼─────────────────────────┤
   │ POST /prescriptions      │                         │
   │                          │                         │
   │ Status: CREATED          │                         │
   │                          │                         │
   │ 2. Send to Lab           │                         │
   ├──────────────────────────┼─────────────────────────┤
   │ PATCH /prescriptions/:id │                         │
   │    /send-to-lab          │                         │
   │                          │                         │
   │ Status: CREATED          │                         │
   │      ↓                   │                         │
   │ Status: SENT_TO_LAB      │                         │
   ├──────────────────────────┼─────────────────────────┤
   │                          │                         │
   │                          │ 3. Collect Sample       │
   │                          ├─────────────────────────┤
   │                          │ PATCH /prescriptions/:id│
   │                          │    /collect-sample      │
   │                          │                         │
   │                          │ Status: SENT_TO_LAB     │
   │                          │      ↓                  │
   │                          │ Status: SAMPLE_COLLECTED│
   ├──────────────────────────┼─────────────────────────┤
   │                          │                         │
   │                          │                         │ 4. Start Analysis
   │                          │                         ├──────────────
   │                          │                         │ PATCH /prescriptions/:id
   │                          │                         │    /start-analysis
   │                          │                         │
   │                          │                         │ Status: SAMPLE_COLLECTED
   │                          │                         │      ↓
   │                          │                         │ Status: IN_PROGRESS
   │                          │                         │
   │                          │                         │ 5. Enter Results
   │                          │                         ├──────────────
   │                          │                         │ POST /results
   │                          │                         │
   │                          │                         │ Status: IN_PROGRESS
   │                          │                         │      ↓
   │                          │                         │ Status: RESULTS_AVAILABLE
   ├──────────────────────────┼─────────────────────────┼──────────────
   │                          │                         │
   │ 6. Review Results        │                         │
   ├──────────────────────────┼─────────────────────────┤
   │ PATCH /results/:id/review│                         │
   │                          │                         │
   │ Status: RESULTS_AVAILABLE│                         │
   │      ↓                   │                         │
   │ Status: COMPLETED        │                         │
   └──────────────────────────┴─────────────────────────┘
```

---

## State Machine Diagrams

### Appointment Status State Machine

```
                           ┌───────────────┐
                           │   SCHEDULED   │ (Initial State)
                           └───────┬───────┘
                                   │
                                   │ Secretary Check-In
                                   │ PATCH /appointments/:id/check-in
                                   │
                           ┌───────▼───────┐
                           │  CHECKED_IN   │
                           └───────┬───────┘
                                   │
                                   │ Nurse Enters Vitals
                                   │ PATCH /appointments/:id/vitals
                                   │
                           ┌───────▼───────────┐
                           │ IN_CONSULTATION   │
                           └───────┬───────────┘
                                   │
                                   │ Doctor Completes Consultation
                                   │ PATCH /appointments/:id/consultation
                                   │
                     ┌─────────────▼─────────────────┐
                     │ CONSULTATION_COMPLETED        │
                     └─────────────┬─────────────────┘
                                   │
                                   │ Secretary Closes & Bills
                                   │ PATCH /appointments/:id/close
                                   │
                           ┌───────▼───────┐
                           │  COMPLETED    │ (Final State)
                           └───────────────┘

                     ┌─────────────────────────────────┐
                     │      CANCELLED                  │ (Final State)
                     │  (Possible from any non-final)  │
                     └─────────────────────────────────┘
```

**Validation Rules**:
- SCHEDULED → CHECKED_IN (SECRETARY only)
- CHECKED_IN → IN_CONSULTATION (NURSE only, requires vitals)
- IN_CONSULTATION → CONSULTATION_COMPLETED (DOCTOR only, requires notes)
- CONSULTATION_COMPLETED → COMPLETED (SECRETARY only, requires billing)
- Any → CANCELLED (SECRETARY/ADMIN only)

### Prescription Status State Machine

```
                     ┌─────────────┐
                     │   CREATED   │ (Initial State)
                     └──────┬──────┘
                            │
                            │ Doctor/Secretary Sends to Lab
                            │ PATCH /prescriptions/:id/send-to-lab
                            │
                     ┌──────▼──────┐
                     │ SENT_TO_LAB │
                     └──────┬──────┘
                            │
                            │ Nurse Collects Sample
                            │ PATCH /prescriptions/:id/collect-sample
                            │
                   ┌────────▼────────────┐
                   │ SAMPLE_COLLECTED    │
                   └────────┬────────────┘
                            │
                            │ Biologist Starts Analysis
                            │ PATCH /prescriptions/:id/start-analysis
                            │
                     ┌──────▼──────┐
                     │ IN_PROGRESS │
                     └──────┬──────┘
                            │
                            │ Biologist Enters Results
                            │ POST /results
                            │
                 ┌──────────▼───────────────┐
                 │ RESULTS_AVAILABLE        │
                 └──────────┬───────────────┘
                            │
                            │ Doctor Reviews Results
                            │ PATCH /results/:id/review
                            │
                     ┌──────▼──────┐
                     │  COMPLETED  │ (Final State)
                     └─────────────┘
```

**Validation Rules**:
- CREATED → SENT_TO_LAB (DOCTOR or SECRETARY)
- SENT_TO_LAB → SAMPLE_COLLECTED (NURSE only)
- SAMPLE_COLLECTED → IN_PROGRESS (BIOLOGIST only)
- IN_PROGRESS → RESULTS_AVAILABLE (BIOLOGIST creates Result)
- RESULTS_AVAILABLE → COMPLETED (DOCTOR reviews Result)

---

## Component Hierarchy (Frontend)

```
App
├── AuthProvider (Context)
│   ├── Login Page
│   └── ProtectedRoute
│       ├── Dashboard (Role-Based Routing)
│       │   ├── SecretaryDashboard
│       │   │   ├── StatCard (x4)
│       │   │   ├── QuickActionCard (x3)
│       │   │   ├── CheckInSection
│       │   │   │   └── AppointmentTable
│       │   │   └── ClosureSection
│       │   │       └── AppointmentList
│       │   │
│       │   ├── NurseDashboard (NEW)
│       │   │   ├── StatCard (x4)
│       │   │   ├── PatientsToPreparSection
│       │   │   │   ├── AppointmentList
│       │   │   │   └── VitalsDialog (NEW)
│       │   │   └── SamplesToCollectSection
│       │   │       ├── PrescriptionList
│       │   │       └── SampleCollectionDialog (NEW)
│       │   │
│       │   ├── DoctorDashboard
│       │   │   ├── StatCard (x4)
│       │   │   ├── ConsultationsReadySection
│       │   │   │   ├── AppointmentList
│       │   │   │   └── ConsultationDrawer (NEW)
│       │   │   │       ├── VitalsDisplay (Read-only)
│       │   │   │       ├── ConsultationNotesEditor
│       │   │   │       └── PrescriptionCreateButton
│       │   │   └── ResultsToReviewSection
│       │   │       ├── PrescriptionList
│       │   │       └── ResultReviewDialog (NEW)
│       │   │           ├── BiologistResultsDisplay
│       │   │           └── InterpretationEditor
│       │   │
│       │   ├── BiologistDashboard
│       │   │   ├── StatCard (x4)
│       │   │   ├── SamplesReceivedSection
│       │   │   │   ├── PrescriptionTable
│       │   │   │   └── StartAnalysisButton
│       │   │   └── InProgressSection
│       │   │       ├── PrescriptionList
│       │   │       └── ResultEntryDialog (NEW)
│       │   │
│       │   └── AdminDashboard (EXISTING - No Changes)
│       │
│       ├── Patients Page (EXISTING)
│       ├── Appointments Page (EXTENDED)
│       ├── Prescriptions Page (EXTENDED)
│       └── Results Page (EXTENDED)
│
└── Common Components
    ├── StatCard (NEW - Reusable)
    ├── QuickActionCard (NEW - Reusable)
    ├── StatusChip (NEW - Reusable)
    ├── EmptyState (NEW - Reusable)
    ├── ProtectedRoute (EXISTING)
    └── PublicRoute (EXISTING)
```

---

## Security Architecture

### Authentication Flow

```
1. User enters credentials
        ↓
2. POST /api/auth/login
        ↓
3. Backend validates with bcrypt
        ↓
4. express-session creates session
        ↓
5. Session cookie sent to frontend (httpOnly, 24h)
        ↓
6. Frontend stores user in AuthContext
        ↓
7. All subsequent requests include cookie automatically
        ↓
8. Backend AuthGuard checks session.userId
        ↓
9. Backend RolesGuard checks user.role from database
```

### Authorization Matrix

| Endpoint                              | ADMIN | DOCTOR | BIOLOGIST | SECRETARY | NURSE |
|---------------------------------------|-------|--------|-----------|-----------|-------|
| POST /auth/login                      | ✅    | ✅     | ✅        | ✅        | ✅    |
| GET /auth/me                          | ✅    | ✅     | ✅        | ✅        | ✅    |
| **Appointments**                      |       |        |           |           |       |
| GET /appointments                     | ✅    | ✅     | ✅        | ✅        | ✅    |
| POST /appointments                    | ✅    | ❌     | ❌        | ✅        | ❌    |
| PATCH /appointments/:id/check-in      | ✅    | ❌     | ❌        | ✅        | ❌    |
| PATCH /appointments/:id/vitals        | ✅    | ❌     | ❌        | ❌        | ✅    |
| PATCH /appointments/:id/consultation  | ✅    | ✅     | ❌        | ❌        | ❌    |
| PATCH /appointments/:id/close         | ✅    | ❌     | ❌        | ✅        | ❌    |
| **Prescriptions**                     |       |        |           |           |       |
| POST /prescriptions                   | ✅    | ✅     | ❌        | ❌        | ❌    |
| PATCH /prescriptions/:id/send-to-lab  | ✅    | ✅     | ❌        | ✅        | ❌    |
| PATCH /prescriptions/:id/collect-sample | ✅  | ❌     | ❌        | ❌        | ✅    |
| PATCH /prescriptions/:id/start-analysis | ✅  | ❌     | ✅        | ❌        | ❌    |
| **Results**                           |       |        |           |           |       |
| POST /results                         | ✅    | ❌     | ✅        | ❌        | ❌    |
| PATCH /results/:id/review             | ✅    | ✅     | ❌        | ❌        | ❌    |

### Guard Implementation Pattern

```typescript
// Example: Vitals entry endpoint (NURSE only)
@Patch(':id/vitals')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.NURSE, Role.ADMIN)
async enterVitals(
  @Param('id') id: string,
  @Body() dto: EnterVitalsDto,
  @CurrentUser() userId: string
) {
  // Implementation
}
```

---

## Error Handling Strategy

### Backend Error Responses

```typescript
// Standardized error format
{
  "statusCode": 400 | 401 | 403 | 404 | 409 | 500,
  "message": "User-friendly error description",
  "error": "Error type"
}
```

### Error Categories

**400 Bad Request**:
- Invalid state transitions
- Missing required fields
- Validation failures

Example: "Cannot enter vitals: appointment must be in CHECKED_IN status"

**401 Unauthorized**:
- No session cookie
- Session expired

Example: "Authentication required"

**403 Forbidden**:
- Insufficient role permissions
- Not authorized for resource

Example: "Only NURSE role can enter vitals"

**404 Not Found**:
- Resource does not exist

Example: "Appointment with id 'xyz' not found"

**409 Conflict**:
- Duplicate creation attempts
- Concurrent modification

Example: "Result already exists for this prescription"

**500 Internal Server Error**:
- Unexpected errors
- Database errors

Example: "An unexpected error occurred"

### Frontend Error Handling

```typescript
// API call with error handling
try {
  const response = await api.patch(`/appointments/${id}/check-in`);
  showSuccessMessage('Patient checked in successfully');
} catch (error: any) {
  const message = error.response?.data?.message || 'An error occurred';
  showErrorMessage(message);
}
```

---

## Caching Strategy

**For MVP: No Caching**

Rationale:
- Small user base (< 50 concurrent users)
- Local network (low latency)
- Data consistency is critical for medical workflows
- Complexity vs. benefit trade-off

**Future Enhancements**:
- Redis cache for frequently accessed patient data
- In-memory cache for user sessions
- Client-side cache with SWR or React Query

---

## Performance Considerations

### Database Indexing

```sql
-- Existing indexes
CREATE INDEX idx_appointments_patient ON appointments(patientId);
CREATE INDEX idx_appointments_doctor ON appointments(doctorId);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- New indexes recommended
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(date, status);
CREATE INDEX idx_prescriptions_patient_status ON prescriptions(patientId, status);
```

### Query Optimization

**Dashboard Queries**:
- Filter by role-specific statuses (e.g., NURSE sees only CHECKED_IN appointments)
- Limit results to current day or week
- Pagination for large result sets (50 items per page)

**Example Optimized Query**:
```typescript
// Get checked-in appointments for nurse dashboard
const appointments = await prisma.appointment.findMany({
  where: {
    status: 'CHECKED_IN',
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

### Performance Targets

- **Page Load**: < 2 seconds (desktop, local network)
- **API Response**: < 500ms for 95th percentile
- **Dashboard Refresh**: < 1 second
- **Form Submission**: < 200ms feedback

---

## Scalability Considerations

### Current Scale (MVP)
- Users: ~20 active users (5 roles)
- Patients: ~1000 records
- Appointments: ~100 per day
- Prescriptions: ~50 per day
- Concurrent Sessions: ~10-15

### Future Scale (1 year)
- Users: ~50 active users
- Patients: ~5000 records
- Appointments: ~300 per day
- Prescriptions: ~150 per day
- Concurrent Sessions: ~30-40

### Scalability Strategy
1. **Database**: PostgreSQL with connection pooling (current: 10 connections, can scale to 100)
2. **Backend**: Stateless NestJS (can add load balancer for horizontal scaling)
3. **Frontend**: Desktop app with embedded server (1 instance per workstation)
4. **Sessions**: In-memory (future: Redis for distributed sessions)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hospital Network                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Secretary  │  │   Nurse    │  │   Doctor   │        │
│  │ Workstation│  │ Workstation│  │ Workstation│        │
│  │ (Electron) │  │ (Electron) │  │ (Electron) │        │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘        │
│        │                │                │               │
│        │                │                │               │
│        └────────────────┼────────────────┘               │
│                         │                                │
│                   ┌─────▼─────┐                          │
│                   │  Backend  │                          │
│                   │  Server   │                          │
│                   │ (NestJS)  │                          │
│                   └─────┬─────┘                          │
│                         │                                │
│                   ┌─────▼─────┐                          │
│                   │PostgreSQL │                          │
│                   │ Database  │                          │
│                   └───────────┘                          │
└─────────────────────────────────────────────────────────┘
```

**Configuration**:
- Backend: `http://localhost:3000` (or hospital server IP)
- Database: `localhost:5432` (on backend server)
- Frontend: Packaged Electron app per workstation

---

## Technology Constraints & Rationale

### Backend: NestJS + Prisma
**Rationale**:
- Structured module system for clean separation
- Built-in dependency injection
- TypeScript for type safety
- Prisma provides type-safe database access
- express-session integration for simple auth

### Frontend: React + Material-UI
**Rationale**:
- React for component-based UI
- Material-UI for consistent, professional design
- TypeScript for type safety
- Context API for simple state management (no Redux needed)
- Axios for HTTP client

### Database: PostgreSQL + Prisma v6.x
**Rationale**:
- ACID compliance for medical data
- JSON support for flexible vitals structure
- Prisma v6.x (avoid v7 due to config changes)
- Strong relational model for workflow integrity

### Authentication: Session-based
**Rationale**:
- Simpler than JWT for MVP
- No token management complexity
- Suitable for desktop app (not mobile)
- Session cookie httpOnly for security
- 24-hour session duration

---

## Architecture Decision Records (ADRs)

### ADR-001: Extend Existing Modules vs. Create New Modules

**Status**: Accepted

**Context**: Need to implement check-in, vitals, consultation, sample collection workflows.

**Decision**: Extend AppointmentsModule and PrescriptionsModule rather than create separate modules for each workflow step.

**Consequences**:
- **Positive**: Less module complexity, clear ownership (appointments own their lifecycle)
- **Positive**: Easier to manage database transactions
- **Negative**: Modules become larger (mitigated by service layer separation)

**Alternatives Considered**:
- Separate VitalsModule, CheckInModule: Rejected due to excessive fragmentation
- Separate LabModule: Rejected; PrescriptionsModule already owns lab workflow

---

### ADR-002: JSON Field for Vitals vs. Separate Table

**Status**: Accepted

**Context**: Need to store patient vitals (weight, height, BP, temperature, etc.)

**Decision**: Use Prisma JSON field in Appointment model for vitals.

**Consequences**:
- **Positive**: Flexibility to add/remove vitals without migrations
- **Positive**: Simpler data model (no joins)
- **Positive**: Vitals always tied to specific appointment
- **Negative**: Cannot query individual vitals easily (acceptable for MVP)
- **Negative**: Less strict schema validation (mitigated by DTO validation)

**Alternatives Considered**:
- Separate Vitals table: Rejected due to over-engineering for MVP
- Flat fields in Appointment: Rejected due to schema rigidity

---

### ADR-003: Separate RESULTS_AVAILABLE Status

**Status**: Accepted

**Context**: Need to distinguish between "biologist entered results" and "doctor reviewed results"

**Decision**: Add RESULTS_AVAILABLE status between IN_PROGRESS and COMPLETED.

**Consequences**:
- **Positive**: Clear separation of biologist validation and doctor interpretation
- **Positive**: Doctor has explicit review queue
- **Positive**: Audit trail shows when results became available vs. reviewed
- **Negative**: Additional status adds complexity (acceptable for clarity)

**Alternatives Considered**:
- Single COMPLETED status: Rejected; no way to track doctor review
- Boolean flag on Result: Rejected; status-based workflow clearer

---

### ADR-004: No Real-Time Updates (WebSocket)

**Status**: Accepted

**Context**: Dashboard data needs to be current for workflow coordination

**Decision**: Use polling (manual refresh) instead of WebSocket real-time updates for MVP.

**Consequences**:
- **Positive**: Simpler architecture
- **Positive**: No WebSocket infrastructure needed
- **Negative**: Users must manually refresh dashboards
- **Mitigation**: Auto-refresh every 30 seconds (optional enhancement)

**Alternatives Considered**:
- WebSocket with Socket.io: Rejected as out of scope for 7-day MVP
- Server-Sent Events: Rejected for same reason

---

### ADR-005: Single Dashboard Component with Role-Based Routing

**Status**: Accepted

**Context**: Each role needs distinct dashboard layout

**Decision**: Create separate dashboard components (SecretaryDashboard, NurseDashboard, etc.) with role-based routing in Dashboard.tsx.

**Consequences**:
- **Positive**: Clear separation of role-specific UI
- **Positive**: Easy to customize per role
- **Negative**: Code duplication for similar components (mitigated by reusable components)

**Alternatives Considered**:
- Single dynamic dashboard with conditional rendering: Rejected due to complexity
- Separate route files per role: Rejected; over-fragmentation

---

## Success Criteria

The architecture will be considered successful when:

1. **Completeness**: All 11 workflow steps are supported by backend endpoints
2. **Type Safety**: All API contracts defined with TypeScript interfaces
3. **State Consistency**: State machines prevent invalid transitions
4. **Role Clarity**: Authorization matrix covers all endpoints
5. **Performance**: Meets NFR-001 targets (page < 2s, API < 500ms)
6. **Maintainability**: Module structure is clear and documented
7. **Testability**: Services can be unit tested, workflows can be integration tested

---

## Implementation Priorities

### Phase 1: Foundation (High Priority)
- Database migrations for all new fields and enums
- NURSE role seed data
- State transition validation service layer

### Phase 2: Backend Endpoints (High Priority)
- Implement all 8 new API endpoints
- Modify POST /results behavior
- Add role guards to all routes

### Phase 3: Frontend Components (High Priority)
- Create reusable components (StatCard, StatusChip, etc.)
- Implement NurseDashboard
- Extend SecretaryDashboard and DoctorDashboard

### Phase 4: Integration & Polish (Medium Priority)
- Connect all frontend components to backend
- Implement error handling
- Add loading states and empty states

---

## References

- Requirements: `/docs/2026_01_04/specs/requirements.md`
- User Stories: `/docs/2026_01_04/specs/user-stories.md`
- Acceptance Criteria: `/docs/2026_01_04/specs/acceptance-criteria.md`
- Dashboard UI Design: `/docs/2026_01_04/specs/dashboard-navigation.md`
- Current Prisma Schema: `/backend/prisma/schema.prisma`
- Current API Documentation: `/API.md`

---

**Document Status**: COMPLETE
**Next Steps**: Create detailed API specifications (api-spec.md)
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
