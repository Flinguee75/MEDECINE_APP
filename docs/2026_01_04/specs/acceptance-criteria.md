# Acceptance Criteria - Complete Clinical Workflow

**Project**: Hospital Management System
**Date**: 2026-01-04
**Version**: 1.0
**Testing Approach**: Manual testing with defined test scenarios

---

## Overview

This document provides detailed, testable acceptance criteria for each feature in the complete clinical workflow implementation. Each criterion includes:
- **Given-When-Then** scenarios for clarity
- **Test data** for execution
- **Expected outcomes** for validation
- **Edge cases** to consider

---

## Feature: NURSE Role Implementation

### AC-001: NURSE Role in Database Schema

**Given** the Prisma schema is updated with NURSE role
**When** a database migration is run
**Then** the Role enum includes ADMIN, DOCTOR, BIOLOGIST, SECRETARY, NURSE

**Test Steps**:
1. Open `backend/prisma/schema.prisma`
2. Verify `enum Role` includes NURSE
3. Run `npm run db:migrate`
4. Open Prisma Studio: `npm run db:studio`
5. Verify User model shows NURSE as role option

**Expected Result**: NURSE appears in Role dropdown

**Edge Cases**:
- Existing users maintain their roles after migration
- No data loss during enum extension

---

### AC-002: NURSE User Account in Seed Data

**Given** the seed script is updated
**When** `npm run db:seed` is executed
**Then** a NURSE user exists with email nurse@hospital.com

**Test Steps**:
1. Run `npm run db:reset` (WARNING: deletes all data)
2. Run `npm run db:seed`
3. Open Prisma Studio
4. Navigate to User table
5. Find user with email "nurse@hospital.com"

**Expected Result**:
- User exists with:
  - email: nurse@hospital.com
  - role: NURSE
  - name: "Infirmier Test" (or similar)
  - password: hashed version of "nurse123"

**Edge Cases**:
- Seed can run multiple times without duplicate error
- Password hashing works correctly

---

### AC-003: NURSE Authentication

**Given** a NURSE user exists
**When** user logs in with nurse credentials
**Then** authentication succeeds and user session is created

**Test Steps**:
1. Start backend: `npm run dev:backend`
2. Start frontend: `npm run dev:frontend`
3. Navigate to http://localhost:5173/login
4. Enter email: nurse@hospital.com
5. Enter password: nurse123
6. Click "Se connecter"

**Expected Result**:
- Login succeeds
- Redirect to /dashboard
- Dashboard displays "Bienvenue, Infirmier" (or nurse name)
- Role chip shows "Infirmier" in green color
- Logout button visible

**Edge Cases**:
- Incorrect password shows error
- Session persists on page refresh
- Logout destroys session

---

### AC-004: NURSE Dashboard Access

**Given** a NURSE user is logged in
**When** user views dashboard
**Then** nurse-specific sections are displayed

**Test Steps**:
1. Login as NURSE (from AC-003)
2. Verify dashboard sections exist:
   - "Patients to Prepare" (CHECKED_IN appointments)
   - "Samples to Collect" (SENT_TO_LAB prescriptions)
   - Statistics cards showing counts

**Expected Result**:
- Dashboard layout differs from DOCTOR/SECRETARY/BIOLOGIST
- Nurse-relevant actions are visible
- No unauthorized actions (e.g., user management)

---

## Feature: Appointment Check-In Workflow

### AC-005: Check-In Database Fields

**Given** Appointment model is updated
**When** migration adds checkedInAt field
**Then** field is available for storing check-in timestamp

**Test Steps**:
1. Check Prisma schema includes `checkedInAt DateTime?`
2. Run migration
3. Open Prisma Studio
4. Open Appointment table schema view
5. Verify checkedInAt field exists

**Expected Result**: Field type is DateTime, nullable

---

### AC-006: Check-In Endpoint Authorization

**Given** backend endpoint /api/appointments/:id/check-in exists
**When** SECRETARY role calls endpoint
**Then** request succeeds
**When** DOCTOR/NURSE/BIOLOGIST role calls endpoint
**Then** request returns 403 Forbidden

**Test Steps (using Postman or curl)**:
1. Login as SECRETARY, save session cookie
2. Create SCHEDULED appointment, save ID
3. Call PATCH /api/appointments/{id}/check-in
4. Verify 200 OK response
5. Login as DOCTOR
6. Call same endpoint with doctor session
7. Verify 403 response

**Expected Result**:
- SECRETARY: 200 OK
- Others: 403 Forbidden with message "Insufficient permissions"

---

### AC-007: Check-In Status Transition

**Given** an appointment with status SCHEDULED exists
**When** SECRETARY calls check-in endpoint
**Then** status changes to CHECKED_IN and timestamp is recorded

**Test Steps**:
1. Login as SECRETARY
2. Create appointment with status SCHEDULED
3. Navigate to appointments list
4. Click "Check In" button on appointment
5. Verify success message displays
6. Refresh page
7. Verify appointment status shows "CHECKED_IN"
8. Open Prisma Studio
9. Find appointment by ID
10. Verify checkedInAt has current timestamp

**Expected Result**:
- status: CHECKED_IN
- checkedInAt: [current timestamp]
- Visual indicator (orange color/icon)

**Edge Cases**:
- CANCELLED appointment cannot be checked in (400 error)
- Already CHECKED_IN appointment shows disabled button
- COMPLETED appointment cannot be checked in

---

### AC-008: Check-In UI Button Visibility

**Given** SECRETARY views appointments list
**When** appointment status is SCHEDULED
**Then** "Check In" button is visible and enabled
**When** appointment status is CHECKED_IN or later
**Then** button is disabled or hidden

**Test Steps**:
1. Login as SECRETARY
2. Navigate to /appointments
3. Create multiple appointments with different statuses
4. Verify button states:
   - SCHEDULED: enabled blue button
   - CHECKED_IN: disabled or hidden
   - COMPLETED: hidden
   - CANCELLED: hidden

**Expected Result**: Only SCHEDULED appointments show active check-in button

---

## Feature: Pre-Consultation Vitals Entry

### AC-009: Vitals Database Schema

**Given** Appointment model is updated with vitals fields
**When** migration runs
**Then** fields vitals (JSON), vitalsEnteredBy (String), vitalsEnteredAt (DateTime) exist

**Test Steps**:
1. Check schema includes new fields
2. Run migration
3. Verify in Prisma Studio

**Expected Result**: All three fields are nullable

---

### AC-010: Vitals Entry Endpoint Authorization

**Given** endpoint /api/appointments/:id/vitals exists
**When** NURSE role calls endpoint
**Then** request succeeds
**When** non-NURSE role calls endpoint
**Then** request returns 403 Forbidden

**Test Steps**:
1. Login as NURSE
2. Call PATCH /api/appointments/{id}/vitals with valid data
3. Verify 200 OK
4. Login as SECRETARY
5. Call same endpoint
6. Verify 403

**Expected Result**: Only NURSE can enter vitals

---

### AC-011: Vitals Data Validation

**Given** NURSE enters vitals
**When** required fields are missing
**Then** validation error returns with descriptive message

**Test Data (Invalid)**:
```json
{
  "vitals": {
    "weight": null,  // INVALID: required
    "temperature": 37.2
  }
}
```

**Test Steps**:
1. Login as NURSE
2. Submit vitals with missing weight
3. Verify error response
4. Check error message includes "weight is required"

**Expected Result**: 400 Bad Request with field-level errors

**Valid Vitals Example**:
```json
{
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
  "medicalHistoryNotes": "Patient reports pollen allergies"
}
```

**Expected Result**: 200 OK with updated appointment

---

### AC-012: Vitals Entry Status Transition

**Given** appointment status is CHECKED_IN
**When** NURSE submits vitals
**Then** status changes to IN_CONSULTATION

**Test Steps**:
1. Create appointment with status CHECKED_IN
2. Login as NURSE
3. Navigate to "Patients to Prepare" section
4. Click appointment
5. Fill vitals form:
   - Weight: 70 kg
   - Height: 170 cm
   - Temperature: 36.8°C
   - BP: 115/75
   - Heart Rate: 68 bpm
6. Click "Save Vitals"
7. Verify success message
8. Verify appointment moves to IN_CONSULTATION status
9. Verify vitalsEnteredAt is current time
10. Verify vitalsEnteredBy is nurse userId

**Expected Result**:
- Status transitions to IN_CONSULTATION
- Timestamp recorded
- Nurse ID recorded
- Appointment disappears from nurse's queue

**Edge Cases**:
- SCHEDULED appointment cannot receive vitals (must be checked in first)
- Already IN_CONSULTATION appointment can update vitals
- COMPLETED appointment cannot receive vitals

---

### AC-013: Vitals Display for Doctor

**Given** vitals have been entered by nurse
**When** DOCTOR views appointment
**Then** vitals are displayed in read-only format

**Test Steps**:
1. Create appointment with vitals (from AC-012)
2. Login as DOCTOR
3. Navigate to appointment detail
4. Verify vitals section displays:
   - Weight: 70 kg
   - Height: 170 cm
   - Temperature: 36.8°C
   - Blood Pressure: 115/75 mmHg
   - Heart Rate: 68 bpm
   - All fields read-only (not editable)
5. Verify nurse name appears: "Vitals entered by: [Nurse Name]"
6. Verify timestamp appears

**Expected Result**: All vitals visible, formatted with units, read-only

**Edge Cases**:
- If vitals not entered, show message "Waiting for nurse preparation"
- Abnormal values (e.g., temperature > 38°C) highlighted in red (optional enhancement)

---

## Feature: Medical Consultation Notes

### AC-014: Consultation Notes Database Fields

**Given** Appointment model includes consultationNotes, consultedBy, consultedAt
**When** migration runs
**Then** fields are available in database

**Test Steps**:
1. Verify schema includes fields
2. Run migration
3. Check Prisma Studio

**Expected Result**: All fields are nullable TEXT/String/DateTime

---

### AC-015: Consultation Notes Entry Authorization

**Given** endpoint /api/appointments/:id/consultation exists
**When** DOCTOR role calls endpoint
**Then** request succeeds
**When** non-DOCTOR role calls endpoint
**Then** request returns 403 Forbidden

**Test Steps**:
1. Login as DOCTOR
2. Call PATCH /api/appointments/{id}/consultation
3. Verify 200 OK
4. Login as NURSE
5. Call same endpoint
6. Verify 403

**Expected Result**: Only DOCTOR can enter consultation notes

---

### AC-016: Consultation Notes Entry and Status

**Given** appointment status is IN_CONSULTATION
**When** DOCTOR submits consultation notes
**Then** status changes to CONSULTATION_COMPLETED

**Test Steps**:
1. Create appointment with status IN_CONSULTATION (with vitals)
2. Login as DOCTOR
3. Navigate to appointment detail
4. View vitals (read-only)
5. Enter consultation notes:
   ```
   Patient presents with seasonal allergies.
   Vitals within normal range.
   Recommend: Complete blood count and allergy panel.
   ```
6. Click "Complete Consultation"
7. Verify success message
8. Verify status changes to CONSULTATION_COMPLETED
9. Verify consultedAt timestamp
10. Verify consultedBy is doctor userId

**Expected Result**:
- Status: CONSULTATION_COMPLETED
- Notes saved
- Doctor ID recorded
- Timestamp recorded

**Edge Cases**:
- Cannot enter consultation notes if status is SCHEDULED or CHECKED_IN
- Can update notes if status is already CONSULTATION_COMPLETED
- Notes support at least 2000 characters

---

### AC-017: Consultation Notes Character Limit

**Given** doctor enters consultation notes
**When** notes exceed 5000 characters
**Then** validation message appears

**Test Steps**:
1. Login as DOCTOR
2. Open consultation form
3. Paste text with 5001 characters
4. Attempt to save
5. Verify error message

**Expected Result**: "Consultation notes cannot exceed 5000 characters"

---

## Feature: Lab Prescription Workflow

### AC-018: Prescription Status Enum Extended

**Given** PrescriptionStatus enum is updated
**When** migration runs
**Then** enum includes CREATED, SENT_TO_LAB, SAMPLE_COLLECTED, IN_PROGRESS, RESULTS_AVAILABLE, COMPLETED

**Test Steps**:
1. Check schema
2. Run migration
3. Verify in Prisma Studio

**Expected Result**: All 6 status values exist

---

### AC-019: Send Prescription to Lab

**Given** prescription status is CREATED
**When** DOCTOR or SECRETARY calls /api/prescriptions/:id/send-to-lab
**Then** status changes to SENT_TO_LAB

**Test Steps**:
1. Login as DOCTOR
2. Create prescription with status CREATED
3. Click "Send to Lab" button
4. Verify status changes to SENT_TO_LAB
5. Verify prescription appears in NURSE's "Samples to Collect" queue

**Expected Result**:
- Status: SENT_TO_LAB
- Visible to NURSE
- Button disabled after sending

**Edge Cases**:
- Already SENT_TO_LAB prescription shows disabled button
- COMPLETED prescription cannot be re-sent

---

### AC-020: Sample Collection by Nurse

**Given** prescription status is SENT_TO_LAB
**When** NURSE calls /api/prescriptions/:id/collect-sample
**Then** status changes to SAMPLE_COLLECTED

**Test Steps**:
1. Login as NURSE
2. Navigate to "Samples to Collect" section
3. View SENT_TO_LAB prescription
4. Click "Collect Sample" button
5. Optionally add notes: "Sample collected at 10:30 AM"
6. Click "Confirm Collection"
7. Verify status changes to SAMPLE_COLLECTED
8. Verify sampleCollectedAt timestamp
9. Verify nurseId recorded
10. Verify prescription disappears from nurse's queue
11. Verify prescription appears in BIOLOGIST's queue

**Expected Result**:
- Status: SAMPLE_COLLECTED
- Nurse ID recorded
- Timestamp recorded
- Notes saved (if entered)

**Edge Cases**:
- Cannot collect sample if status is CREATED (must be SENT_TO_LAB)
- Cannot collect if already SAMPLE_COLLECTED

---

### AC-021: Start Lab Analysis

**Given** prescription status is SAMPLE_COLLECTED
**When** BIOLOGIST calls /api/prescriptions/:id/start-analysis
**Then** status changes to IN_PROGRESS

**Test Steps**:
1. Login as BIOLOGIST
2. Navigate to "Samples Received" section
3. View SAMPLE_COLLECTED prescription
4. Click "Start Analysis" button
5. Verify status changes to IN_PROGRESS
6. Verify analysisStartedAt timestamp

**Expected Result**:
- Status: IN_PROGRESS
- Timestamp recorded
- Prescription moves to "In Progress" section

**Edge Cases**:
- Cannot start if not SAMPLE_COLLECTED
- Can restart if already IN_PROGRESS (updates timestamp)

---

### AC-022: Enter Lab Results

**Given** prescription status is IN_PROGRESS
**When** BIOLOGIST creates result
**Then** status changes to RESULTS_AVAILABLE (not COMPLETED)

**Test Steps**:
1. Login as BIOLOGIST
2. View IN_PROGRESS prescription
3. Click "Enter Results"
4. Fill result form:
   ```json
   {
     "text": "Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)\nHemoglobin: 14.5 g/dL (normal)\nPlatelet: 250 x10^3/μL (normal)"
   }
   ```
5. Click "Save Results"
6. Verify prescription status changes to RESULTS_AVAILABLE
7. Verify result created with prescriptionId
8. Verify validatedBy is biologist userId
9. Verify validatedAt timestamp
10. Verify result appears in DOCTOR's "Results to Review" queue

**Expected Result**:
- Status: RESULTS_AVAILABLE (NOT COMPLETED)
- Result created
- Biologist ID recorded
- Visible to doctor for review

**Edge Cases**:
- Cannot create result if status is not IN_PROGRESS
- One prescription can have only one result (one-to-one relation)
- Creating duplicate result returns 409 Conflict

---

## Feature: Result Review by Doctor

### AC-023: Result Review Database Fields

**Given** Result model includes reviewedBy, reviewedAt, interpretation
**When** migration runs
**Then** fields are available

**Test Steps**:
1. Check schema
2. Run migration
3. Verify in Prisma Studio

**Expected Result**: All fields nullable

---

### AC-024: Doctor Reviews Result

**Given** prescription status is RESULTS_AVAILABLE
**When** DOCTOR calls /api/results/:id/review
**Then** prescription status changes to COMPLETED

**Test Steps**:
1. Login as DOCTOR
2. Navigate to "Results to Review" section
3. View result with status RESULTS_AVAILABLE
4. Read biologist's result data (read-only)
5. Enter interpretation notes:
   ```
   All blood count values within normal limits.
   No anemia or infection indicated.
   Patient can proceed with allergy testing as planned.
   ```
6. Click "Complete Review"
7. Verify prescription status changes to COMPLETED
8. Verify reviewedBy is doctor userId
9. Verify reviewedAt timestamp
10. Verify interpretation saved
11. Verify result disappears from "Results to Review" queue

**Expected Result**:
- Prescription status: COMPLETED
- Result includes both biologist data and doctor interpretation
- Doctor ID and timestamp recorded

**Edge Cases**:
- Cannot review if status is not RESULTS_AVAILABLE
- Can update interpretation if already reviewed
- Only doctor who created prescription can review (optional business rule)

---

### AC-025: Interpretation Character Limit

**Given** doctor enters interpretation
**When** interpretation exceeds 3000 characters
**Then** validation error appears

**Test Steps**:
1. Login as DOCTOR
2. Open result review form
3. Paste 3001 characters
4. Attempt to save
5. Verify error

**Expected Result**: "Interpretation cannot exceed 3000 characters"

---

## Feature: Administrative Closure & Billing

### AC-026: Billing Database Fields

**Given** Appointment model includes closedBy, closedAt, billingAmount, billingStatus
**When** migration runs
**Then** fields are available

**Test Steps**:
1. Check schema includes:
   - closedBy (String)
   - closedAt (DateTime)
   - billingAmount (Decimal)
   - billingStatus (BillingStatus enum)
2. Run migration
3. Verify in Prisma Studio

**Expected Result**: Fields exist, billingStatus default is PENDING

---

### AC-027: Close Appointment with Billing

**Given** appointment status is CONSULTATION_COMPLETED
**When** SECRETARY calls /api/appointments/:id/close
**Then** status changes to COMPLETED and billing is recorded

**Test Steps**:
1. Login as SECRETARY
2. Navigate to "Appointments to Close" section
3. View CONSULTATION_COMPLETED appointment
4. Click "Close Appointment" button
5. Enter billing amount: 150.00
6. Select payment status: PAID
7. Click "Confirm Closure"
8. Verify status changes to COMPLETED
9. Verify closedBy is secretary userId
10. Verify closedAt timestamp
11. Verify billingAmount is 150.00
12. Verify billingStatus is PAID

**Expected Result**:
- Status: COMPLETED (final state)
- Billing data recorded
- Secretary ID and timestamp recorded

**Edge Cases**:
- Cannot close if status is SCHEDULED, CHECKED_IN, or IN_CONSULTATION
- Can close CONSULTATION_COMPLETED appointments
- Billing amount can be 0
- Billing status defaults to PENDING if not specified

---

### AC-028: Billing Status Options

**Given** secretary is closing appointment
**When** billing form displays
**Then** status options are PENDING, PAID, PARTIALLY_PAID

**Test Steps**:
1. Open close appointment form
2. View billing status dropdown
3. Verify options:
   - PENDING
   - PAID
   - PARTIALLY_PAID

**Expected Result**: All three options available

---

## Feature: Dashboard Navigation

### AC-029: Secretary Dashboard Sections

**Given** SECRETARY user is logged in
**When** dashboard loads
**Then** four main sections are visible

**Test Steps**:
1. Login as SECRETARY
2. View dashboard
3. Verify sections:
   - "Check-In Today" (card or list)
   - "Schedule New Appointment" (quick action)
   - "Patient Registration" (quick action)
   - "Appointments to Close" (card or list)
4. Verify each section has icon and count badge

**Expected Result**: All sections visible, distinct colors, clickable

**Edge Cases**:
- If no pending check-ins, show empty state message
- Count badges update when actions are performed

---

### AC-030: Nurse Dashboard Sections

**Given** NURSE user is logged in
**When** dashboard loads
**Then** two main sections are visible

**Test Steps**:
1. Login as NURSE
2. View dashboard
3. Verify sections:
   - "Patients to Prepare" (CHECKED_IN appointments)
   - "Samples to Collect" (SENT_TO_LAB prescriptions)
4. Verify each section shows count

**Expected Result**: Both sections visible with correct data

**Edge Cases**:
- Empty sections show "No pending tasks" message
- Clicking section navigates to detailed list

---

### AC-031: Doctor Dashboard Sections

**Given** DOCTOR user is logged in
**When** dashboard loads
**Then** four main sections are visible

**Test Steps**:
1. Login as DOCTOR
2. View dashboard
3. Verify sections:
   - "Consultations Ready" (IN_CONSULTATION)
   - "Results to Review" (RESULTS_AVAILABLE)
   - "My Appointments" (all doctor's appointments)
   - "Prescriptions Sent" (tracking lab work)
4. Verify counts are accurate

**Expected Result**: All sections visible with correct counts

---

### AC-032: Biologist Dashboard Sections

**Given** BIOLOGIST user is logged in
**When** dashboard loads
**Then** three main sections are visible

**Test Steps**:
1. Login as BIOLOGIST
2. View dashboard
3. Verify sections:
   - "Samples Received" (SAMPLE_COLLECTED)
   - "In Progress" (IN_PROGRESS)
   - "Completed Today" (count)
4. Verify counts

**Expected Result**: All sections visible

---

## Feature: Workflow State Validation

### AC-033: Invalid State Transition Rejected

**Given** appointment is in SCHEDULED status
**When** attempt to mark as CONSULTATION_COMPLETED (skipping steps)
**Then** 400 error with descriptive message

**Test Steps**:
1. Create appointment with status SCHEDULED
2. Attempt to call PATCH /api/appointments/:id/consultation
3. Verify 400 response
4. Verify error message: "Cannot enter consultation notes: appointment must be in IN_CONSULTATION status"

**Expected Result**: Invalid transitions are blocked

**Invalid Transitions to Test**:
- SCHEDULED → CONSULTATION_COMPLETED (must go through CHECKED_IN, IN_CONSULTATION)
- CREATED prescription → SAMPLE_COLLECTED (must go through SENT_TO_LAB)
- SENT_TO_LAB prescription → RESULTS_AVAILABLE (must go through SAMPLE_COLLECTED, IN_PROGRESS)

---

### AC-034: State Transition Audit Trail

**Given** workflow state changes
**When** transition occurs
**Then** userId and timestamp are recorded

**Test Steps**:
1. Perform complete workflow from SCHEDULED to COMPLETED
2. Check final appointment record in database
3. Verify all transition fields are populated:
   - checkedInAt (secretary check-in)
   - vitalsEnteredBy, vitalsEnteredAt (nurse vitals)
   - consultedBy, consultedAt (doctor consultation)
   - closedBy, closedAt (secretary closure)

**Expected Result**: Complete audit trail of who did what when

---

## Feature: Visual Indicators

### AC-035: Status Color Coding

**Given** appointments and prescriptions are displayed
**When** user views list
**Then** each status has distinct color

**Test Steps**:
1. Create appointments with various statuses
2. View appointments list
3. Verify color scheme:
   - SCHEDULED: Blue
   - CHECKED_IN: Orange
   - IN_CONSULTATION: Purple
   - CONSULTATION_COMPLETED: Teal
   - COMPLETED: Green
   - CANCELLED: Red

**Expected Result**: Colors match specification, consistent across UI

---

### AC-036: Status Icons

**Given** statuses are displayed
**When** user views any list
**Then** appropriate icon appears with status

**Test Steps**:
1. View appointments list
2. Verify icons:
   - SCHEDULED: Schedule icon
   - CHECKED_IN: CheckCircle icon
   - IN_CONSULTATION: LocalHospital icon
   - COMPLETED: CheckCircle icon (green)

**Expected Result**: Icons provide visual cues for status

---

## Feature: Error Handling

### AC-037: Form Validation Messages

**Given** user submits form with missing required fields
**When** validation fails
**Then** inline error messages appear

**Test Steps**:
1. Open patient creation form
2. Leave firstName blank
3. Click "Save"
4. Verify error message under firstName field: "First name is required"
5. Enter firstName
6. Verify error disappears

**Expected Result**: Helpful, field-specific errors

---

### AC-038: Network Error Handling

**Given** backend is unreachable
**When** user attempts action
**Then** user-friendly error message displays

**Test Steps**:
1. Stop backend server
2. Attempt to login
3. Verify error message: "Unable to connect to server. Please try again."
4. Restart backend
5. Retry action
6. Verify success

**Expected Result**: No technical error details shown to user

---

## Complete Workflow Integration Test

### AC-039: End-to-End Patient Journey

**Given** all features are implemented
**When** complete patient journey is executed
**Then** all steps complete without errors

**Test Scenario**:

**Step 1 - Patient Registration (SECRETARY)**:
1. Login as secretary@hospital.com
2. Create patient: Jean Dupont, DOB: 1980-05-15
3. Verify patient created

**Step 2 - Schedule Appointment (SECRETARY)**:
1. Create appointment for Jean Dupont
2. Assign doctor: doctor@hospital.com
3. Date: Tomorrow at 10:00 AM
4. Motif: "Consultation initiale"
5. Verify appointment created with status SCHEDULED

**Step 3 - Check-In (SECRETARY)**:
1. On appointment day, view appointments
2. Click "Check In" for Jean Dupont
3. Verify status: CHECKED_IN

**Step 4 - Vitals Entry (NURSE)**:
1. Logout, login as nurse@hospital.com
2. View "Patients to Prepare"
3. Select Jean Dupont appointment
4. Enter vitals:
   - Weight: 75 kg
   - Height: 180 cm
   - Temperature: 37.0°C
   - BP: 120/80
   - Heart Rate: 70 bpm
5. Add medical history: "No known allergies"
6. Save vitals
7. Verify status: IN_CONSULTATION

**Step 5 - Consultation (DOCTOR)**:
1. Logout, login as doctor@hospital.com
2. View "Consultations Ready"
3. Select Jean Dupont appointment
4. Review vitals (read-only)
5. Enter consultation notes: "Patient in good health. Recommend routine blood work."
6. Complete consultation
7. Verify status: CONSULTATION_COMPLETED

**Step 6 - Prescription (DOCTOR)**:
1. Create prescription: "Complete Blood Count (CBC)"
2. Verify prescription status: CREATED
3. Send prescription to lab
4. Verify status: SENT_TO_LAB

**Step 7 - Sample Collection (NURSE)**:
1. Logout, login as nurse@hospital.com
2. View "Samples to Collect"
3. Select prescription
4. Click "Collect Sample"
5. Verify status: SAMPLE_COLLECTED

**Step 8 - Lab Analysis (BIOLOGIST)**:
1. Logout, login as biologist@hospital.com
2. View "Samples Received"
3. Start analysis
4. Verify status: IN_PROGRESS
5. Enter results: "WBC: 7.2, RBC: 4.8, Hemoglobin: 14.5 - All normal"
6. Save results
7. Verify prescription status: RESULTS_AVAILABLE

**Step 9 - Result Review (DOCTOR)**:
1. Logout, login as doctor@hospital.com
2. View "Results to Review"
3. Read biologist's result
4. Enter interpretation: "All values within normal limits. No action required."
5. Complete review
6. Verify prescription status: COMPLETED

**Step 10 - Administrative Closure (SECRETARY)**:
1. Logout, login as secretary@hospital.com
2. View "Appointments to Close"
3. Select Jean Dupont appointment
4. Enter billing: 150.00 EUR, status: PAID
5. Close appointment
6. Verify appointment status: COMPLETED

**Expected Result**: Complete journey without errors, all statuses transition correctly, all data recorded

---

## Performance Acceptance Criteria

### AC-040: Page Load Performance

**Given** user navigates to any page
**When** page loads
**Then** response time is under 2 seconds

**Test Steps**:
1. Open browser DevTools (Network tab)
2. Navigate to /dashboard
3. Measure load time
4. Repeat for /appointments, /patients, /prescriptions, /results

**Expected Result**: All pages load in < 2 seconds on local network

---

### AC-041: API Response Performance

**Given** user performs any action
**When** API call is made
**Then** response time is under 500ms for 95% of requests

**Test Steps**:
1. Use browser DevTools or Postman
2. Measure API response times:
   - GET /api/appointments
   - GET /api/patients
   - PATCH /api/appointments/:id/check-in
   - POST /api/results
3. Calculate 95th percentile

**Expected Result**: 95th percentile < 500ms

---

## Summary

**Total Acceptance Criteria**: 41
**Coverage**:
- Database schema: 7 criteria
- API endpoints: 15 criteria
- UI functionality: 12 criteria
- Workflow validation: 4 criteria
- Performance: 2 criteria
- End-to-end integration: 1 criterion

**Testing Approach**:
- Manual testing for MVP
- Automated tests recommended for production (out of MVP scope)
- Each criterion includes reproducible test steps
- Edge cases documented for comprehensive coverage

---

**Document Status**: COMPLETE
**Next Step**: Create dashboard navigation wireframes
**Author**: Requirements Analyst
**Last Updated**: 2026-01-04
