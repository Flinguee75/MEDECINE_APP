# API Specification - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Version**: 2.0 (Extended from v1.0)
**Base URL**: `http://localhost:3000/api`

---

## Overview

This document specifies all API endpoints for the complete clinical workflow system. It includes existing endpoints (documented for completeness) and new endpoints required for the 11-step workflow.

**Changes from v1.0**:
- 8 new endpoints for workflow state transitions
- 1 modified endpoint behavior (POST /results)
- Extended query parameters for filtering

---

## Authentication & Authorization

### Session-Based Authentication

All protected endpoints require:
- **Session Cookie**: Automatically sent by browser after login
- **httpOnly**: Cookie cannot be accessed by JavaScript
- **maxAge**: 24 hours
- **secure**: false in development, true in production

### Authorization Roles

```typescript
enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  BIOLOGIST = 'BIOLOGIST',
  SECRETARY = 'SECRETARY',
  NURSE = 'NURSE'
}
```

### Guards Usage Pattern

```typescript
// Require authentication only
@UseGuards(AuthGuard)

// Require specific role(s)
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.NURSE)

// Allow multiple roles
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.DOCTOR, Role.SECRETARY)
```

---

## Response Format

### Success Response

```json
{
  "data": { /* response data */ },
  "message": "Action completed successfully"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request"
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PATCH, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Validation error, invalid state transition
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Unexpected error

---

## Endpoints Summary

### New Endpoints (8)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| PATCH | /appointments/:id/check-in | SECRETARY | Check-in patient on arrival |
| PATCH | /appointments/:id/vitals | NURSE | Enter patient vitals |
| PATCH | /appointments/:id/consultation | DOCTOR | Complete consultation with notes |
| PATCH | /appointments/:id/close | SECRETARY | Close appointment with billing |
| PATCH | /prescriptions/:id/send-to-lab | DOCTOR, SECRETARY | Send prescription to lab |
| PATCH | /prescriptions/:id/collect-sample | NURSE | Mark sample as collected |
| PATCH | /prescriptions/:id/start-analysis | BIOLOGIST | Start lab analysis |
| PATCH | /results/:id/review | DOCTOR | Review and interpret results |

### Modified Endpoints (1)

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | /results | Now sets prescription status to RESULTS_AVAILABLE instead of COMPLETED |

### Existing Endpoints

All existing endpoints from v1.0 remain unchanged (documented below for completeness).

---

## 🔐 Authentication Endpoints

### POST /auth/login

**Description**: Authenticate user and create session

**Permissions**: Public

**Request Body**:
```typescript
{
  email: string;      // Required, valid email
  password: string;   // Required, min 6 characters
}
```

**Response 200**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Infirmier Test",
      "email": "nurse@hospital.com",
      "role": "NURSE"
    }
  },
  "message": "Connexion réussie"
}
```

**Errors**:
- `401`: Invalid credentials

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nurse@hospital.com","password":"nurse123"}'
```

---

### POST /auth/logout

**Description**: Destroy user session

**Permissions**: Authenticated

**Response 200**:
```json
{
  "message": "Déconnexion réussie"
}
```

---

### GET /auth/me

**Description**: Get current user information

**Permissions**: Authenticated

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Infirmier Test",
    "email": "nurse@hospital.com",
    "role": "NURSE",
    "createdAt": "2026-01-04T10:00:00.000Z"
  }
}
```

**Errors**:
- `401`: Not authenticated

---

## 📅 Appointments Endpoints

### GET /appointments

**Description**: List appointments with filtering

**Permissions**: Authenticated (all roles)

**Query Parameters**:
```typescript
{
  doctorId?: string;     // Filter by doctor
  patientId?: string;    // Filter by patient
  status?: AppointmentStatus;  // NEW: Filter by status
  date?: string;         // Filter by date (YYYY-MM-DD)
  limit?: number;        // Pagination limit (default: 50)
  offset?: number;       // Pagination offset (default: 0)
}
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-01-05T14:00:00.000Z",
      "motif": "Consultation de suivi",
      "status": "CHECKED_IN",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      },
      "vitals": null,
      "checkedInAt": "2026-01-05T13:45:00.000Z",
      "createdAt": "2026-01-02T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

**Example**:
```bash
# Get all checked-in appointments for today
curl "http://localhost:3000/api/appointments?status=CHECKED_IN&date=2026-01-05"
```

---

### POST /appointments

**Description**: Create new appointment

**Permissions**: SECRETARY, ADMIN

**Request Body**:
```typescript
{
  date: string;        // ISO 8601 datetime
  motif: string;       // Reason for appointment
  patientId: string;   // Patient UUID
  doctorId: string;    // Doctor UUID
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-10T15:00:00.000Z",
    "motif": "Première consultation",
    "status": "SCHEDULED",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid"
  },
  "message": "Rendez-vous créé avec succès"
}
```

**Errors**:
- `400`: Patient or doctor not found
- `403`: Insufficient permissions
- `409`: Doctor has conflicting appointment (optional validation)

---

### GET /appointments/:id

**Description**: Get appointment details

**Permissions**: Authenticated

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-05T14:00:00.000Z",
    "motif": "Consultation de suivi",
    "status": "IN_CONSULTATION",
    "vitals": {
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
    },
    "medicalHistoryNotes": "Patient reports pollen allergies",
    "consultationNotes": null,
    "checkedInAt": "2026-01-05T13:45:00.000Z",
    "vitalsEnteredBy": "nurse-uuid",
    "vitalsEnteredAt": "2026-01-05T13:50:00.000Z",
    "patient": {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-05-15T00:00:00.000Z",
      "phone": "+33612345678"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Martin",
      "email": "doctor@hospital.com"
    }
  }
}
```

**Errors**:
- `404`: Appointment not found

---

### PATCH /appointments/:id/check-in ⭐ NEW

**Description**: Check-in patient on arrival

**Permissions**: SECRETARY, ADMIN

**Request Body**: Empty `{}`

**Validation**:
- Appointment must be in `SCHEDULED` status
- Appointment date must be today or in past

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "CHECKED_IN",
    "checkedInAt": "2026-01-05T13:45:00.000Z",
    "updatedAt": "2026-01-05T13:45:00.000Z"
  },
  "message": "Patient enregistré avec succès"
}
```

**Errors**:
- `400`: "Cannot check in: appointment status must be SCHEDULED"
- `400`: "Cannot check in: appointment date is in the future"
- `403`: Only SECRETARY can check in
- `404`: Appointment not found

**State Transition**:
```
SCHEDULED → CHECKED_IN
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/appointments/abc-123/check-in \
  -H "Cookie: sessionId=xyz"
```

---

### PATCH /appointments/:id/vitals ⭐ NEW

**Description**: Enter patient vitals and medical history

**Permissions**: NURSE, ADMIN

**Request Body**:
```typescript
{
  vitals: {
    weight: number;           // kg, required
    height: number;           // cm, required
    temperature: number;      // °C, required
    bloodPressure: {
      systolic: number;       // mmHg, required
      diastolic: number;      // mmHg, required
    };
    heartRate: number;        // bpm, required
    respiratoryRate?: number; // breaths/min, optional
    oxygenSaturation?: number;// %, optional
  };
  medicalHistoryNotes?: string; // Optional, max 2000 characters
}
```

**Validation**:
- Appointment must be in `CHECKED_IN` status
- All required vitals fields must be present
- Weight > 0, Height > 0, Temperature between 30-45°C
- Blood pressure: systolic 50-250, diastolic 30-150
- Heart rate: 30-220 bpm

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "IN_CONSULTATION",
    "vitals": {
      "weight": 75.5,
      "height": 175,
      "temperature": 37.2,
      "bloodPressure": { "systolic": 120, "diastolic": 80 },
      "heartRate": 72,
      "respiratoryRate": 16,
      "oxygenSaturation": 98
    },
    "medicalHistoryNotes": "Patient reports pollen allergies",
    "vitalsEnteredBy": "nurse-uuid",
    "vitalsEnteredAt": "2026-01-05T13:50:00.000Z",
    "updatedAt": "2026-01-05T13:50:00.000Z"
  },
  "message": "Constantes vitales enregistrées avec succès"
}
```

**Errors**:
- `400`: "Cannot enter vitals: appointment status must be CHECKED_IN"
- `400`: Validation errors for vitals fields
- `403`: Only NURSE can enter vitals
- `404`: Appointment not found

**State Transition**:
```
CHECKED_IN → IN_CONSULTATION
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/appointments/abc-123/vitals \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "vitals": {
      "weight": 75.5,
      "height": 175,
      "temperature": 37.2,
      "bloodPressure": {"systolic": 120, "diastolic": 80},
      "heartRate": 72
    },
    "medicalHistoryNotes": "No known allergies"
  }'
```

---

### PATCH /appointments/:id/consultation ⭐ NEW

**Description**: Complete consultation with notes

**Permissions**: DOCTOR, ADMIN

**Request Body**:
```typescript
{
  consultationNotes: string;  // Required, min 10 chars, max 5000 chars
}
```

**Validation**:
- Appointment must be in `IN_CONSULTATION` status
- Consultation notes are required

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "CONSULTATION_COMPLETED",
    "consultationNotes": "Patient presents with seasonal allergies. Vitals within normal range. Recommend: Complete blood count and allergy panel.",
    "consultedBy": "doctor-uuid",
    "consultedAt": "2026-01-05T14:30:00.000Z",
    "updatedAt": "2026-01-05T14:30:00.000Z"
  },
  "message": "Consultation terminée avec succès"
}
```

**Errors**:
- `400`: "Cannot complete consultation: appointment status must be IN_CONSULTATION"
- `400`: "Consultation notes are required"
- `403`: Only DOCTOR can complete consultation
- `404`: Appointment not found

**State Transition**:
```
IN_CONSULTATION → CONSULTATION_COMPLETED
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/appointments/abc-123/consultation \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "consultationNotes": "Patient in good health. Recommend routine blood work."
  }'
```

---

### PATCH /appointments/:id/close ⭐ NEW

**Description**: Close appointment with billing information

**Permissions**: SECRETARY, ADMIN

**Request Body**:
```typescript
{
  billingAmount: number;        // Required, >= 0, max 2 decimals
  billingStatus: BillingStatus; // Required: PENDING | PAID | PARTIALLY_PAID
}

enum BillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID'
}
```

**Validation**:
- Appointment must be in `CONSULTATION_COMPLETED` status
- Billing amount must be >= 0

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "billingAmount": 150.00,
    "billingStatus": "PAID",
    "closedBy": "secretary-uuid",
    "closedAt": "2026-01-05T15:00:00.000Z",
    "updatedAt": "2026-01-05T15:00:00.000Z"
  },
  "message": "Rendez-vous clôturé avec succès"
}
```

**Errors**:
- `400`: "Cannot close: appointment status must be CONSULTATION_COMPLETED"
- `400`: "Billing amount must be >= 0"
- `403`: Only SECRETARY can close appointments
- `404`: Appointment not found

**State Transition**:
```
CONSULTATION_COMPLETED → COMPLETED
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/appointments/abc-123/close \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "billingAmount": 150.00,
    "billingStatus": "PAID"
  }'
```

---

### PATCH /appointments/:id (EXISTING)

**Description**: Modify appointment details

**Permissions**: SECRETARY (all fields), DOCTOR (status only)

**Request Body** (all optional):
```typescript
{
  date?: string;               // ISO 8601 datetime
  motif?: string;
  status?: AppointmentStatus;  // SCHEDULED, COMPLETED, CANCELLED
}
```

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-10T16:00:00.000Z",
    "motif": "Consultation modifiée",
    "status": "SCHEDULED"
  },
  "message": "Rendez-vous modifié avec succès"
}
```

**Note**: This endpoint is for general updates. Use specific workflow endpoints for state transitions.

---

### DELETE /appointments/:id (EXISTING)

**Description**: Cancel appointment (soft delete)

**Permissions**: SECRETARY, ADMIN

**Response 200**:
```json
{
  "message": "Rendez-vous annulé avec succès"
}
```

**Implementation**: Sets status to `CANCELLED` instead of deleting record.

---

## 💊 Prescriptions Endpoints

### GET /prescriptions

**Description**: List prescriptions with filtering

**Permissions**: Authenticated (all roles)

**Query Parameters**:
```typescript
{
  doctorId?: string;
  patientId?: string;
  status?: PrescriptionStatus;  // ENHANCED: More status options
  limit?: number;               // Default: 50
  offset?: number;              // Default: 0
}
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Complete Blood Count (CBC), Lipid Panel",
      "status": "SENT_TO_LAB",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      },
      "nurse": null,
      "sampleCollectedAt": null,
      "analysisStartedAt": null,
      "createdAt": "2026-01-05T14:35:00.000Z",
      "result": null
    }
  ]
}
```

**Example**:
```bash
# Get all prescriptions sent to lab
curl "http://localhost:3000/api/prescriptions?status=SENT_TO_LAB"
```

---

### POST /prescriptions (EXISTING)

**Description**: Create prescription

**Permissions**: DOCTOR, ADMIN

**Request Body**:
```typescript
{
  text: string;        // Required, min 10 chars
  patientId: string;   // Required, patient UUID
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Complete Blood Count (CBC), Lipid Panel",
    "status": "CREATED",
    "patientId": "patient-uuid",
    "doctorId": "current-doctor-uuid",
    "createdAt": "2026-01-05T14:35:00.000Z"
  },
  "message": "Prescription créée avec succès"
}
```

**Errors**:
- `400`: Patient not found
- `403`: Only DOCTOR can create prescriptions

---

### GET /prescriptions/:id (EXISTING)

**Description**: Get prescription details

**Permissions**: Authenticated

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Complete Blood Count (CBC), Lipid Panel",
    "status": "SAMPLE_COLLECTED",
    "patient": {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-05-15T00:00:00.000Z"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Martin"
    },
    "nurse": {
      "id": "uuid",
      "name": "Infirmier Test"
    },
    "sampleCollectedAt": "2026-01-05T15:30:00.000Z",
    "analysisStartedAt": null,
    "result": null,
    "createdAt": "2026-01-05T14:35:00.000Z"
  }
}
```

---

### PATCH /prescriptions/:id/send-to-lab ⭐ NEW

**Description**: Send prescription to laboratory

**Permissions**: DOCTOR, SECRETARY, ADMIN

**Request Body**: Empty `{}`

**Validation**:
- Prescription must be in `CREATED` status

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "SENT_TO_LAB",
    "updatedAt": "2026-01-05T14:40:00.000Z"
  },
  "message": "Prescription envoyée au laboratoire"
}
```

**Errors**:
- `400`: "Cannot send to lab: prescription status must be CREATED"
- `403`: Insufficient permissions
- `404`: Prescription not found

**State Transition**:
```
CREATED → SENT_TO_LAB
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/prescriptions/abc-123/send-to-lab \
  -H "Cookie: sessionId=xyz"
```

---

### PATCH /prescriptions/:id/collect-sample ⭐ NEW

**Description**: Mark sample as collected by nurse

**Permissions**: NURSE, ADMIN

**Request Body**:
```typescript
{
  notes?: string;  // Optional collection notes, max 500 chars
}
```

**Validation**:
- Prescription must be in `SENT_TO_LAB` status

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "SAMPLE_COLLECTED",
    "nurseId": "nurse-uuid",
    "sampleCollectedAt": "2026-01-05T15:30:00.000Z",
    "updatedAt": "2026-01-05T15:30:00.000Z"
  },
  "message": "Échantillon collecté avec succès"
}
```

**Errors**:
- `400`: "Cannot collect sample: prescription status must be SENT_TO_LAB"
- `403`: Only NURSE can collect samples
- `404`: Prescription not found

**State Transition**:
```
SENT_TO_LAB → SAMPLE_COLLECTED
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/prescriptions/abc-123/collect-sample \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "notes": "Sample collected at 15:30, stored in refrigerator B2"
  }'
```

---

### PATCH /prescriptions/:id/start-analysis ⭐ NEW

**Description**: Start laboratory analysis

**Permissions**: BIOLOGIST, ADMIN

**Request Body**: Empty `{}`

**Validation**:
- Prescription must be in `SAMPLE_COLLECTED` status

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "analysisStartedAt": "2026-01-05T16:00:00.000Z",
    "updatedAt": "2026-01-05T16:00:00.000Z"
  },
  "message": "Analyse démarrée avec succès"
}
```

**Errors**:
- `400`: "Cannot start analysis: prescription status must be SAMPLE_COLLECTED"
- `403`: Only BIOLOGIST can start analysis
- `404`: Prescription not found

**State Transition**:
```
SAMPLE_COLLECTED → IN_PROGRESS
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/prescriptions/abc-123/start-analysis \
  -H "Cookie: sessionId=xyz"
```

---

### PATCH /prescriptions/:id (DEPRECATED)

**Description**: Generic prescription update (deprecated)

**Note**: Use specific workflow endpoints instead:
- `/send-to-lab`
- `/collect-sample`
- `/start-analysis`

This endpoint remains for backward compatibility but is discouraged for status changes.

---

## 🔬 Results Endpoints

### GET /results

**Description**: List results

**Permissions**: DOCTOR, BIOLOGIST, ADMIN

**Query Parameters**:
```typescript
{
  prescriptionId?: string;
  limit?: number;
  offset?: number;
}
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)\nHemoglobin: 14.5 g/dL (normal)",
      "validatedBy": "biologist-uuid",
      "validatedAt": "2026-01-05T17:00:00.000Z",
      "reviewedBy": null,
      "reviewedAt": null,
      "interpretation": null,
      "prescription": {
        "id": "uuid",
        "text": "Complete Blood Count (CBC)",
        "status": "RESULTS_AVAILABLE",
        "patient": {
          "firstName": "Jean",
          "lastName": "Dupont"
        }
      },
      "createdAt": "2026-01-05T17:00:00.000Z"
    }
  ]
}
```

---

### POST /results 🔄 MODIFIED

**Description**: Create result (biologist validates)

**Permissions**: BIOLOGIST, ADMIN

**Request Body**:
```typescript
{
  text: string;           // Required, min 20 chars, max 10000 chars
  prescriptionId: string; // Required, prescription UUID
  data?: any;             // Optional structured data (JSON)
}
```

**Validation**:
- Prescription must be in `IN_PROGRESS` status
- Prescription must not already have a result (one-to-one relation)

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)\nHemoglobin: 14.5 g/dL (normal)",
    "prescriptionId": "prescription-uuid",
    "validatedBy": "biologist-uuid",
    "validatedAt": "2026-01-05T17:00:00.000Z",
    "createdAt": "2026-01-05T17:00:00.000Z"
  },
  "message": "Résultat créé avec succès"
}
```

**Side Effect**: Sets prescription status to `RESULTS_AVAILABLE` (NOT `COMPLETED`)

**Errors**:
- `400`: "Cannot create result: prescription status must be IN_PROGRESS"
- `403`: Only BIOLOGIST can create results
- `404`: Prescription not found
- `409`: "Result already exists for this prescription"

**State Transition** (Prescription):
```
IN_PROGRESS → RESULTS_AVAILABLE
```

**Change from v1.0**: Now sets status to `RESULTS_AVAILABLE` instead of `COMPLETED`.

**Example**:
```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "prescriptionId": "abc-123",
    "text": "Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)"
  }'
```

---

### GET /results/:id (EXISTING)

**Description**: Get result details

**Permissions**: DOCTOR, BIOLOGIST, ADMIN

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)\nHemoglobin: 14.5 g/dL (normal)",
    "data": null,
    "validatedBy": "biologist-uuid",
    "validatedAt": "2026-01-05T17:00:00.000Z",
    "reviewedBy": "doctor-uuid",
    "reviewedAt": "2026-01-05T17:30:00.000Z",
    "interpretation": "All blood count values within normal limits. No anemia or infection indicated. Patient can proceed with allergy testing as planned.",
    "prescription": {
      "id": "uuid",
      "text": "Complete Blood Count (CBC)",
      "status": "COMPLETED",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      }
    },
    "createdAt": "2026-01-05T17:00:00.000Z",
    "updatedAt": "2026-01-05T17:30:00.000Z"
  }
}
```

---

### PATCH /results/:id/review ⭐ NEW

**Description**: Doctor reviews and interprets results

**Permissions**: DOCTOR, ADMIN

**Request Body**:
```typescript
{
  interpretation: string;  // Required, min 20 chars, max 3000 chars
}
```

**Validation**:
- Prescription must be in `RESULTS_AVAILABLE` status
- Interpretation is required

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "interpretation": "All blood count values within normal limits. No anemia or infection indicated. Patient can proceed with allergy testing as planned.",
    "reviewedBy": "doctor-uuid",
    "reviewedAt": "2026-01-05T17:30:00.000Z",
    "updatedAt": "2026-01-05T17:30:00.000Z"
  },
  "message": "Résultat examiné avec succès"
}
```

**Side Effect**: Sets prescription status to `COMPLETED`

**Errors**:
- `400`: "Cannot review: prescription status must be RESULTS_AVAILABLE"
- `400`: "Interpretation is required"
- `403`: Only DOCTOR can review results
- `404`: Result not found

**State Transition** (Prescription):
```
RESULTS_AVAILABLE → COMPLETED
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/results/abc-123/review \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=xyz" \
  -d '{
    "interpretation": "All values within normal limits. No action required."
  }'
```

---

### PATCH /results/:id (EXISTING)

**Description**: Modify result (biologist only)

**Permissions**: BIOLOGIST, ADMIN

**Request Body**:
```typescript
{
  text?: string;
  data?: any;
}
```

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "text": "Updated result text",
    "updatedAt": "2026-01-05T17:15:00.000Z"
  },
  "message": "Résultat modifié avec succès"
}
```

**Note**: Cannot modify after doctor has reviewed.

---

## 👥 Users Endpoints (EXISTING - No Changes)

All user endpoints remain unchanged from v1.0. Included here for completeness.

### GET /users

**Description**: List all users

**Permissions**: ADMIN

**Query Parameters**:
```typescript
{
  role?: Role;
  search?: string;
}
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Infirmier Test",
      "email": "nurse@hospital.com",
      "role": "NURSE",
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /users

**Description**: Create user

**Permissions**: ADMIN

**Request Body**:
```typescript
{
  name: string;
  email: string;
  password: string;
  role: Role;
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Infirmier Test",
    "email": "nurse@hospital.com",
    "role": "NURSE"
  },
  "message": "Utilisateur créé avec succès"
}
```

---

### GET /users/:id

**Permissions**: ADMIN or self

---

### PATCH /users/:id

**Permissions**: ADMIN

---

### DELETE /users/:id

**Permissions**: ADMIN

---

## 👤 Patients Endpoints (EXISTING - No Changes)

All patient endpoints remain unchanged from v1.0.

### GET /patients

**Permissions**: Authenticated (all roles)

---

### POST /patients

**Permissions**: SECRETARY, ADMIN

---

### GET /patients/:id

**Permissions**: Authenticated

---

### PATCH /patients/:id

**Permissions**: SECRETARY, ADMIN

---

## Permission Matrix

| Endpoint | ADMIN | DOCTOR | BIOLOGIST | SECRETARY | NURSE |
|----------|-------|--------|-----------|-----------|-------|
| **Authentication** | | | | | |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Users** | | | | | |
| GET /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Patients** | | | | | |
| GET /patients | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /patients | ✅ | ❌ | ❌ | ✅ | ❌ |
| PATCH /patients/:id | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Appointments** | | | | | |
| GET /appointments | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /appointments | ✅ | ❌ | ❌ | ✅ | ❌ |
| PATCH /appointments/:id/check-in | ✅ | ❌ | ❌ | ✅ | ❌ |
| PATCH /appointments/:id/vitals | ✅ | ❌ | ❌ | ❌ | ✅ |
| PATCH /appointments/:id/consultation | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /appointments/:id/close | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Prescriptions** | | | | | |
| GET /prescriptions | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /prescriptions | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /prescriptions/:id/send-to-lab | ✅ | ✅ | ❌ | ✅ | ❌ |
| PATCH /prescriptions/:id/collect-sample | ✅ | ❌ | ❌ | ❌ | ✅ |
| PATCH /prescriptions/:id/start-analysis | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Results** | | | | | |
| GET /results | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /results | ✅ | ❌ | ✅ | ❌ | ❌ |
| PATCH /results/:id/review | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## TypeScript Interfaces

### Request DTOs

```typescript
// Vitals Entry
export class EnterVitalsDto {
  @IsNotEmpty()
  @ValidateNested()
  vitals: {
    weight: number;
    height: number;
    temperature: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    heartRate: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };

  @IsOptional()
  @MaxLength(2000)
  medicalHistoryNotes?: string;
}

// Consultation
export class CompleteConsultationDto {
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  consultationNotes: string;
}

// Closure
export class CloseAppointmentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  billingAmount: number;

  @IsNotEmpty()
  @IsEnum(BillingStatus)
  billingStatus: BillingStatus;
}

// Sample Collection
export class CollectSampleDto {
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// Result Review
export class ReviewResultDto {
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(3000)
  interpretation: string;
}
```

### Response Types

```typescript
// Appointment with all workflow fields
export interface AppointmentResponse {
  id: string;
  date: string;
  motif: string;
  status: AppointmentStatus;
  vitals?: VitalsData;
  medicalHistoryNotes?: string;
  consultationNotes?: string;

  // Timestamps
  checkedInAt?: string;
  vitalsEnteredAt?: string;
  consultedAt?: string;
  closedAt?: string;

  // User references
  vitalsEnteredBy?: string;
  consultedBy?: string;
  closedBy?: string;

  // Billing
  billingAmount?: number;
  billingStatus?: BillingStatus;

  // Relations
  patient: PatientSummary;
  doctor: UserSummary;

  createdAt: string;
  updatedAt: string;
}

// Prescription with lab workflow fields
export interface PrescriptionResponse {
  id: string;
  text: string;
  status: PrescriptionStatus;

  // Lab workflow timestamps
  sampleCollectedAt?: string;
  analysisStartedAt?: string;

  // Relations
  patient: PatientSummary;
  doctor: UserSummary;
  nurse?: UserSummary;
  result?: ResultSummary;

  createdAt: string;
  updatedAt: string;
}

// Result with validation and review
export interface ResultResponse {
  id: string;
  text: string;
  data?: any;

  // Validation (by biologist)
  validatedBy: string;
  validatedAt: string;

  // Review (by doctor)
  reviewedBy?: string;
  reviewedAt?: string;
  interpretation?: string;

  prescription: PrescriptionResponse;

  createdAt: string;
  updatedAt: string;
}
```

---

## Error Codes Reference

### Appointment Errors

| Code | Message | Cause |
|------|---------|-------|
| A001 | Cannot check in: appointment status must be SCHEDULED | Invalid state transition |
| A002 | Cannot check in: appointment date is in the future | Business rule violation |
| A003 | Cannot enter vitals: appointment status must be CHECKED_IN | Invalid state transition |
| A004 | Cannot complete consultation: appointment status must be IN_CONSULTATION | Invalid state transition |
| A005 | Cannot close: appointment status must be CONSULTATION_COMPLETED | Invalid state transition |
| A006 | Consultation notes are required | Validation error |
| A007 | Billing amount must be >= 0 | Validation error |

### Prescription Errors

| Code | Message | Cause |
|------|---------|-------|
| P001 | Cannot send to lab: prescription status must be CREATED | Invalid state transition |
| P002 | Cannot collect sample: prescription status must be SENT_TO_LAB | Invalid state transition |
| P003 | Cannot start analysis: prescription status must be SAMPLE_COLLECTED | Invalid state transition |

### Result Errors

| Code | Message | Cause |
|------|---------|-------|
| R001 | Cannot create result: prescription status must be IN_PROGRESS | Invalid state transition |
| R002 | Result already exists for this prescription | Duplicate resource |
| R003 | Cannot review: prescription status must be RESULTS_AVAILABLE | Invalid state transition |
| R004 | Interpretation is required | Validation error |

---

## Testing Examples

### Complete Workflow Test Scenario

```bash
# 1. Login as SECRETARY
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretary@hospital.com","password":"secretary123"}' \
  -c cookies.txt

# 2. Create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"firstName":"Test","lastName":"Patient","birthDate":"1990-01-01"}'

# 3. Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "date":"2026-01-05T14:00:00Z",
    "motif":"Test appointment",
    "patientId":"patient-uuid",
    "doctorId":"doctor-uuid"
  }'

# 4. Check-in patient
curl -X PATCH http://localhost:3000/api/appointments/apt-uuid/check-in \
  -b cookies.txt

# 5. Login as NURSE
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nurse@hospital.com","password":"nurse123"}' \
  -c cookies.txt

# 6. Enter vitals
curl -X PATCH http://localhost:3000/api/appointments/apt-uuid/vitals \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "vitals": {
      "weight": 70,
      "height": 170,
      "temperature": 37.0,
      "bloodPressure": {"systolic": 120, "diastolic": 80},
      "heartRate": 72
    }
  }'

# 7. Login as DOCTOR
# ... continue with consultation, prescription, etc.
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial API specification |
| 2.0 | 2026-01-04 | Added 8 workflow endpoints, modified POST /results behavior |

---

## References

- Architecture Design: `/docs/2026_01_04/architecture/architecture.md`
- Database Schema: `/docs/2026_01_04/architecture/database-design.md`
- Requirements: `/docs/2026_01_04/specs/requirements.md`
- Acceptance Criteria: `/docs/2026_01_04/specs/acceptance-criteria.md`

---

**Document Status**: COMPLETE
**Next Steps**: Implement backend controllers and services
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
