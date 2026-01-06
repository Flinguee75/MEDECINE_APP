# Test Plan - Clinical Workflow System

**Project**: Hospital Management System - Complete Clinical Workflow
**Date**: 2026-01-04
**Version**: 1.0
**Testing Specialist**: spec-tester
**Target Coverage**: 70% for MVP

---

## Executive Summary

This test plan defines the testing strategy for the clinical workflow implementation. The goal is to ensure all 11 workflow steps function correctly with proper role-based access control, state transitions, and data integrity.

### Testing Scope

- **Backend Unit Tests**: Service layer methods for appointments, prescriptions, and results
- **Backend Integration Tests**: Complete workflow from appointment to billing
- **Frontend Component Tests**: Reusable UI components
- **Frontend Service Tests**: API service layer
- **Manual Testing**: Role-specific dashboards and user workflows

### Test Coverage Goals

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Backend Services | 60% | HIGH |
| Backend Controllers | 50% | MEDIUM |
| Frontend Components | 50% | MEDIUM |
| Frontend Services | 60% | HIGH |
| Integration Tests | Key workflows | HIGH |

---

## Test Strategy

### 1. Unit Testing

**Objective**: Test individual functions and methods in isolation

**Frameworks**:
- Backend: Jest (NestJS default)
- Frontend: Vitest + React Testing Library

**Approach**:
- Mock all external dependencies (PrismaService, axios)
- Test both success and error paths
- Validate state transitions
- Test edge cases and boundary conditions

**Coverage Areas**:
- Service methods (checkIn, enterVitals, completeConsultation, etc.)
- DTO validation
- Error handling
- State transition logic

### 2. Integration Testing

**Objective**: Test complete workflows end-to-end

**Framework**: Jest + Supertest

**Approach**:
- Use test database (separate from development)
- Create test fixtures for users and data
- Test complete patient journey (11 steps)
- Verify role-based access control
- Test invalid state transitions

**Coverage Areas**:
- Complete clinical workflow (appointment → billing)
- Cross-module interactions
- Database transactions
- Session management

### 3. Component Testing

**Objective**: Test React components in isolation

**Framework**: Vitest + React Testing Library

**Approach**:
- Render components with test props
- Simulate user interactions
- Verify DOM output
- Test conditional rendering

**Coverage Areas**:
- StatCard, QuickActionCard, StatusChip
- Dashboard components
- Form components
- Error boundaries (if implemented)

### 4. API Service Testing

**Objective**: Test frontend API service layer

**Framework**: Vitest + Mocked axios

**Approach**:
- Mock HTTP responses
- Test request formatting
- Verify error handling
- Test response parsing

**Coverage Areas**:
- appointmentsService (checkIn, enterVitals, etc.)
- prescriptionsService (sendToLab, collectSample, etc.)
- resultsService (create, review)

---

## Test Execution Instructions

### Backend Tests

#### Running Unit Tests

```bash
# Navigate to backend directory
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- appointments.service.spec.ts

# Run tests with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

#### Running Integration Tests

```bash
# Ensure test database is running
# Make sure DATABASE_URL points to test database

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- workflow.e2e-spec.ts
```

**Important**: Integration tests require:
- PostgreSQL test database running
- Test database migrations applied
- Separate database from development

### Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Run all tests
npm test

# Run specific test file
npm test -- StatCard.test.tsx

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Database Setup

```bash
# Create test database
psql -U postgres
CREATE DATABASE hospital_mvp_test;

# Set environment variable
export DATABASE_URL="postgresql://hospital_user:hospital_password@localhost:5432/hospital_mvp_test"

# Run migrations
cd backend
npx prisma migrate deploy

# Seed test data (optional)
npx prisma db seed
```

---

## Test Files Structure

### Backend Tests

```
backend/
├── src/
│   ├── appointments/
│   │   └── appointments.service.spec.ts        [Unit tests for appointments]
│   ├── prescriptions/
│   │   └── prescriptions.service.spec.ts       [Unit tests for prescriptions]
│   └── results/
│       └── results.service.spec.ts             [Unit tests for results]
├── test/
│   ├── workflow.e2e-spec.ts                    [Integration test - complete workflow]
│   └── fixtures/
│       ├── users.fixture.ts                    [Test user data]
│       ├── appointments.fixture.ts             [Test appointment data]
│       ├── prescriptions.fixture.ts            [Test prescription data]
│       └── vitals.fixture.ts                   [Test vitals data]
```

### Frontend Tests

```
frontend/
└── src/
    ├── components/
    │   └── __tests__/
    │       ├── StatCard.test.tsx               [StatCard component tests]
    │       ├── QuickActionCard.test.tsx        [QuickActionCard tests]
    │       └── StatusChip.test.tsx             [StatusChip tests]
    └── services/
        └── __tests__/
            ├── appointmentsService.test.ts     [Appointments API tests]
            ├── prescriptionsService.test.ts    [Prescriptions API tests]
            └── resultsService.test.ts          [Results API tests]
```

---

## Test Scenarios

### Critical Path: Complete Workflow

**Test ID**: E2E-001
**Priority**: HIGH
**File**: `backend/test/workflow.e2e-spec.ts`

**Steps**:
1. Secretary creates patient
2. Secretary creates appointment
3. Secretary checks in patient
4. Nurse enters vitals
5. Doctor completes consultation
6. Doctor creates prescription
7. Doctor/Secretary sends to lab
8. Nurse collects sample
9. Biologist starts analysis
10. Biologist creates results
11. Doctor reviews results
12. Secretary closes appointment

**Expected Result**: All steps complete without errors, status transitions correctly

### Role-Based Access Control

**Test ID**: RBAC-001 to RBAC-010
**Priority**: HIGH
**File**: `backend/test/workflow.e2e-spec.ts`

**Scenarios**:
- NURSE cannot check in patient (403 error)
- SECRETARY cannot enter vitals (403 error)
- DOCTOR cannot collect samples (403 error)
- NURSE cannot create results (403 error)
- BIOLOGIST cannot complete consultation (403 error)
- SECRETARY cannot review results (403 error)

**Expected Result**: All unauthorized actions return 403 Forbidden

### Invalid State Transitions

**Test ID**: STATE-001 to STATE-005
**Priority**: HIGH
**File**: `backend/test/workflow.e2e-spec.ts`

**Scenarios**:
- Cannot complete consultation before check-in
- Cannot collect sample before sending to lab
- Cannot review results before validation
- Cannot close appointment before consultation completion
- Cannot start analysis before sample collection

**Expected Result**: All invalid transitions return 400 Bad Request

---

## Manual Test Scenarios

### Secretary Dashboard

**Scenario**: Check-in workflow
**Prerequisites**: Logged in as SECRETARY
**Steps**:
1. Navigate to dashboard
2. View "Appointments to Check In" section
3. Click "Check In" button for scheduled appointment
4. Verify appointment moves to "Checked In" status
5. Verify appointment disappears from check-in list

**Expected Result**: Appointment status updates, UI reflects change immediately

### Nurse Dashboard

**Scenario**: Vitals entry workflow
**Prerequisites**: Logged in as NURSE, appointment checked in
**Steps**:
1. Navigate to "Patients to Prepare" section
2. Select appointment
3. Fill vitals form (weight, height, temperature, BP, heart rate)
4. Add medical history notes
5. Click "Save Vitals"
6. Verify appointment moves to "In Consultation"

**Expected Result**: Vitals saved, status transitions, appointment visible to doctor

### Doctor Dashboard

**Scenario**: Consultation and result review
**Prerequisites**: Logged in as DOCTOR
**Steps**:
1. View "Consultations Ready" section
2. Select appointment with vitals
3. Review vitals (read-only)
4. Enter consultation notes
5. Click "Complete Consultation"
6. Create prescription
7. Later: Review lab results when available
8. Enter interpretation and recommendations

**Expected Result**: Consultation completed, prescription created, results reviewed

### Biologist Dashboard

**Scenario**: Lab analysis workflow
**Prerequisites**: Logged in as BIOLOGIST
**Steps**:
1. View "Samples Received" section
2. Select prescription with collected sample
3. Click "Start Analysis"
4. Enter result data
5. Save results
6. Verify prescription status changes to "Results Available"

**Expected Result**: Results saved, prescription available for doctor review

---

## Performance Testing Criteria

### API Response Times

| Endpoint | Target (p95) | Critical Threshold |
|----------|--------------|-------------------|
| GET /appointments | < 200ms | < 500ms |
| PATCH /appointments/:id/check-in | < 100ms | < 300ms |
| PATCH /appointments/:id/vitals | < 150ms | < 400ms |
| POST /prescriptions | < 100ms | < 300ms |
| POST /results | < 200ms | < 500ms |

**Testing Tool**: k6 (optional for MVP, recommended for production)

### Page Load Times

| Page | Target | Critical Threshold |
|------|--------|-------------------|
| Dashboard | < 1.5s | < 3s |
| Appointments List | < 1s | < 2s |
| Patient Detail | < 1s | < 2s |

**Testing Method**: Chrome DevTools Performance tab

---

## Security Testing Checklist

### Authentication & Authorization

- [ ] Session timeout after 24 hours
- [ ] Logout destroys session
- [ ] Protected routes redirect to login when not authenticated
- [ ] Role guards prevent unauthorized access to endpoints
- [ ] Cannot access other users' data (isolation)

### Input Validation

- [ ] All DTOs validate input
- [ ] SQL injection attempts blocked
- [ ] XSS payloads sanitized
- [ ] File size limits enforced (if applicable)
- [ ] Enum values validated

### Data Protection

- [ ] Passwords hashed with bcrypt
- [ ] Session cookies httpOnly
- [ ] No sensitive data in error messages
- [ ] No credentials in logs

---

## Test Data Management

### Test Users (Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Biologist | biologist@hospital.com | biologist123 |
| Nurse | nurse@hospital.com | nurse123 |
| Secretary | secretary@hospital.com | secretary123 |

### Test Patients

Create at least 3 test patients with different data:
- Patient with allergies
- Patient with chronic conditions
- Healthy patient

### Test Appointments

Create appointments in various states:
- SCHEDULED
- CHECKED_IN
- IN_CONSULTATION
- CONSULTATION_COMPLETED
- COMPLETED
- CANCELLED

---

## Defect Reporting

### Bug Report Template

```
Title: [Module] Brief description

Severity: Critical | High | Medium | Low

Steps to Reproduce:
1. Step one
2. Step two
3. Step three

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Environment:
- Browser: [Chrome 120 / Firefox 121]
- Role: [DOCTOR / NURSE / etc.]
- Test Database: [Yes/No]

Screenshots/Logs:
[Attach if relevant]
```

### Severity Levels

- **Critical**: System crash, data loss, security vulnerability
- **High**: Core workflow blocked, role permissions broken
- **Medium**: Non-critical feature broken, workaround exists
- **Low**: UI cosmetic issue, minor inconvenience

---

## Test Metrics & Reporting

### Coverage Metrics

```bash
# Generate coverage report
cd backend
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Test Results Summary

After test execution, report:
- Total tests run
- Tests passed / failed
- Code coverage percentage
- Critical failures (if any)
- Performance test results

### Example Report Format

```
Test Execution Summary - 2026-01-04

Backend Unit Tests:
- Total: 45 tests
- Passed: 43
- Failed: 2
- Coverage: 65%

Integration Tests:
- Total: 8 tests
- Passed: 8
- Failed: 0

Frontend Tests:
- Total: 12 tests
- Passed: 11
- Failed: 1
- Coverage: 52%

Critical Issues: None
High Priority Issues: 2
```

---

## Continuous Integration (Future)

For production deployment, integrate tests with CI/CD:

```yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run test:e2e

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
```

---

## Test Maintenance

### When to Update Tests

- After adding new features
- After fixing bugs (add regression test)
- After changing business logic
- After schema changes

### Test Review Schedule

- Weekly: Review failed tests
- Monthly: Review coverage gaps
- Quarterly: Update test data

---

## Appendix

### Useful Commands

```bash
# Backend
npm test                          # Run all unit tests
npm run test:e2e                  # Run integration tests
npm test -- --coverage            # Generate coverage report
npm test -- --watch              # Watch mode
npm test -- appointments.service # Run specific test file

# Frontend
npm test                          # Run all tests
npm test -- StatCard              # Run specific test
npm test -- --coverage            # Generate coverage
npm test -- --ui                  # Open Vitest UI

# Database
npx prisma migrate dev            # Run migrations
npx prisma db seed                # Seed database
npx prisma studio                 # Open database GUI
npx prisma migrate reset          # Reset database (WARNING: deletes data)
```

### References

- Validation Report: `/docs/2026_01_04/validation/validation-report.md`
- Requirements: `/docs/2026_01_04/specs/requirements.md`
- API Specification: `/docs/2026_01_04/architecture/api-spec.md`
- Acceptance Criteria: `/docs/2026_01_04/specs/acceptance-criteria.md`

---

**Document Status**: COMPLETE
**Next Steps**: Execute test suite, fix failing tests, achieve 70% coverage
**Author**: Testing Specialist (spec-tester)
**Last Updated**: 2026-01-04
