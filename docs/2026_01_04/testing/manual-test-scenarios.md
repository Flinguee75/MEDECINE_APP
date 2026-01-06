# Manual Test Scenarios - Clinical Workflow System

**Project**: Hospital Management System
**Date**: 2026-01-04
**Version**: 1.0
**Purpose**: Manual testing guide for QA and stakeholders

---

## Test Environment Setup

### Prerequisites

- Backend running: `http://localhost:3000`
- Frontend running: `http://localhost:5173`
- Test database seeded with test users
- Browser: Chrome 120+ or Firefox 121+

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Secretary | secretary@hospital.com | secretary123 |
| Nurse | nurse@hospital.com | nurse123 |
| Doctor | doctor@hospital.com | doctor123 |
| Biologist | biologist@hospital.com | biologist123 |

---

## Scenario 1: Complete Patient Journey (Happy Path)

**Test ID**: MAN-001
**Priority**: CRITICAL
**Duration**: ~15 minutes
**Objective**: Verify complete workflow from patient registration to billing

### Step 1: Patient Registration (SECRETARY)

1. Login as **secretary@hospital.com** / **secretary123**
2. Navigate to dashboard
3. Click "Create Patient" or navigate to Patients page
4. Fill patient form:
   - First Name: **Jean**
   - Last Name: **Dupont**
   - Birth Date: **1980-05-15**
   - Sex: **Male**
   - Phone: **+33612345678**
   - Address: **123 Rue de la Paix, Paris**
5. Click "Save"

**Expected Result**:
- Success message displayed
- Patient appears in patient list
- Patient ID generated

---

### Step 2: Appointment Creation (SECRETARY)

1. Still logged in as SECRETARY
2. Navigate to Appointments page
3. Click "Create Appointment"
4. Fill appointment form:
   - Patient: **Jean Dupont** (search and select)
   - Doctor: Select any doctor
   - Date: **Tomorrow at 2:00 PM**
   - Motif: **Consultation initiale - allergies**
5. Click "Save"

**Expected Result**:
- Appointment created with status SCHEDULED
- Appears in secretary's dashboard under "Appointments to Check In"

---

### Step 3: Patient Check-In (SECRETARY)

1. On appointment day, refresh dashboard
2. Find appointment in "Appointments to Check In" section
3. Click "Check In" button
4. Confirm check-in

**Expected Result**:
- Appointment status changes to CHECKED_IN
- Timestamp recorded (checkedInAt)
- Appointment disappears from secretary's list
- Appointment appears in nurse's "Patients to Prepare" list

**Screenshot Points**:
- Before check-in (SCHEDULED)
- After check-in (CHECKED_IN)

---

### Step 4: Vitals Entry (NURSE)

1. Logout and login as **nurse@hospital.com** / **nurse123**
2. Navigate to dashboard
3. Find appointment in "Patients to Prepare" section
4. Click on appointment to open vitals form
5. Fill vitals:
   - Weight: **75.5 kg**
   - Height: **175 cm**
   - Temperature: **37.2°C**
   - Blood Pressure: **120/80 mmHg**
   - Heart Rate: **72 bpm**
   - Respiratory Rate: **16 /min**
   - Oxygen Saturation: **98%**
6. Fill medical history notes:
   - **"Patient reports seasonal pollen allergies. No chronic conditions. No current medications."**
7. Click "Save Vitals"

**Expected Result**:
- Vitals saved successfully
- Appointment status changes to IN_CONSULTATION
- Appointment disappears from nurse's list
- Appointment appears in doctor's "Consultations Ready" list

**Validation Points**:
- All vitals are required
- Temperature must be 30-45°C
- BP systolic 50-250, diastolic 30-150
- Heart rate 30-220 bpm

---

### Step 5: Consultation (DOCTOR)

1. Logout and login as **doctor@hospital.com** / **doctor123**
2. Navigate to dashboard
3. Find appointment in "Consultations Ready" section
4. Click on appointment to view details
5. Review vitals (read-only display)
6. Review medical history notes
7. Enter consultation notes:
   ```
   Patient in good health. Vitals within normal range.
   Allergies to pollen noted.
   Recommend complete blood count and allergy panel to investigate further.
   Plan: Lab tests, follow-up in 2 weeks.
   ```
8. Click "Complete Consultation"

**Expected Result**:
- Consultation notes saved
- Appointment status changes to CONSULTATION_COMPLETED
- consultedBy and consultedAt recorded
- Appointment appears in secretary's "Appointments to Close" list

---

### Step 6: Prescription Creation (DOCTOR)

1. Still logged in as DOCTOR
2. From appointment detail page or prescriptions page
3. Click "Create Prescription"
4. Fill prescription:
   - Patient: **Jean Dupont** (auto-selected)
   - Prescription Text:
     ```
     Complete Blood Count (CBC)
     Allergy Panel (IgE specific)
     - Grass pollen
     - Tree pollen
     - Dust mites
     ```
5. Click "Create Prescription"

**Expected Result**:
- Prescription created with status CREATED
- Prescription ID generated
- Prescription visible in prescriptions list

---

### Step 7: Send to Lab (DOCTOR or SECRETARY)

1. Still logged in as DOCTOR (or logout and login as SECRETARY)
2. View prescription details
3. Click "Send to Lab" button
4. Confirm action

**Expected Result**:
- Prescription status changes to SENT_TO_LAB
- Prescription appears in nurse's "Samples to Collect" list

---

### Step 8: Sample Collection (NURSE)

1. Logout and login as **nurse@hospital.com** / **nurse123**
2. Navigate to dashboard
3. Find prescription in "Samples to Collect" section
4. Click "Collect Sample"
5. Optionally add notes: **"Blood sample collected at 14:30. Stored in refrigerator B2."**
6. Confirm collection

**Expected Result**:
- sampleCollectedAt timestamp recorded
- nurseId recorded
- Collection notes saved
- Prescription appears in biologist's "Samples Received" list

**Validation Points**:
- Can only collect if status is SENT_TO_LAB
- Only NURSE role can collect

---

### Step 9: Lab Analysis (BIOLOGIST)

1. Logout and login as **biologist@hospital.com** / **biologist123**
2. Navigate to dashboard
3. Find prescription in "Samples Received" section
4. Click "Start Analysis"
5. Confirm start

**Expected Result**:
- Prescription status changes to IN_PROGRESS
- analysisStartedAt timestamp recorded
- Prescription moves to "In Progress" section

---

### Step 10: Results Entry (BIOLOGIST)

1. Still logged in as BIOLOGIST
2. View prescription in "In Progress" section
3. Click "Enter Results"
4. Fill results form:
   ```
   Complete Blood Count:
   - WBC: 7.2 x10^3/μL (normal range: 4.5-11.0)
   - RBC: 4.8 x10^6/μL (normal range: 4.5-5.5)
   - Hemoglobin: 14.5 g/dL (normal range: 13.5-17.5)
   - Hematocrit: 42% (normal range: 40-50%)
   - Platelets: 250 x10^3/μL (normal range: 150-400)

   Allergy Panel (IgE):
   - Total IgE: 85 IU/mL (slightly elevated)
   - Grass pollen: Positive (Class 3)
   - Tree pollen: Positive (Class 2)
   - Dust mites: Negative
   ```
5. Click "Save Results"

**Expected Result**:
- Result created successfully
- Prescription status changes to RESULTS_AVAILABLE
- validatedBy and validatedAt recorded
- Result appears in doctor's "Results to Review" list

---

### Step 11: Result Review (DOCTOR)

1. Logout and login as **doctor@hospital.com** / **doctor123**
2. Navigate to dashboard
3. Find result in "Results to Review" section
4. Click on result to view
5. Review biologist's findings (read-only)
6. Enter interpretation:
   ```
   All blood count values within normal limits. No anemia or infection indicated.
   Elevated IgE confirms seasonal allergies to grass and tree pollen.
   ```
7. Enter recommendations:
   ```
   Recommend antihistamine therapy during allergy season.
   Avoid outdoor activities during high pollen count days.
   Follow-up in 6 months.
   ```
8. Click "Complete Review"

**Expected Result**:
- Interpretation and recommendations saved
- reviewedBy and reviewedAt recorded
- Prescription status changes to COMPLETED
- Result no longer appears in "Results to Review"

---

### Step 12: Appointment Closure (SECRETARY)

1. Logout and login as **secretary@hospital.com** / **secretary123**
2. Navigate to dashboard
3. Find appointment in "Appointments to Close" section
4. Click "Close Appointment"
5. Fill billing information:
   - Billing Amount: **150.00 EUR**
   - Billing Status: **PAID**
6. Click "Confirm Closure"

**Expected Result**:
- Appointment status changes to COMPLETED
- closedBy and closedAt recorded
- Billing information saved
- Appointment moves to completed appointments list

---

**END OF HAPPY PATH - ALL STEPS COMPLETED SUCCESSFULLY**

---

## Scenario 2: Role-Based Access Control Validation

**Test ID**: MAN-002
**Priority**: CRITICAL
**Duration**: ~10 minutes
**Objective**: Verify users can only perform actions authorized for their role

### Test 2.1: NURSE Cannot Check In Patient

1. Login as **nurse@hospital.com**
2. Create a SCHEDULED appointment (as admin, or ask secretary)
3. Attempt to check in appointment via:
   - Dashboard button (should be hidden)
   - Direct API call (if testing backend directly)

**Expected Result**: 403 Forbidden error or button not visible

---

### Test 2.2: SECRETARY Cannot Enter Vitals

1. Login as **secretary@hospital.com**
2. Create a CHECKED_IN appointment
3. Attempt to enter vitals

**Expected Result**: Vitals entry form not accessible, or 403 error

---

### Test 2.3: DOCTOR Cannot Collect Samples

1. Login as **doctor@hospital.com**
2. Create prescription with status SENT_TO_LAB
3. Attempt to collect sample

**Expected Result**: Collect button not visible or 403 error

---

### Test 2.4: NURSE Cannot Create Results

1. Login as **nurse@hospital.com**
2. Navigate to results page
3. Attempt to create result

**Expected Result**: Create button not visible or 403 error

---

## Scenario 3: Invalid State Transitions

**Test ID**: MAN-003
**Priority**: HIGH
**Duration**: ~5 minutes
**Objective**: Verify workflow state transitions are enforced

### Test 3.1: Cannot Complete Consultation Before Check-In

1. Login as **doctor@hospital.com**
2. Create SCHEDULED appointment
3. Attempt to complete consultation directly

**Expected Result**: Error message "Appointment must be in IN_CONSULTATION status"

---

### Test 3.2: Cannot Collect Sample Before Sending to Lab

1. Login as **nurse@hospital.com**
2. Create prescription with status CREATED
3. Attempt to collect sample

**Expected Result**: Error message "Prescription must be SENT_TO_LAB"

---

### Test 3.3: Cannot Review Results Before Validation

1. Create prescription with status IN_PROGRESS
2. Login as **doctor@hospital.com**
3. Attempt to review results

**Expected Result**: Error message "Results must be available for review"

---

## Scenario 4: Data Validation

**Test ID**: MAN-004
**Priority**: MEDIUM
**Duration**: ~10 minutes
**Objective**: Verify input validation works correctly

### Test 4.1: Invalid Vitals

1. Login as **nurse@hospital.com**
2. Open vitals entry form
3. Test invalid inputs:

**Test Case 4.1a: Negative Weight**
- Weight: **-5 kg**
- Expected: Validation error "Weight must be positive"

**Test Case 4.1b: Extreme Temperature**
- Temperature: **50°C**
- Expected: Validation error "Temperature must be between 30-45°C"

**Test Case 4.1c: Invalid Blood Pressure**
- Systolic: **300 mmHg**
- Expected: Validation error "Systolic must be between 50-250"

**Test Case 4.1d: Missing Required Field**
- Leave Heart Rate empty
- Expected: Validation error "Heart Rate is required"

---

### Test 4.2: Consultation Notes Length

1. Login as **doctor@hospital.com**
2. Open consultation form
3. Enter very short notes (< 10 characters): **"OK"**
4. Expected: Validation error "Consultation notes must be at least 10 characters"
5. Enter very long notes (> 5000 characters)
6. Expected: Validation error "Maximum 5000 characters"

---

## Scenario 5: UI/UX Validation

**Test ID**: MAN-005
**Priority**: MEDIUM
**Duration**: ~15 minutes
**Objective**: Verify UI displays correctly and is user-friendly

### Test 5.1: Dashboard Sections

**For Each Role, Verify:**

**SECRETARY Dashboard:**
- [ ] "Appointments to Check In" section visible
- [ ] "Appointments to Close" section visible
- [ ] "Create Patient" quick action visible
- [ ] "Schedule Appointment" quick action visible
- [ ] Counts are accurate

**NURSE Dashboard:**
- [ ] "Patients to Prepare" section visible
- [ ] "Samples to Collect" section visible
- [ ] Statistics cards showing counts
- [ ] Empty state message when no tasks

**DOCTOR Dashboard:**
- [ ] "Consultations Ready" section visible
- [ ] "Results to Review" section visible
- [ ] "My Appointments" section visible
- [ ] "Prescriptions Sent" tracking visible

**BIOLOGIST Dashboard:**
- [ ] "Samples Received" section visible
- [ ] "In Progress" section visible
- [ ] "Completed Today" count visible

---

### Test 5.2: Status Color Coding

Verify status colors are consistent:

| Status | Expected Color |
|--------|---------------|
| SCHEDULED | Blue |
| CHECKED_IN | Orange |
| IN_CONSULTATION | Purple |
| CONSULTATION_COMPLETED | Teal |
| COMPLETED | Green |
| CANCELLED | Red |

---

### Test 5.3: Empty States

1. Login with each role
2. Ensure no pending tasks
3. Verify empty state messages display:
   - Icon
   - Message: "No pending tasks" or similar
   - Call to action (if applicable)

---

## Scenario 6: Error Handling

**Test ID**: MAN-006
**Priority**: MEDIUM
**Duration**: ~10 minutes
**Objective**: Verify errors are handled gracefully

### Test 6.1: Network Error

1. Stop backend server
2. Attempt to login
3. Expected: User-friendly error message "Unable to connect to server"

---

### Test 6.2: Session Timeout

1. Login
2. Wait for session timeout (24 hours, or modify for testing)
3. Attempt action
4. Expected: Redirect to login page

---

### Test 6.3: Validation Error Display

1. Submit form with invalid data
2. Expected:
   - Inline error messages under each field
   - Error messages are specific and helpful
   - Form does not submit

---

## Scenario 7: Performance Testing

**Test ID**: MAN-007
**Priority**: LOW (for MVP)
**Duration**: ~5 minutes
**Objective**: Verify system responds quickly

### Test 7.1: Page Load Times

Use browser DevTools (Network tab):

| Page | Target | Pass/Fail |
|------|--------|-----------|
| Dashboard | < 2s | ___ |
| Appointments List | < 1s | ___ |
| Patient Detail | < 1s | ___ |
| Create Appointment Form | < 0.5s | ___ |

---

### Test 7.2: API Response Times

Use browser DevTools (Network tab):

| API Call | Target | Pass/Fail |
|----------|--------|-----------|
| GET /appointments | < 500ms | ___ |
| PATCH /appointments/:id/check-in | < 300ms | ___ |
| POST /prescriptions | < 300ms | ___ |

---

## Test Execution Checklist

### Before Testing

- [ ] Backend running and healthy
- [ ] Frontend running and accessible
- [ ] Test database seeded
- [ ] Test accounts working
- [ ] Browser DevTools open (for debugging)

### During Testing

- [ ] Note any unexpected behavior
- [ ] Screenshot any errors
- [ ] Record API response times
- [ ] Check browser console for errors
- [ ] Verify database changes in Prisma Studio

### After Testing

- [ ] Document all issues found
- [ ] Categorize by severity
- [ ] Create bug reports
- [ ] Update test scenarios if needed

---

## Bug Report Template

```
Bug ID: BUG-XXX
Test Scenario: MAN-XXX
Severity: Critical | High | Medium | Low

Title: [Brief description]

Steps to Reproduce:
1.
2.
3.

Expected Result:


Actual Result:


Environment:
- Browser:
- Role:
- Date/Time:

Screenshots:
[Attach]

Additional Notes:
```

---

## Appendix: Quick Reference

### Keyboard Shortcuts

- `Ctrl+Shift+I` or `F12`: Open DevTools
- `Ctrl+Shift+C`: Inspect element
- `F5`: Refresh page
- `Ctrl+Shift+R`: Hard refresh (clear cache)

### Browser Console

- Check for errors: Look for red messages
- Check network calls: Network tab
- Check response times: Network tab timing

### Database Verification

```bash
# Open Prisma Studio
cd backend
npx prisma studio

# Check appointment status
# Navigate to Appointment table
# Find record by ID
# Verify status and timestamps
```

---

**Document Status**: COMPLETE
**Next Steps**: Execute manual tests, report issues
**Author**: Testing Specialist (spec-tester)
**Last Updated**: 2026-01-04
