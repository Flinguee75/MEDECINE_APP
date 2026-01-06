# Architecture Documentation - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Phase**: Architecture Design (Phase 2)
**Status**: ✅ COMPLETE

---

## Overview

This directory contains comprehensive architecture documentation for implementing the complete 11-step clinical workflow based on Phase 1 requirements analysis. The architecture extends the existing partial workflow system to support full patient journey from appointment scheduling through billing closure.

---

## Documentation Structure

### 1. [architecture.md](./architecture.md) - System Architecture Design

**Purpose**: High-level system architecture and design decisions

**Contents**:
- System architecture diagrams (ASCII art)
- Module dependency graphs
- Data flow diagrams for workflow steps
- State machine diagrams
- Component hierarchy (frontend)
- Security architecture
- Error handling strategy
- Performance considerations
- Architectural Decision Records (ADRs)

**Key Decisions**:
- Extend existing modules vs. create new modules → **Extend**
- JSON fields for vitals vs. separate table → **JSON fields**
- Separate RESULTS_AVAILABLE status → **Yes, add new status**
- Real-time updates (WebSocket) → **No, polling for MVP**
- Dashboard component structure → **Role-based separate components**

**Audience**: Development team, technical leads

---

### 2. [api-spec.md](./api-spec.md) - Complete API Specifications

**Purpose**: Detailed API endpoint documentation with request/response examples

**Contents**:
- All 8 new endpoints for workflow transitions
- 1 modified endpoint (POST /results behavior change)
- Complete request/response schemas with TypeScript types
- Authentication and authorization requirements
- Error response formats and error codes
- Permission matrix for all endpoints
- Testing examples with curl commands

**New Endpoints**:
1. `PATCH /appointments/:id/check-in` (SECRETARY)
2. `PATCH /appointments/:id/vitals` (NURSE)
3. `PATCH /appointments/:id/consultation` (DOCTOR)
4. `PATCH /appointments/:id/close` (SECRETARY)
5. `PATCH /prescriptions/:id/send-to-lab` (DOCTOR, SECRETARY)
6. `PATCH /prescriptions/:id/collect-sample` (NURSE)
7. `PATCH /prescriptions/:id/start-analysis` (BIOLOGIST)
8. `PATCH /results/:id/review` (DOCTOR)

**Audience**: Backend developers, frontend developers, QA testers

---

### 3. [database-design.md](./database-design.md) - Database Schema Design

**Purpose**: Complete database schema with migration strategy

**Contents**:
- Complete Prisma schema with all changes
- Entity-Relationship diagram (ASCII art)
- 7 ordered migrations with SQL
- Migration execution plan
- Data types and constraints
- Indexing strategy
- Data integrity rules
- Seed data updates
- Backup and recovery strategy

**Schema Changes**:
- 1 new role (NURSE)
- 3 new appointment statuses (CHECKED_IN, IN_CONSULTATION, CONSULTATION_COMPLETED)
- 2 new prescription statuses (SAMPLE_COLLECTED, RESULTS_AVAILABLE)
- 1 new enum (BillingStatus)
- 17 new database fields across 3 models
- 1 new relation (Prescription → Nurse)

**Audience**: Backend developers, database administrators

---

### 4. [frontend-architecture.md](./frontend-architecture.md) - Frontend Architecture

**Purpose**: Frontend component structure and state management

**Contents**:
- Complete component hierarchy
- State management strategy (Context API)
- 4 reusable component specifications (StatCard, StatusChip, etc.)
- 7 new form components (dialogs/drawers)
- Extended dashboard specifications
- API service layer patterns
- TypeScript type definitions
- Error handling patterns
- Material-UI theme configuration
- Testing strategy

**New Components**:
- **Dashboards**: NurseDashboard (new), SecretaryDashboard (extended), DoctorDashboard (extended), BiologistDashboard (extended)
- **Dialogs**: VitalsDialog, ConsultationDrawer, ResultReviewDialog, ResultEntryDialog, SampleCollectionDialog, ClosureDialog
- **Reusable**: StatCard, QuickActionCard, StatusChip, EmptyState

**Audience**: Frontend developers, UI/UX designers

---

### 5. [integration-design.md](./integration-design.md) - Module Integration Design

**Purpose**: How all layers integrate together

**Contents**:
- Frontend ↔ Backend integration patterns
- Backend module dependency injection
- Service layer patterns
- Cross-module communication
- Error handling integration
- State transition validation
- Testing strategy (unit, integration, e2e)
- Deployment architecture
- Performance optimization
- Security considerations

**Integration Points**:
- API contracts between frontend and backend
- Session management flow
- Transaction handling for multi-step operations
- Error propagation across layers

**Audience**: Full-stack developers, DevOps engineers

---

## Document Dependencies

```
requirements.md (Phase 1)
    ↓
architecture.md (high-level design)
    ├── api-spec.md (backend contracts)
    ├── database-design.md (data layer)
    ├── frontend-architecture.md (UI layer)
    └── integration-design.md (how it all fits together)
```

**Reading Order**:
1. Start with **architecture.md** for overview
2. Read **database-design.md** to understand data model
3. Read **api-spec.md** to understand backend API
4. Read **frontend-architecture.md** to understand UI structure
5. Read **integration-design.md** to understand end-to-end flow

---

## Implementation Roadmap

### Phase 1: Database Foundation (Day 1-2)
**Focus**: Execute all 7 migrations, update seed data

**Tasks**:
- Run Prisma migrations in order
- Add NURSE role and test user
- Verify schema changes with Prisma Studio
- Test seed script with new data

**Reference**: database-design.md

---

### Phase 2: Backend Endpoints (Day 3-4)
**Focus**: Implement all 8 new API endpoints

**Tasks**:
- Create DTOs for new endpoints
- Implement service layer methods
- Add state transition validation
- Apply guards and role checks
- Test with Postman/curl

**Reference**: api-spec.md, integration-design.md

---

### Phase 3: Frontend Components (Day 5-6)
**Focus**: Build dashboards and dialogs

**Tasks**:
- Create reusable components (StatCard, StatusChip, etc.)
- Implement NurseDashboard
- Extend SecretaryDashboard, DoctorDashboard, BiologistDashboard
- Create all dialog components
- Connect to backend APIs

**Reference**: frontend-architecture.md

---

### Phase 4: Integration & Testing (Day 7)
**Focus**: End-to-end integration and testing

**Tasks**:
- Test complete patient journey
- Fix integration issues
- Polish UI (loading states, error messages)
- Verify all acceptance criteria
- Prepare demo

**Reference**: integration-design.md, acceptance-criteria.md

---

## Key Architectural Principles

### 1. Extend, Don't Fragment
- Extend AppointmentsModule for check-in, vitals, consultation
- Extend PrescriptionsModule for lab workflow
- Avoid creating too many small modules

### 2. State-Driven Workflow
- Clear state machines for Appointment and Prescription
- Validation at service layer prevents invalid transitions
- Audit trail: track who did what when

### 3. Role-Based Access Control
- Guards enforce permissions at API level
- Frontend hides unauthorized actions
- Defense in depth: validate on both frontend and backend

### 4. Type Safety Everywhere
- TypeScript on frontend and backend
- Prisma generates types from database schema
- DTOs validate API inputs

### 5. Keep It Simple
- No WebSocket for MVP (polling if needed)
- Session-based auth (no JWT complexity)
- Context API for state (no Redux)
- Material-UI for all UI (no custom CSS framework)

---

## Success Criteria

The architecture is considered successful when:

1. ✅ **Completeness**: All 10 functional requirements have architectural design
2. ✅ **Clarity**: Developers can implement without ambiguity
3. ✅ **Type Safety**: All API contracts defined with TypeScript
4. ✅ **Testability**: Unit and integration tests are straightforward
5. ✅ **Performance**: Design meets NFR-001 targets (< 2s page load, < 500ms API)
6. ✅ **Maintainability**: Clear module structure and documentation
7. ✅ **Security**: RBAC enforced at all layers

---

## Technical Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma v6.x
- **Auth**: express-session
- **Language**: TypeScript

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI v5+
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Language**: TypeScript

### Database
- **RDBMS**: PostgreSQL
- **Schema Management**: Prisma Migrations
- **Indexing**: PostgreSQL B-tree indexes

---

## Constraints & Assumptions

### Technical Constraints
- Desktop-only (no mobile responsive design)
- Session-based auth (no JWT)
- Prisma v6.x (avoid v7 due to config changes)
- Local network deployment

### Business Constraints
- 7-day implementation timeline
- 75% quality threshold (acceptable for MVP)
- < 50 concurrent users
- Single hospital location

### Simplifications for MVP
- No email/SMS notifications
- No real-time updates (WebSocket)
- No document uploads
- No advanced reporting
- Simple flat-rate billing

---

## Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 500ms | 95th percentile |
| Page Load Time | < 2s | Desktop, local network |
| Database Query Time | < 100ms | Most queries |
| Test Coverage | 75% | Backend services (optional) |
| Documentation | 100% | All endpoints documented |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial architecture design complete |

---

## Next Steps

1. **Review**: Team review of architecture documents
2. **Approve**: Stakeholder sign-off on design
3. **Plan**: Break down into development tasks
4. **Execute**: Begin Phase 1 (database migrations)

---

## Contact

For questions or clarifications:
- **Technical Architecture**: See architecture.md ADRs
- **API Questions**: See api-spec.md examples
- **Database Questions**: See database-design.md schema
- **Frontend Questions**: See frontend-architecture.md components
- **Integration Questions**: See integration-design.md patterns

---

## File Sizes

| Document | Lines | Size | Complexity |
|----------|-------|------|------------|
| architecture.md | ~800 | ~60 KB | High |
| api-spec.md | ~1200 | ~90 KB | Very High |
| database-design.md | ~1000 | ~75 KB | High |
| frontend-architecture.md | ~800 | ~60 KB | High |
| integration-design.md | ~700 | ~55 KB | High |
| **TOTAL** | **~4500** | **~340 KB** | Comprehensive |

---

**Status**: ✅ ARCHITECTURE DESIGN COMPLETE
**Quality**: Production-ready for 7-day MVP
**Ready for**: Implementation Phase
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
