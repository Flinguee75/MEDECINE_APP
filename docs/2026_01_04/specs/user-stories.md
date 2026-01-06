# User Stories - Complete Clinical Workflow

**Project**: Hospital Management System
**Date**: 2026-01-04
**Version**: 1.0

---

## Epic 1: Patient Registration & Check-In

### Story: US-001 - Patient Appointment Request (Out of System)
**As a** patient
**I want** to request an appointment with a doctor
**So that** I can receive medical care

**Acceptance Criteria** (EARS format):
- **WHEN** patient calls or visits reception **THEN** secretary can initiate appointment creation
- **IF** patient is new **THEN** secretary creates patient record first
- **IF** patient exists **THEN** secretary searches by name or ID
- **FOR** all appointments **VERIFY** patient information is complete

**Technical Notes**:
- Patient has no direct system access
- Secretary acts as proxy
- Phone/walk-in registration only

**Story Points**: N/A (external process)
**Priority**: Context only

---

### Story: US-002 - Create New Patient Record
**As a** secretary
**I want** to create a new patient record with complete administrative information
**So that** the patient can be scheduled for appointments

**Acceptance Criteria** (EARS format):
- **WHEN** secretary clicks "New Patient" button **THEN** patient creation form opens
- **IF** all required fields are filled **THEN** "Save" button is enabled
- **WHEN** form is submitted **THEN** patient is created with unique ID
- **IF** email or phone already exists **THEN** warning message displays
- **FOR** patient data **VERIFY** firstName, lastName, birthDate, sex, phone are required
- **WHEN** patient is saved **THEN** success message appears and form clears
- **VERIFY** patient appears in patient list immediately

**Technical Notes**:
- POST /api/patients endpoint
- Frontend: PatientsList.tsx with creation dialog
- Required fields enforced by DTO validation
- Consent checkboxes (consentMedicalData, consentContact) default to false

**Story Points**: 3
**Priority**: High

---

### Story: US-003 - Schedule Patient Appointment
**As a** secretary
**I want** to schedule an appointment for a patient with a specific doctor
**So that** the patient receives medical care at a confirmed time

**Acceptance Criteria** (EARS format):
- **WHEN** secretary selects patient and doctor **THEN** available time slots display
- **IF** doctor has conflict **THEN** error message shows "Doctor unavailable at this time"
- **WHEN** appointment is created **THEN** status is automatically set to SCHEDULED
- **FOR** appointment **VERIFY** date, time, patient, doctor, and reason (motif) are required
- **WHEN** appointment is saved **THEN** it appears on secretary and doctor dashboards
- **IF** date is in the past **THEN** validation error prevents creation

**Technical Notes**:
- POST /api/appointments endpoint
- Frontend: AppointmentsList.tsx with creation dialog
- Check doctor availability (optional for MVP, can skip conflict detection)
- Default status: SCHEDULED

**Story Points**: 5
**Priority**: High

---

### Story: US-004 - Check-In Patient on Arrival
**As a** secretary
**I want** to check in patients when they arrive for their appointment
**So that** the clinical staff knows the patient is ready

**Acceptance Criteria** (EARS format):
- **WHEN** secretary views today's appointments **THEN** SCHEDULED appointments show "Check In" button
- **WHEN** "Check In" button is clicked **THEN** appointment status changes to CHECKED_IN
- **IF** appointment is already checked in **THEN** button is disabled
- **WHEN** check-in occurs **THEN** timestamp is recorded (checkedInAt)
- **FOR** CHECKED_IN appointments **VERIFY** visual indicator (color/icon) distinguishes from SCHEDULED
- **WHEN** patient is checked in **THEN** appointment appears in nurse's "Patients to Prepare" queue

**Technical Notes**:
- PATCH /api/appointments/:id/check-in endpoint (new)
- Add checkedInAt field to Appointment model
- Add CHECKED_IN to AppointmentStatus enum
- Frontend: AppointmentsList.tsx - add check-in button
- Only SECRETARY role can check in

**Story Points**: 5
**Priority**: High

---

## Epic 2: Pre-Consultation & Nurse Workflow

### Story: US-005 - Nurse Role Setup
**As a** system administrator
**I want** to create nurse user accounts
**So that** nurses can access the system and perform their duties

**Acceptance Criteria** (EARS format):
- **WHEN** ADMIN creates user **THEN** NURSE is available as role option
- **IF** user role is NURSE **THEN** they see nurse-specific dashboard on login
- **FOR** NURSE users **VERIFY** they can access vitals entry and sample collection features
- **WHEN** seed script runs **THEN** at least one NURSE account exists (nurse@hospital.com)

**Technical Notes**:
- Add NURSE to Role enum in Prisma schema
- Migration to add NURSE value
- Update seed script
- Create NurseDashboard component (similar to DoctorDashboard)

**Story Points**: 3
**Priority**: High

---

### Story: US-006 - Enter Patient Vitals Before Consultation
**As a** nurse
**I want** to enter patient vitals (weight, BP, temperature, etc.)
**So that** the doctor has this information during consultation

**Acceptance Criteria** (EARS format):
- **WHEN** nurse views dashboard **THEN** CHECKED_IN appointments appear in "Patients to Prepare" section
- **WHEN** nurse clicks appointment **THEN** vitals entry form opens
- **IF** all required vitals are entered **THEN** "Save Vitals" button is enabled
- **WHEN** vitals are saved **THEN** appointment status changes to IN_CONSULTATION
- **FOR** vitals **VERIFY** weight, height, temperature, blood pressure, heart rate are required
- **WHEN** vitals are saved **THEN** timestamp and nurse ID are recorded
- **VERIFY** vitals appear on doctor's consultation view

**Required Vitals Fields**:
- Weight (kg)
- Height (cm)
- Temperature (°C)
- Blood Pressure (systolic/diastolic)
- Heart Rate (bpm)
- Respiratory Rate (breaths/min) - optional
- Oxygen Saturation (%) - optional

**Technical Notes**:
- PATCH /api/appointments/:id/vitals endpoint (new)
- Add vitalsEnteredBy, vitalsEnteredAt to Appointment model
- Store vitals in JSON field with structured schema
- Add IN_CONSULTATION to AppointmentStatus enum
- Frontend: VitalsDialog.tsx component (enhance existing or create new)

**Story Points**: 8
**Priority**: High

---

### Story: US-007 - Record Medical History Notes
**As a** nurse
**I want** to record patient's declared medical history
**So that** the doctor has context about allergies, chronic conditions, medications

**Acceptance Criteria** (EARS format):
- **WHEN** nurse enters vitals **THEN** medical history text field is also available
- **IF** patient declares allergies **THEN** nurse can record them in notes
- **WHEN** vitals form is saved **THEN** medical history notes are saved with appointment
- **FOR** medical history **VERIFY** notes are displayed to doctor in consultation view
- **IF** notes exceed 1000 characters **THEN** validation message appears

**Technical Notes**:
- Add medicalHistoryNotes field to Appointment model (TEXT)
- Include in vitals entry form
- Optional field (vitals are required, history notes are optional)
- Display in doctor consultation view (read-only)

**Story Points**: 3
**Priority**: Medium

---

## Epic 3: Medical Consultation

### Story: US-008 - View Pre-Consultation Data
**As a** doctor
**I want** to view patient vitals and medical history entered by the nurse
**So that** I have complete information before examining the patient

**Acceptance Criteria** (EARS format):
- **WHEN** doctor opens appointment **THEN** vitals section displays all measurements
- **IF** vitals are outside normal range **THEN** visual indicator (color/icon) highlights them
- **WHEN** doctor views medical history notes **THEN** all nurse-entered information is visible
- **FOR** vitals display **VERIFY** clear labels and units (kg, cm, °C, mmHg, bpm)
- **IF** vitals have not been entered **THEN** message displays "Waiting for nurse preparation"

**Technical Notes**:
- GET /api/appointments/:id includes vitals and medicalHistoryNotes
- Frontend: AppointmentDetailDrawer.tsx - add vitals section
- Read-only display for doctor (nurse entered data)
- Material-UI Table or Card layout for vitals

**Story Points**: 5
**Priority**: High

---

### Story: US-009 - Conduct Consultation and Record Notes
**As a** doctor
**I want** to record my consultation notes and diagnosis
**So that** there is a record of my medical examination

**Acceptance Criteria** (EARS format):
- **WHEN** doctor views appointment with IN_CONSULTATION status **THEN** consultation notes editor is available
- **IF** consultation notes are entered **THEN** "Complete Consultation" button is enabled
- **WHEN** "Complete Consultation" is clicked **THEN** appointment status changes to CONSULTATION_COMPLETED
- **FOR** consultation notes **VERIFY** they support multi-line text (minimum 2000 characters)
- **WHEN** consultation is completed **THEN** timestamp and doctor ID are recorded

**Technical Notes**:
- PATCH /api/appointments/:id/consultation endpoint (new)
- Add consultationNotes, consultedBy, consultedAt to Appointment model
- Add CONSULTATION_COMPLETED to AppointmentStatus enum
- Frontend: Consultation form in appointment detail view
- TextField with multiline prop, 8+ rows

**Story Points**: 5
**Priority**: High

---

### Story: US-010 - Create Lab Test Prescription
**As a** doctor
**I want** to prescribe lab tests for a patient
**So that** biological analyses can be performed

**Acceptance Criteria** (EARS format):
- **WHEN** doctor is in consultation view **THEN** "Prescribe Lab Tests" button is available
- **WHEN** prescription form opens **THEN** doctor can enter test details
- **IF** prescription text is empty **THEN** "Create Prescription" button is disabled
- **WHEN** prescription is created **THEN** status is automatically set to CREATED
- **FOR** prescription **VERIFY** patient is linked, doctor is linked, text is required
- **WHEN** prescription is saved **THEN** it appears in doctor's prescriptions list

**Technical Notes**:
- POST /api/prescriptions endpoint (existing)
- Frontend: PrescriptionsList.tsx - creation dialog
- Link prescription to current appointment (optional enhancement)
- Default status: CREATED

**Story Points**: 3 (existing functionality, may need UI enhancement)
**Priority**: Medium

---

## Epic 4: Lab Workflow

### Story: US-011 - Send Prescription to Laboratory
**As a** doctor or secretary
**I want** to send a created prescription to the laboratory
**So that** the lab staff knows a test is requested

**Acceptance Criteria** (EARS format):
- **WHEN** doctor views CREATED prescription **THEN** "Send to Lab" button is available
- **WHEN** "Send to Lab" is clicked **THEN** prescription status changes to SENT_TO_LAB
- **IF** prescription is already sent **THEN** button is disabled
- **FOR** SENT_TO_LAB prescriptions **VERIFY** they appear in nurse's "Samples to Collect" queue
- **WHEN** status changes **THEN** timestamp is recorded

**Technical Notes**:
- PATCH /api/prescriptions/:id/send-to-lab endpoint (new)
- Allow DOCTOR and SECRETARY roles
- Validation: only CREATED prescriptions can be sent
- Frontend: PrescriptionsList.tsx - add send button

**Story Points**: 3
**Priority**: High

---

### Story: US-012 - Collect Biological Sample
**As a** nurse
**I want** to collect biological samples from patients
**So that** the lab can perform the requested analyses

**Acceptance Criteria** (EARS format):
- **WHEN** nurse views dashboard **THEN** SENT_TO_LAB prescriptions appear in "Samples to Collect" section
- **WHEN** nurse clicks prescription **THEN** patient and test details are displayed
- **WHEN** "Collect Sample" button is clicked **THEN** prescription status changes to SAMPLE_COLLECTED
- **IF** sample collection notes are entered **THEN** they are saved with the prescription
- **FOR** SAMPLE_COLLECTED prescriptions **VERIFY** they appear in biologist's queue
- **WHEN** sample is collected **THEN** timestamp and nurse ID are recorded

**Technical Notes**:
- PATCH /api/prescriptions/:id/collect-sample endpoint (new)
- Add SAMPLE_COLLECTED to PrescriptionStatus enum
- Add nurseId, sampleCollectedAt to Prescription model
- Add User relation for nurse (similar to doctor relation)
- Frontend: New SampleCollection component on nurse dashboard

**Story Points**: 5
**Priority**: High

---

### Story: US-013 - Start Lab Analysis
**As a** biologist
**I want** to mark a prescription as being analyzed
**So that** the workflow status is accurate

**Acceptance Criteria** (EARS format):
- **WHEN** biologist views SAMPLE_COLLECTED prescriptions **THEN** "Start Analysis" button is available
- **WHEN** "Start Analysis" is clicked **THEN** prescription status changes to IN_PROGRESS
- **IF** prescription is already in progress **THEN** status indicator shows "Analyzing"
- **FOR** IN_PROGRESS prescriptions **VERIFY** they appear in biologist's active work queue
- **WHEN** analysis starts **THEN** timestamp is recorded

**Technical Notes**:
- PATCH /api/prescriptions/:id/start-analysis endpoint (new)
- Add analysisStartedAt to Prescription model
- Validation: only SAMPLE_COLLECTED prescriptions can be started
- Frontend: BiologistDashboard - add analysis queue

**Story Points**: 3
**Priority**: Medium

---

### Story: US-014 - Enter and Validate Lab Results
**As a** biologist
**I want** to enter lab test results and validate them
**So that** doctors can review the findings

**Acceptance Criteria** (EARS format):
- **WHEN** biologist views IN_PROGRESS prescription **THEN** "Enter Results" form is available
- **WHEN** results are entered **THEN** result text and structured data fields are saved
- **IF** results are saved **THEN** prescription status changes to RESULTS_AVAILABLE (not COMPLETED)
- **FOR** results **VERIFY** prescriptionId is linked, text is required
- **WHEN** result is created **THEN** timestamp and biologist ID are recorded
- **VERIFY** result appears in doctor's "Results to Review" queue

**Technical Notes**:
- POST /api/results endpoint (existing, modify behavior)
- Change: creating result sets status to RESULTS_AVAILABLE (not COMPLETED)
- Add RESULTS_AVAILABLE to PrescriptionStatus enum
- Add validatedBy, validatedAt to Result model
- Frontend: ResultsList.tsx - enhance result entry form

**Story Points**: 5
**Priority**: High

---

## Epic 5: Result Review & Closure

### Story: US-015 - Review Lab Results
**As a** doctor
**I want** to review lab results and add my medical interpretation
**So that** the clinical findings are complete

**Acceptance Criteria** (EARS format):
- **WHEN** doctor views dashboard **THEN** RESULTS_AVAILABLE prescriptions appear in "Results to Review" section
- **WHEN** doctor opens result **THEN** biologist's data and text are displayed (read-only)
- **WHEN** doctor enters interpretation notes **THEN** "Complete Review" button is enabled
- **IF** review is completed **THEN** prescription status changes to COMPLETED
- **FOR** result review **VERIFY** interpretation field supports multi-line text
- **WHEN** review is saved **THEN** timestamp and doctor ID are recorded

**Technical Notes**:
- PATCH /api/results/:id/review endpoint (new)
- Add reviewedBy, reviewedAt, interpretation to Result model
- Frontend: Result review component on doctor dashboard
- Display biologist data + doctor interpretation together

**Story Points**: 5
**Priority**: High

---

### Story: US-016 - Administrative Closure and Billing
**As a** secretary
**I want** to close a completed appointment and process billing
**So that** the patient's visit is finalized administratively

**Acceptance Criteria** (EARS format):
- **WHEN** secretary views CONSULTATION_COMPLETED appointments **THEN** "Close Appointment" button is available
- **WHEN** closure form opens **THEN** billing amount field is displayed
- **IF** billing amount is entered **THEN** payment status can be set (PAID, PENDING, PARTIALLY_PAID)
- **WHEN** closure is saved **THEN** appointment status changes to final COMPLETED state
- **FOR** closed appointments **VERIFY** closedBy and closedAt are recorded
- **WHEN** appointment is closed **THEN** it moves to "Completed" section on dashboard

**Technical Notes**:
- PATCH /api/appointments/:id/close endpoint (new)
- Add BillingStatus enum (PENDING, PAID, PARTIALLY_PAID)
- Add closedBy, closedAt, billingAmount, billingStatus to Appointment model
- Validation: only CONSULTATION_COMPLETED appointments can be closed
- Frontend: Billing dialog on secretary dashboard

**Story Points**: 5
**Priority**: Medium

---

## Epic 6: Dashboard Navigation & User Experience

### Story: US-017 - Secretary Dashboard with Workflow Sections
**As a** secretary
**I want** clear sections on my dashboard for each part of my workflow
**So that** I can easily find and complete my tasks

**Acceptance Criteria** (EARS format):
- **WHEN** secretary logs in **THEN** dashboard displays 4 main sections
- **FOR** sections **VERIFY** they include: "Check-In Today", "Schedule New", "Patient Registration", "Appointments to Close"
- **WHEN** section is clicked **THEN** relevant list or form opens
- **IF** section has pending items **THEN** count badge displays number
- **VERIFY** color coding and icons distinguish sections visually

**Dashboard Sections**:
1. Appointments Today - list with check-in buttons
2. Schedule New Appointment - quick action card
3. Patient Registration - quick action card
4. Appointments to Close - list with closure buttons

**Technical Notes**:
- Frontend: Dashboard.tsx - SecretaryDashboard component
- Material-UI Grid layout with Cards
- Badge component for counts
- Icons: Event, PersonAdd, CalendarMonth, CheckCircle

**Story Points**: 5
**Priority**: High

---

### Story: US-018 - Nurse Dashboard with Patient Queue
**As a** nurse
**I want** to see which patients are waiting for vitals and which samples need collection
**So that** I can prioritize my work

**Acceptance Criteria** (EARS format):
- **WHEN** nurse logs in **THEN** dashboard displays 2 main sections
- **FOR** sections **VERIFY** they include: "Patients to Prepare", "Samples to Collect"
- **WHEN** "Patients to Prepare" section is clicked **THEN** CHECKED_IN appointments list appears
- **WHEN** "Samples to Collect" section is clicked **THEN** SENT_TO_LAB prescriptions list appears
- **IF** lists are empty **THEN** helpful message displays "No pending tasks"

**Dashboard Sections**:
1. Patients to Prepare - CHECKED_IN appointments awaiting vitals
2. Samples to Collect - SENT_TO_LAB prescriptions awaiting collection
3. Today's Schedule - overview of all appointments (read-only)

**Technical Notes**:
- Frontend: Dashboard.tsx - create NurseDashboard component (new)
- API calls: GET /api/appointments?status=CHECKED_IN, GET /api/prescriptions?status=SENT_TO_LAB
- Material-UI Table or List components
- Icons: Assignment, Science, Schedule

**Story Points**: 5
**Priority**: High

---

### Story: US-019 - Doctor Dashboard with Review Queue
**As a** doctor
**I want** to see consultations ready for me and results awaiting my review
**So that** I can prioritize my clinical work

**Acceptance Criteria** (EARS format):
- **WHEN** doctor logs in **THEN** dashboard displays 3 main sections
- **FOR** sections **VERIFY** they include: "Consultations Ready", "Results to Review", "My Appointments"
- **WHEN** "Consultations Ready" is clicked **THEN** IN_CONSULTATION appointments list appears
- **WHEN** "Results to Review" is clicked **THEN** RESULTS_AVAILABLE prescriptions list appears
- **IF** result is urgent **THEN** visual indicator highlights it (optional enhancement)

**Dashboard Sections**:
1. Consultations Ready - IN_CONSULTATION appointments with vitals entered
2. Results to Review - RESULTS_AVAILABLE prescriptions awaiting interpretation
3. My Appointments - doctor's full schedule
4. Prescriptions Sent - tracking lab workflow

**Technical Notes**:
- Frontend: Dashboard.tsx - enhance DoctorDashboard component
- API calls: GET /api/appointments?status=IN_CONSULTATION, GET /api/prescriptions?status=RESULTS_AVAILABLE
- QuickActionCard components with navigation
- Icons: LocalHospital, Assignment, CalendarMonth, Medication

**Story Points**: 5
**Priority**: High

---

### Story: US-020 - Biologist Dashboard with Sample Tracking
**As a** biologist
**I want** to see samples received, analyses in progress, and completed today
**So that** I can manage my laboratory workload

**Acceptance Criteria** (EARS format):
- **WHEN** biologist logs in **THEN** dashboard displays 3 main sections
- **FOR** sections **VERIFY** they include: "Samples Received", "In Progress", "Completed Today"
- **WHEN** "Samples Received" is clicked **THEN** SAMPLE_COLLECTED prescriptions list appears
- **WHEN** "In Progress" is clicked **THEN** IN_PROGRESS prescriptions list appears
- **VERIFY** completed count shows number of results validated today

**Dashboard Sections**:
1. Samples Received - SAMPLE_COLLECTED prescriptions awaiting analysis
2. In Progress - IN_PROGRESS prescriptions being analyzed
3. Completed Today - Results created today (count)
4. Result Entry - quick action to enter results

**Technical Notes**:
- Frontend: Dashboard.tsx - enhance BiologistDashboard component
- API calls: GET /api/prescriptions?status=SAMPLE_COLLECTED, GET /api/prescriptions?status=IN_PROGRESS
- StatCard components for counts
- Icons: Science, Pending, CheckCircle

**Story Points**: 5
**Priority**: High

---

### Story: US-021 - Workflow State Visual Indicators
**As a** user of any role
**I want** visual indicators (colors, icons, badges) for workflow states
**So that** I can quickly understand the status of items

**Acceptance Criteria** (EARS format):
- **FOR** appointment statuses **VERIFY** each has distinct color: SCHEDULED (blue), CHECKED_IN (orange), IN_CONSULTATION (purple), COMPLETED (green)
- **FOR** prescription statuses **VERIFY** each has distinct color and icon
- **WHEN** status transitions **THEN** color/icon updates immediately in UI
- **IF** item is overdue or urgent **THEN** red indicator appears (optional)
- **VERIFY** status chips use Material-UI Chip component with consistent styling

**Status Color Scheme**:
- SCHEDULED: Blue (#1976d2)
- CHECKED_IN: Orange (#f57c00)
- IN_CONSULTATION: Purple (#9c27b0)
- CONSULTATION_COMPLETED: Teal (#00897b)
- COMPLETED: Green (#388e3c)
- CANCELLED: Red (#d32f2f)

**Prescription Colors**:
- CREATED: Blue
- SENT_TO_LAB: Orange
- SAMPLE_COLLECTED: Purple
- IN_PROGRESS: Indigo
- RESULTS_AVAILABLE: Yellow
- COMPLETED: Green

**Technical Notes**:
- Frontend: Create utility function getStatusColor(status)
- Use Material-UI Chip component
- Icons from @mui/icons-material
- Consistent application across all list views

**Story Points**: 3
**Priority**: Medium

---

### Story: US-022 - Error Handling and Validation Messages
**As a** user
**I want** clear error messages when I try invalid actions
**So that** I understand what went wrong and how to fix it

**Acceptance Criteria** (EARS format):
- **WHEN** invalid state transition is attempted **THEN** error message explains why
- **IF** required field is missing **THEN** validation message highlights the field
- **WHEN** network error occurs **THEN** user-friendly message displays
- **FOR** all forms **VERIFY** validation occurs before submission
- **WHEN** error message displays **THEN** it disappears after 5 seconds or user action

**Example Error Messages**:
- "Cannot check in: appointment is not in SCHEDULED status"
- "Cannot enter vitals: patient has not been checked in"
- "Cannot review result: you are not the prescribing doctor"
- "Weight is required and must be greater than 0"

**Technical Notes**:
- Backend: Return descriptive error messages in 400/403 responses
- Frontend: Snackbar component for notifications
- Form validation with helpful inline messages
- Try-catch blocks with user-friendly error handling

**Story Points**: 3
**Priority**: Medium

---

## Summary Statistics

**Total Stories**: 22
**Total Story Points**: 91

**By Epic**:
- Epic 1 (Registration & Check-In): 4 stories, 13 points
- Epic 2 (Pre-Consultation & Nurse): 3 stories, 14 points
- Epic 3 (Medical Consultation): 3 stories, 13 points
- Epic 4 (Lab Workflow): 4 stories, 16 points
- Epic 5 (Result Review & Closure): 2 stories, 10 points
- Epic 6 (Dashboard & UX): 6 stories, 25 points

**By Priority**:
- High: 14 stories
- Medium: 8 stories
- Low: 0 stories

**Estimated Timeline**:
- With 1 developer: ~7-9 days
- With 2 developers: ~4-5 days
- Fits within 7-day MVP timeline if focused on High priority stories first

---

## Implementation Order (Recommended)

**Phase 1 - Foundation** (Day 1-2):
1. US-005: Nurse role setup
2. US-002: Patient creation (verify existing)
3. US-003: Appointment scheduling (verify existing)
4. US-004: Check-in workflow

**Phase 2 - Clinical Workflow** (Day 3-4):
5. US-006: Vitals entry
6. US-007: Medical history notes
7. US-008: View pre-consultation data
8. US-009: Consultation notes

**Phase 3 - Lab Workflow** (Day 5-6):
9. US-011: Send to lab
10. US-012: Sample collection
11. US-014: Enter results (modify existing)
12. US-015: Review results

**Phase 4 - Polish & Dashboards** (Day 7):
13. US-017: Secretary dashboard
14. US-018: Nurse dashboard
15. US-019: Doctor dashboard (enhance)
16. US-020: Biologist dashboard (enhance)
17. US-021: Visual indicators

**Optional Enhancements** (if time permits):
- US-007: Medical history
- US-013: Start analysis
- US-016: Billing closure
- US-022: Error handling refinement

---

**Document Status**: COMPLETE
**Next Step**: Create acceptance criteria document with testable scenarios
**Author**: Requirements Analyst
**Last Updated**: 2026-01-04
