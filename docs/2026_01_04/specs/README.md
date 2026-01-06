# Complete Clinical Workflow - Requirements Documentation

**Date**: 2026-01-04
**Project**: Hospital Management System MVP
**Quality Threshold**: 75%

---

## Overview

This directory contains comprehensive requirements documentation for implementing the complete 11-step clinical patient workflow based on the official specification. The current system implements a partial workflow (Appointment → Consultation → Prescription) and needs to be extended to support the full clinical process.

---

## Documentation Structure

### 1. requirements.md
**Comprehensive Requirements Specification**

**Contains**:
- Executive summary and stakeholder analysis
- 10 detailed functional requirements (FR-001 to FR-010)
- 5 non-functional requirements (NFR-001 to NFR-005)
- Database schema changes and migrations
- Technical constraints and assumptions
- Out-of-scope items
- Success criteria

**Key Requirements**:
- FR-001: NURSE role implementation
- FR-002: Appointment check-in workflow
- FR-003: Pre-consultation data entry (vitals & medical history)
- FR-004: Enhanced consultation workflow
- FR-005: Extended prescription status workflow
- FR-006: Sample collection by nurse
- FR-007: Lab result validation and review
- FR-008: Administrative closure and billing
- FR-009: Dashboard navigation and role-based UI
- FR-010: Workflow state validation

**Read this first** to understand the complete scope and technical approach.

---

### 2. user-stories.md
**User Stories with Acceptance Criteria**

**Contains**:
- 22 user stories organized into 6 epics
- EARS format acceptance criteria (Given-When-Then)
- Story points estimation (total: 91 points)
- Priority levels (High/Medium)
- Technical implementation notes
- Recommended implementation order

**Epics**:
1. Patient Registration & Check-In (4 stories, 13 points)
2. Pre-Consultation & Nurse Workflow (3 stories, 14 points)
3. Medical Consultation (3 stories, 13 points)
4. Lab Workflow (4 stories, 16 points)
5. Result Review & Closure (2 stories, 10 points)
6. Dashboard Navigation & UX (6 stories, 25 points)

**Use this** for sprint planning and development task breakdown.

---

### 3. acceptance-criteria.md
**Detailed Testable Acceptance Criteria**

**Contains**:
- 41 detailed acceptance criteria (AC-001 to AC-041)
- Step-by-step test procedures
- Test data examples
- Expected results for validation
- Edge cases and error scenarios
- Complete end-to-end integration test (AC-039)
- Performance criteria (AC-040, AC-041)

**Coverage**:
- Database schema validation (7 criteria)
- API endpoint authorization and behavior (15 criteria)
- UI functionality and user interactions (12 criteria)
- Workflow state validation (4 criteria)
- Performance benchmarks (2 criteria)
- End-to-end integration (1 criterion)

**Use this** for quality assurance testing and validation.

---

### 4. dashboard-navigation.md
**Dashboard UI Design Specification**

**Contains**:
- Role-specific dashboard layouts (SECRETARY, NURSE, DOCTOR, BIOLOGIST)
- Material-UI component specifications
- Color scheme and visual design
- Reusable component definitions (StatCard, QuickActionCard, StatusChip)
- Dialog and form layouts
- Empty state patterns
- Navigation flow diagrams
- Implementation checklist

**Features**:
- ASCII art layout mockups
- TypeScript code examples for each component
- Responsive grid specifications
- Accessibility considerations
- Visual hierarchy guidelines

**Use this** for frontend development and UI implementation.

---

## Quick Reference

### Roles & Responsibilities

| Role | Current Status | New Capabilities Needed |
|------|----------------|------------------------|
| **SECRETARY** | Exists | Check-in, Administrative closure & billing |
| **NURSE** | MISSING | Vitals entry, Sample collection |
| **DOCTOR** | Exists | View vitals, Result interpretation |
| **BIOLOGIST** | Exists | Result validation workflow |
| **ADMIN** | Exists | No changes required |

### Workflow State Transitions

**Appointment States**:
```
SCHEDULED → CHECKED_IN → IN_CONSULTATION → CONSULTATION_COMPLETED → COMPLETED
```

**Prescription States**:
```
CREATED → SENT_TO_LAB → SAMPLE_COLLECTED → IN_PROGRESS → RESULTS_AVAILABLE → COMPLETED
```

### Database Changes Required

**7 Migrations**:
1. Add NURSE to Role enum
2. Extend Appointment model (8 new fields)
3. Extend AppointmentStatus enum (3 new values)
4. Extend Prescription model (4 new fields)
5. Extend PrescriptionStatus enum (2 new values)
6. Extend Result model (5 new fields)
7. Create BillingStatus enum

**Total New Fields**: 17 database fields across 3 models

### API Endpoints Required

**New Endpoints** (8):
- PATCH /api/appointments/:id/check-in
- PATCH /api/appointments/:id/vitals
- PATCH /api/appointments/:id/consultation
- PATCH /api/appointments/:id/close
- PATCH /api/prescriptions/:id/send-to-lab
- PATCH /api/prescriptions/:id/collect-sample
- PATCH /api/prescriptions/:id/start-analysis
- PATCH /api/results/:id/review

**Modified Endpoints** (1):
- POST /api/results (change: sets RESULTS_AVAILABLE instead of COMPLETED)

### Frontend Components Required

**New Components** (7):
- NurseDashboard.tsx
- VitalsDialog.tsx (enhanced)
- SampleCollectionList.tsx
- ResultReviewDialog.tsx
- ClosureDialog.tsx
- ConsultationDrawer.tsx
- ResultEntryDialog.tsx

**Modified Components** (7):
- Dashboard.tsx (add NURSE case)
- SecretaryDashboard.tsx (check-in, closure sections)
- DoctorDashboard.tsx (consultations ready, results to review)
- BiologistDashboard.tsx (samples received, in progress)
- AppointmentsList.tsx (check-in button)
- PrescriptionsList.tsx (workflow buttons)
- ResultsList.tsx (review button)

---

## Implementation Roadmap

### Phase 1: Foundation (Day 1-2)
**Focus**: Database schema, NURSE role, basic API endpoints

**Tasks**:
- Create Prisma migrations (all 7 migrations)
- Add NURSE user to seed script
- Implement NURSE authentication
- Create basic NurseDashboard component

**Deliverable**: NURSE can login and see empty dashboard

**Reference**: requirements.md FR-001, user-stories.md US-005

---

### Phase 2: Check-In & Pre-Consultation (Day 3)
**Focus**: Secretary check-in, Nurse vitals entry

**Tasks**:
- Implement check-in endpoint and UI (SECRETARY)
- Implement vitals entry endpoint and dialog (NURSE)
- Add status transitions SCHEDULED → CHECKED_IN → IN_CONSULTATION
- Test check-in → vitals workflow

**Deliverable**: Patient can be checked in and vitals entered

**Reference**: user-stories.md US-004, US-006, US-007

---

### Phase 3: Consultation Workflow (Day 4)
**Focus**: Doctor consultation with vitals visibility

**Tasks**:
- Implement consultation endpoint
- Create consultation drawer with vitals display (read-only)
- Add consultation notes entry
- Status transition IN_CONSULTATION → CONSULTATION_COMPLETED

**Deliverable**: Doctor can conduct consultation with vitals

**Reference**: user-stories.md US-008, US-009

---

### Phase 4: Lab Workflow (Day 5-6)
**Focus**: Complete prescription → result → review cycle

**Tasks**:
- Implement send-to-lab endpoint (DOCTOR/SECRETARY)
- Implement sample collection endpoint and UI (NURSE)
- Implement start-analysis endpoint (BIOLOGIST)
- Modify result creation to set RESULTS_AVAILABLE
- Implement result review endpoint and UI (DOCTOR)
- Test complete lab workflow

**Deliverable**: Complete lab test cycle from prescription to review

**Reference**: user-stories.md US-011 to US-015

---

### Phase 5: Closure & Dashboards (Day 7)
**Focus**: Administrative closure, dashboard polish

**Tasks**:
- Implement closure endpoint and billing dialog (SECRETARY)
- Enhance all dashboards with workflow sections
- Add StatCard, QuickActionCard components
- Add empty states
- Visual polish: colors, icons, badges
- End-to-end testing

**Deliverable**: Complete polished system ready for demo

**Reference**: user-stories.md US-016 to US-022, dashboard-navigation.md

---

## Testing Strategy

### Unit Testing (Optional for MVP)
- Backend service methods
- DTO validation
- State transition logic

### Integration Testing (Manual)
**Use**: acceptance-criteria.md AC-001 to AC-038

**Key Tests**:
- AC-006: Check-in authorization
- AC-010: Vitals authorization
- AC-012: Vitals entry status transition
- AC-016: Consultation status transition
- AC-022: Result creation sets RESULTS_AVAILABLE
- AC-024: Doctor review completes workflow
- AC-033: Invalid state transitions rejected

### End-to-End Testing (Manual)
**Use**: acceptance-criteria.md AC-039

**Complete Patient Journey**:
1. Secretary creates patient and appointment
2. Secretary checks in patient (SCHEDULED → CHECKED_IN)
3. Nurse enters vitals (CHECKED_IN → IN_CONSULTATION)
4. Doctor conducts consultation (IN_CONSULTATION → CONSULTATION_COMPLETED)
5. Doctor creates and sends prescription (CREATED → SENT_TO_LAB)
6. Nurse collects sample (SENT_TO_LAB → SAMPLE_COLLECTED)
7. Biologist starts analysis (SAMPLE_COLLECTED → IN_PROGRESS)
8. Biologist enters results (IN_PROGRESS → RESULTS_AVAILABLE)
9. Doctor reviews results (RESULTS_AVAILABLE → COMPLETED)
10. Secretary closes appointment and processes billing (CONSULTATION_COMPLETED → COMPLETED)

**Expected**: All transitions succeed, data recorded correctly, no errors

---

## Success Criteria

The implementation will be considered successful when:

1. **Completeness**: All 10 functional requirements implemented
2. **Workflow**: Complete 11-step clinical workflow functional
3. **Roles**: All 5 roles have operational dashboards
4. **Testing**: End-to-end test (AC-039) passes without errors
5. **Performance**: Meets NFR-001 targets (page load < 2s, API < 500ms)
6. **Usability**: Clear navigation, no hidden functionality
7. **Data Integrity**: All workflow transitions recorded with timestamps and user IDs

**Quality Threshold**: 75% (acceptable for MVP)

---

## Key Decisions & Constraints

### Technical Decisions
- **Session-based authentication**: No JWT (existing constraint)
- **Prisma v6.x**: Avoid v7 due to configuration changes
- **Material-UI**: Exclusive UI framework
- **Desktop-only**: No mobile responsive design (min-width: 1024px)

### Simplifications for MVP
- No email/SMS notifications
- No real-time updates (WebSocket)
- No document uploads
- No advanced calendar views
- No data export
- Simple flat-rate billing (no insurance integration)

### Out of Scope
See requirements.md section "Out of Scope" for complete list.

---

## File Sizes & Complexity

| Document | Lines | Size | Complexity |
|----------|-------|------|------------|
| requirements.md | ~750 | ~50 KB | High - Technical specification |
| user-stories.md | ~850 | ~55 KB | Medium - User-centric |
| acceptance-criteria.md | ~950 | ~60 KB | High - Detailed test cases |
| dashboard-navigation.md | ~1400 | ~95 KB | Very High - UI implementation |
| **TOTAL** | **~3950** | **~260 KB** | Comprehensive coverage |

---

## Dependencies Between Documents

```
requirements.md (Foundation)
    ├── Defines WHAT needs to be built
    ├── Technical constraints
    └── Database schema changes

user-stories.md (User Perspective)
    ├── Derives from requirements.md
    ├── Defines WHO does WHAT and WHY
    └── Acceptance criteria in EARS format

acceptance-criteria.md (Testing)
    ├── Derives from user-stories.md
    ├── Defines HOW to test each feature
    └── Provides test data and expected results

dashboard-navigation.md (Implementation)
    ├── Derives from requirements.md FR-009
    ├── References user-stories.md US-017 to US-021
    └── Provides code-level UI specifications
```

**Reading Order**:
1. Start with **requirements.md** (understand scope)
2. Read **user-stories.md** (understand user needs)
3. Reference **acceptance-criteria.md** (understand validation)
4. Use **dashboard-navigation.md** (implement UI)

---

## Contact & Questions

For clarifications on requirements:
- Technical architecture: See ARCHITECTURE.md (project root)
- API specifications: See API.md (project root)
- Current database schema: backend/prisma/schema.prisma
- Existing dashboards: frontend/src/pages/Dashboard/Dashboard.tsx

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial comprehensive requirements documentation |

---

## Next Steps

1. **Review with Team**: Discuss requirements and approach
2. **Technical Planning**: Estimate effort, assign tasks
3. **Database Setup**: Create and run migrations
4. **Backend Development**: Implement API endpoints
5. **Frontend Development**: Build dashboards and dialogs
6. **Testing**: Execute acceptance criteria
7. **Demo Preparation**: Prepare end-to-end demonstration

---

**Status**: COMPLETE ✓
**Ready for**: Development kickoff
**Quality Level**: Production-ready requirements (75% threshold appropriate for MVP)
