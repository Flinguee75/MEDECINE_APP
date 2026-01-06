---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/README.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/ARCHITECTURE.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/_bmad-output/planning-artifacts/ux-design-specification.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/API.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/STRUCTURE.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/INSTALL.md"
  - "/Users/tidianecisse/PROJET_INFO/MEDECINE_APP/pdf/Parcours Patient Clinique.pdf"
---

# MEDECINE_APP - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for MEDECINE_APP, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1:** The system must support user authentication with email and password using session-based authentication (express-session)

**FR2:** The system must support 4 user roles: ADMIN, DOCTOR, BIOLOGIST, and SECRETARY with role-based access control

**FR3:** ADMIN users must be able to create, view, update, and delete user accounts

**FR4:** SECRETARY users must be able to create and manage patient records (firstName, lastName, birthDate)

**FR5:** SECRETARY users must be able to create and manage appointments with date, motif, patient, and doctor assignment

**FR6:** All authenticated users must be able to view patient lists and patient details

**FR7:** DOCTOR users must be able to view their assigned appointments filtered by date and status

**FR8:** DOCTOR users must be able to create prescriptions for patients with status CREATED

**FR9:** DOCTOR users must be able to change prescription status from CREATED to SENT_TO_LAB

**FR10:** BIOLOGIST users must be able to view prescriptions with status SENT_TO_LAB, IN_PROGRESS

**FR11:** BIOLOGIST users must be able to change prescription status from SENT_TO_LAB to IN_PROGRESS to COMPLETED

**FR12:** BIOLOGIST users must be able to create lab results for prescriptions

**FR13:** When a result is created, the prescription status must automatically change to COMPLETED

**FR14:** DOCTOR users must be able to view lab results for their prescriptions

**FR15:** The system must provide a dashboard tailored to each user role showing relevant information

**FR16:** SECRETARY users must be able to cancel appointments (status change to CANCELLED)

**FR17:** DOCTOR users must be able to mark appointments as COMPLETED

**FR18:** All API responses must follow a consistent format with data and message fields

**FR19:** The system must provide search/filter capabilities for patients, appointments, and prescriptions

**FR20:** The system must maintain a complete workflow: Appointment → Consultation → Prescription → Lab Result → Doctor Review

**FR21:** ADMIN users must have read access to all data but limited write access to user management only

**FR22:** The system must prevent unauthorized actions based on role (e.g., DOCTOR cannot create patients, BIOLOGIST cannot create prescriptions)

**FR23:** The system must display user information through GET /auth/me endpoint for authenticated users

**FR24:** The system must allow users to log out and destroy their session

**FR25:** The system must support pagination for patient lists (limit, offset parameters)

**FR26:** The system must validate that prescriptions can only have one result (one-to-one relationship)

**FR27:** The system must prevent creating results for prescriptions that already have results (409 error)

**FR28:** The system must allow BIOLOGIST users to update/correct lab results after creation

**FR29:** The system must filter appointments by doctorId, patientId, status, and date

**FR30:** The system must filter prescriptions by doctorId, patientId, and status

### NonFunctional Requirements

**NFR1:** The system must use PostgreSQL as the database with Prisma ORM

**NFR2:** The backend must be built with NestJS framework using TypeScript

**NFR3:** The frontend must be built with React 18, TypeScript, and Material-UI

**NFR4:** The system must use session-based authentication with httpOnly cookies (24-hour expiration)

**NFR5:** User passwords must be hashed using bcrypt before storage

**NFR6:** The system must respond to local requests in less than 2 seconds

**NFR7:** The system must run as a desktop application using Electron

**NFR8:** The system must support a minimum screen width of 1024px (desktop-only, no mobile)

**NFR9:** The backend API must be prefixed with /api and run on port 3000

**NFR10:** The frontend must run on port 5173 during development (Vite)

**NFR11:** The system must use CORS configuration with credentials enabled to allow frontend-backend communication

**NFR12:** All database IDs must use UUIDs instead of auto-increment integers

**NFR13:** The system must use class-validator for DTO validation on the backend

**NFR14:** The frontend must use Axios with withCredentials: true for all API calls

**NFR15:** The system must follow NestJS modular architecture with separate modules for each domain

**NFR16:** The system must implement AuthGuard and RolesGuard for route protection

**NFR17:** The system must support database migrations through Prisma migrate

**NFR18:** The system must provide seed data for testing with 4 users (one per role) and sample patients/appointments

**NFR19:** The system must use Material-UI theme with primary color #1976D2 (medical blue)

**NFR20:** The system must provide a professional, clean UI suitable for medical environment

**NFR21:** The frontend must use React Router for navigation with protected routes

**NFR22:** The system must use AuthContext for global authentication state management

**NFR23:** Error messages must be user-friendly and in French (medical terminology)

**NFR24:** The system must use Roboto font family for all typography

**NFR25:** The system must maintain cascade deletes on foreign key relationships

**NFR26:** The development environment must support concurrent backend and frontend execution

**NFR27:** The system must be deployable on local network for multiple client workstations

**NFR28:** The system must work on macOS development environment with Homebrew-installed dependencies

### Additional Requirements

**AR1:** The system must implement a PrismaModule as a global module providing database access to all other modules

**AR2:** The backend must use express-session with specific configuration: resave: false, saveUninitialized: false, cookie maxAge: 24 hours

**AR3:** Session storage must be in-memory (not persisted to database in MVP)

**AR4:** Session type must be defined in backend/src/types/session.d.ts containing only userId field

**AR5:** The system must use @CurrentUser() decorator to extract userId from session in controllers

**AR6:** The system must use @Roles() decorator combined with RolesGuard to enforce role-based access

**AR7:** RolesGuard must fetch user from database to verify role (not from session)

**AR8:** The backend must use require() syntax for express-session and cors imports (not ES6 imports)

**AR9:** The project must follow monorepo structure with backend and frontend in the same repository

**AR10:** The system must use Prisma v6.x (not v7+) to avoid datasource URL configuration changes

**AR11:** API error responses must include statusCode, message, and error fields

**AR12:** The system must implement proper DTO validation with specific error messages

**AR13:** The system must prevent duplicate appointments at the same time for the same doctor (409 error)

**AR14:** The frontend must use ProtectedRoute component that redirects to /login if not authenticated

**AR15:** The frontend must use PublicRoute component that redirects to /dashboard if already authenticated

**UX1:** The system must display a workflow stepper (Material-UI Stepper) showing the 11-step patient journey in the patient record view

**UX2:** Each role must have a role-optimized dashboard as the landing page (Doctors → "Consultations du jour", Biologist → "Nouvelles demandes", etc.)

**UX3:** The system must use Material-UI Chip components with color coding for all status displays (appointment status, prescription status)

**UX4:** The system must display badge notifications (Material-UI Badge) on dashboards to highlight new items requiring action

**UX5:** The system must implement tab navigation (Material-UI Tabs) in patient record view with tabs for: Infos, Constantes, Prescriptions, Résultats, Notes

**UX6:** The system must provide contextual primary action buttons that are large, obvious, and disabled with explanatory messages when prerequisites are not met

**UX7:** The system must display Snackbar notifications (Material-UI Alert + Snackbar) after every user action for feedback

**UX8:** The system must implement confirmation dialogs (Material-UI Dialog) for destructive actions like deletion or cancellation

**UX9:** The system must show loading states (CircularProgress or Skeleton) instead of blank pages during data fetching

**UX10:** The system must display empty state messages with suggested actions when no data is available

**UX11:** The system must place primary action buttons on the right, secondary buttons on the left for consistency

**UX12:** The system must limit to one "contained" variant button per screen to maintain visual hierarchy

**UX13:** Error messages must be explanatory and include solutions (e.g., "Impossible de démarrer la consultation : les constantes n'ont pas encore été saisies. Demandez à l'infirmier de compléter les constantes vitales.")

**UX14:** The system must use the following color scheme for workflow statuses:
- Appointment SCHEDULED: Blue (#1976D2)
- Appointment CHECKED_IN: Orange (#F57C00)
- Appointment COMPLETED: Green (#388E3C)
- Appointment CANCELLED: Red (#D32F2F)
- Prescription CREATED: Blue (#1976D2)
- Prescription SENT_TO_LAB: Orange (#F57C00)
- Prescription IN_PROGRESS: Indigo (#3F51B5)
- Prescription COMPLETED: Green (#388E3C)

**UX15:** The system must use autoFocus on the first field of all forms for keyboard efficiency

**UX16:** The system must provide <200ms feedback for all user actions

**UX17:** The system must use textTransform: 'none' for all Material-UI buttons (no uppercase)

**UX18:** The system must implement proper responsive spacing using theme.spacing() with standard values (8px, 16px, 24px, 32px)

**UX19:** The system must use border radius of 8px for all cards and containers

**UX20:** The system must use appropriate Material-UI icons for all contexts (CheckCircle for validated, HourglassEmpty for waiting, LocalHospital for medical, Science for lab, etc.)

### FR Coverage Map

**FR1** → Epic 1 (Session-based authentication with express-session)
**FR2** → Epic 1 (4 user roles: ADMIN, DOCTOR, BIOLOGIST, SECRETARY with RBAC)
**FR3** → Epic 1 (ADMIN creates, updates, deletes user accounts)
**FR4** → Epic 2 (SECRETARY creates and manages patient records)
**FR5** → Epic 3 (SECRETARY creates and manages appointments)
**FR6** → Epic 2 (All authenticated users view patient lists and details)
**FR7** → Epic 4 (DOCTOR views assigned appointments filtered by date/status)
**FR8** → Epic 5 (DOCTOR creates prescriptions with CREATED status)
**FR9** → Epic 5 (DOCTOR changes prescription status to SENT_TO_LAB)
**FR10** → Epic 6 (BIOLOGIST views prescriptions with SENT_TO_LAB, IN_PROGRESS status)
**FR11** → Epic 6 (BIOLOGIST changes prescription status through workflow: SENT_TO_LAB → IN_PROGRESS → COMPLETED)
**FR12** → Epic 6 (BIOLOGIST creates lab results for prescriptions)
**FR13** → Epic 6 (Prescription status automatically changes to COMPLETED when result created)
**FR14** → Epic 7 (DOCTOR views lab results for their prescriptions)
**FR15** → Epic 8 (Role-tailored dashboards showing relevant information)
**FR16** → Epic 4 (SECRETARY cancels appointments - status CANCELLED)
**FR17** → Epic 4 (DOCTOR marks appointments as COMPLETED)
**FR18** → Epic 8 (Consistent API response format for UX feedback)
**FR19** → Epic 2 (patient search), Epic 3 (appointment filters), Epic 5 (prescription filters)
**FR20** → Epic 7 (Complete workflow: Appointment → Consultation → Prescription → Lab Result → Doctor Review)
**FR21** → Epic 1 (ADMIN read-only access to all data, write access to user management only)
**FR22** → Epic 1 (Role-based permission enforcement preventing unauthorized actions)
**FR23** → Epic 1 (GET /auth/me endpoint displays user information)
**FR24** → Epic 1 (Logout functionality destroys session)
**FR25** → Epic 2 (Patient list pagination with limit/offset parameters)
**FR26** → Epic 6 (One-to-one prescription-result relationship validation)
**FR27** → Epic 6 (Prevent duplicate results - 409 error)
**FR28** → Epic 6 (BIOLOGIST updates/corrects lab results)
**FR29** → Epic 3 (Filter appointments by doctorId, patientId, status, date)
**FR30** → Epic 5 (Filter prescriptions by doctorId, patientId, status)

## Epic List

### Epic 1: Authentication & User Management (Foundation)

**Workflow Step:** Foundation (Enables all other workflow steps)
**System State:** N/A (Foundation)

**User Outcome:** Hospital staff can securely authenticate and administrators can manage user accounts for all roles (ADMIN, DOCTOR, BIOLOGIST, SECRETARY).

**What users can accomplish:**
- Staff members log in with email/password using session-based authentication
- System enforces role-based permissions across all features
- Users can view their profile information via GET /auth/me
- Users can log out securely with session destruction
- ADMIN users can create, update, and delete user accounts
- System prevents unauthorized actions based on user role

**FRs covered:** FR1, FR2, FR3, FR21, FR22, FR23, FR24

**NFRs addressed:** NFR4 (session auth, httpOnly cookies), NFR5 (bcrypt hashing), NFR13 (DTO validation), NFR16 (Guards)

**Architecture Requirements:** AR1-AR8 (PrismaModule, session config, decorators, Guards, import syntax)

**Dependencies:** None (foundation epic)

---

### Epic 2: Patient Registration & Administrative Intake

**Workflow Step:** Step 2 - Création du patient et saisie administrative (Secrétariat)
**System State:** PATIENT_CREATED

**User Outcome:** Secretary staff can create and maintain a centralized patient registry accessible to all hospital staff.

**What users can accomplish:**
- SECRETARY creates new patient records (firstName, lastName, birthDate)
- SECRETARY updates existing patient information
- All staff can view patient lists with search functionality
- All staff can view detailed patient information
- Patient lists support pagination for efficient browsing

**FRs covered:** FR4, FR6, FR19 (patient search), FR25

**NFRs addressed:** NFR12 (UUID IDs), NFR23 (French error messages), NFR25 (cascade deletes)

**UX Requirements:** UX9 (loading states), UX10 (empty states), UX15 (autoFocus on forms)

**Dependencies:** Epic 1 (requires authentication and role enforcement)

---

### Epic 3: Appointment Planning & Scheduling

**Workflow Step:** Step 3 - Planification du rendez-vous (Secrétariat)
**System State:** APPOINTMENT_SCHEDULED

**User Outcome:** Secretaries can schedule patient appointments with doctors and manage the appointment calendar.

**What users can accomplish:**
- SECRETARY creates appointments linking patient + doctor + date/time + motif
- SECRETARY views all appointments with filters (date, doctor, patient, status)
- System prevents double-booking the same doctor at the same time
- All staff can view and filter appointments by various criteria

**FRs covered:** FR5, FR19 (appointment filters), FR29

**NFRs addressed:** NFR6 (<2 second response time)

**Architecture Requirements:** AR13 (prevent duplicate appointments - 409 error)

**UX Requirements:** UX3 (status chips), UX7 (snackbar feedback), UX8 (confirmation dialogs)

**Dependencies:** Epic 1 (authentication) + Epic 2 (patients must exist to create appointments)

---

### Epic 4: Appointment Check-In & Consultation Tracking

**Workflow Steps:**
- Step 4 - Check-in le jour J (Secrétariat)
- Step 6 - Consultation médicale: diagnostic et décision (Médecin)

**System States:** CHECKED_IN → IN_CONSULTATION → CONSULTATION_COMPLETED

**User Outcome:** Secretaries can check-in patients on appointment day, doctors can view their consultation schedule, and appointments progress through the consultation workflow.

**What users can accomplish:**
- SECRETARY performs patient check-in on the appointment day
- DOCTOR views assigned appointments filtered by date and status
- DOCTOR marks appointments as "in consultation" when starting
- DOCTOR marks consultations as completed after finishing
- SECRETARY can cancel appointments if needed

**FRs covered:** FR7, FR16, FR17

**NFRs addressed:** NFR20 (professional medical UI)

**UX Requirements:** UX6 (contextual action buttons), UX11 (button placement), UX12 (single primary button), UX14 (status color scheme)

**Note:** Step 5 (Pré-consultation par Infirmier - constantes, antécédents) is **OUT OF SCOPE** for MVP - no NURSE role implemented

**Dependencies:** Epic 3 (appointments must be scheduled first)

---

### Epic 5: Medical Prescription Creation & Laboratory Submission

**Workflow Step:** Step 7 - Prescription d'analyses si nécessaire (Médecin)
**System State:** LAB_TEST_PRESCRIBED (CREATED → SENT_TO_LAB)

**User Outcome:** Doctors can create laboratory test prescriptions after consultations and send them to the laboratory for analysis.

**What users can accomplish:**
- DOCTOR creates prescriptions for patients after completing consultation
- DOCTOR views their created prescriptions
- DOCTOR sends prescriptions to laboratory (status changes to SENT_TO_LAB)
- All staff can view and filter prescriptions by doctor, patient, and status

**FRs covered:** FR8, FR9, FR19 (prescription filters), FR30

**NFRs addressed:** NFR15 (NestJS modular architecture)

**Architecture Requirements:** AR11 (API error responses), AR12 (DTO validation with error messages)

**UX Requirements:** UX13 (explanatory error messages), UX17 (textTransform none), UX18 (spacing)

**Note:** Step 8 (Prélèvement biologique par Infirmier) is **OUT OF SCOPE** for MVP - SAMPLE_COLLECTED state not implemented

**Dependencies:** Epic 4 (prescription created after consultation is completed)

---

### Epic 6: Laboratory Analysis & Results Validation

**Workflow Step:** Step 9 - Analyse et validation des résultats (Biologiste)
**System State:** LAB_RESULTS_VALIDATED (IN_PROGRESS → COMPLETED)

**User Outcome:** Biologists can receive prescription requests, perform analyses, record and validate results with automatic workflow progression.

**What users can accomplish:**
- BIOLOGIST views prescriptions sent to lab (SENT_TO_LAB status)
- BIOLOGIST marks prescriptions as in-progress when starting analysis (IN_PROGRESS status)
- BIOLOGIST enters and validates lab results
- BIOLOGIST can update/correct results after initial entry
- System automatically updates prescription status to COMPLETED when result is validated
- System prevents duplicate results (enforces one-to-one prescription-result relationship)

**FRs covered:** FR10, FR11, FR12, FR13, FR26, FR27, FR28

**Architecture Requirements:** AR11 (error responses for duplicate results)

**UX Requirements:** UX4 (badge notifications for new lab requests), UX7 (feedback on result submission)

**Dependencies:** Epic 5 (prescriptions must be sent to lab first)

---

### Epic 7: Medical Results Review & Interpretation

**Workflow Step:** Step 10 - Interprétation médicale des résultats (Médecin)
**System State:** RESULTS_REVIEWED

**User Outcome:** Doctors can review and interpret laboratory results for their patients, completing the full clinical workflow from appointment to diagnosis.

**What users can accomplish:**
- DOCTOR views completed lab results for their prescriptions
- DOCTOR accesses patient history with all associated results
- Complete clinical workflow is validated end-to-end: Appointment → Consultation → Prescription → Lab Result → Doctor Review

**FRs covered:** FR14, FR20 (complete workflow validation)

**UX Requirements:** UX5 (tab navigation in patient view - Résultats tab), UX20 (appropriate icons)

**Dependencies:** Epic 6 (results must be validated by biologist first)

**Note:** Step 11 (Clôture administrative et facturation par Secrétariat) is **OUT OF SCOPE** for MVP - CLOSED state and billing not implemented

---

### Epic 8: Role-Optimized Dashboards & UX Enhancements

**Workflow Enhancement:** Supports all workflow steps with enhanced user experience
**System State:** All states (visual and interaction enhancements)

**User Outcome:** Each staff member experiences a personalized, intuitive interface with visual workflow guidance, immediate feedback, and role-specific optimizations that make daily tasks efficient and error-free.

**What users can accomplish:**
- Each role lands on a tailored dashboard showing relevant information (DOCTOR → "Consultations du jour", BIOLOGIST → "Nouvelles demandes", SECRETARY → administrative overview, ADMIN → user management)
- Users see the complete 11-step workflow progress via Material-UI Stepper in patient record view
- Users receive immediate feedback (<200ms) for all actions via snackbar notifications
- Users see color-coded status indicators (chips, badges) for appointments and prescriptions
- Users navigate patient records efficiently via tab navigation (Infos, Prescriptions, Résultats)
- Users receive confirmation dialogs before critical actions (delete, cancel)
- Users see loading states during data fetching (no blank pages)
- Users see helpful empty state messages with suggested actions
- All buttons follow consistent placement and visual hierarchy rules

**FRs covered:** FR15, FR18 (consistent API responses enable UX feedback)

**NFRs addressed:** NFR19 (Material-UI theme #1976D2), NFR20 (professional medical UI), NFR23 (French messages), NFR24 (Roboto font)

**UX Requirements:** UX1-UX20 (all UX enhancements including stepper, dashboards, chips, badges, tabs, buttons, notifications, dialogs, loading states, empty states, spacing, icons)

**Architecture Requirements:** AR14 (ProtectedRoute), AR15 (PublicRoute)

**Dependencies:** All previous epics (enhances the complete system with polished UX)

---

## Epic 1: Authentication & User Management (Foundation)

**Epic Goal:** Hospital staff can securely authenticate and administrators can manage user accounts for all roles (ADMIN, DOCTOR, BIOLOGIST, SECRETARY).

### Story 1.1: Backend - Database Schema & Prisma Setup

As a **developer**,
I want to set up the Prisma schema with the User model and initial database configuration,
So that the authentication system has a foundation to store user data.

**Acceptance Criteria:**

**Given** a new NestJS project structure
**When** I configure Prisma with PostgreSQL
**Then** the User model is created with fields: id (UUID), name, email (unique), password (hashed), role (enum: ADMIN, DOCTOR, BIOLOGIST, SECRETARY), createdAt, updatedAt
**And** the Role enum is defined in the schema
**And** Prisma Client is generated successfully
**And** the initial migration creates the users table in PostgreSQL
**And** cascade delete relationships are configured

**Technical Notes:**
- Use Prisma v6.x (not v7+) as per AR10
- Session type defined in backend/src/types/session.d.ts with userId field (AR4)
- PrismaModule created as global module (AR1)

---

### Story 1.2: Backend - User Authentication Module (Login/Logout)

As a **hospital staff member**,
I want to log in with my email and password using session-based authentication,
So that I can securely access the system.

**Acceptance Criteria:**

**Given** a user with valid credentials exists in the database
**When** I send POST /api/auth/login with email and password
**Then** the system validates credentials using bcrypt
**And** a session is created with userId stored (AR2: resave: false, saveUninitialized: false, 24h cookie maxAge)
**And** an httpOnly session cookie is sent to the client (NFR4)
**And** user information (id, name, email, role) is returned in the response
**And** GET /api/auth/me returns the authenticated user's information when session is valid
**And** POST /api/auth/logout destroys the session and clears the cookie
**And** invalid credentials return 401 error with user-friendly French message (NFR23)

**Technical Notes:**
- Use express-session with require() syntax (AR8)
- Passwords hashed with bcrypt (NFR5)
- AuthGuard implemented to protect routes (NFR16, AR6)
- @CurrentUser() decorator extracts userId from session (AR5)

---

### Story 1.3: Backend - Role-Based Access Control (Guards & Decorators)

As a **system administrator**,
I want role-based permissions enforced across all endpoints,
So that users can only access features appropriate to their role.

**Acceptance Criteria:**

**Given** authenticated users with different roles (ADMIN, DOCTOR, BIOLOGIST, SECRETARY)
**When** they attempt to access protected endpoints
**Then** AuthGuard verifies the user is authenticated
**And** RolesGuard fetches user from database to verify role (AR7)
**And** @Roles() decorator defines required roles for each endpoint
**And** unauthorized access returns 403 error with French error message
**And** ADMIN users have read access to all data but write access limited to user management (FR21)
**And** role-based permissions prevent unauthorized actions (FR22: DOCTOR cannot create patients, BIOLOGIST cannot create prescriptions)

**Technical Notes:**
- RolesGuard must NOT use session for role check - must query database (AR7)
- Combine @UseGuards(AuthGuard, RolesGuard) for protected routes (AR6)

---

### Story 1.4: Backend - User Management CRUD (ADMIN Only)

As an **administrator**,
I want to create, update, view, and delete user accounts,
So that I can manage hospital staff access to the system.

**Acceptance Criteria:**

**Given** I am logged in as ADMIN
**When** I send GET /api/users
**Then** I receive a list of all users with optional filters (role, search by name/email)
**And** GET /api/users/:id returns detailed user information
**And** POST /api/users creates a new user with name, email, password (hashed), role
**And** duplicate email returns 400 error
**And** PATCH /api/users/:id updates user information
**And** DELETE /api/users/:id removes the user from the system
**And** all operations are restricted to ADMIN role only (403 for other roles)
**And** password changes are properly hashed before storage
**And** DTOs validate all input fields with class-validator (NFR13, AR12)

---

### Story 1.5: Frontend - Login Page UI

As a **hospital staff member**,
I want a professional login page with email and password fields,
So that I can authenticate into the system.

**Acceptance Criteria:**

**Given** I am on the login page (PublicRoute - redirects to /dashboard if already authenticated per AR15)
**When** I view the page
**Then** I see Material-UI TextField components for email and password
**And** the password field has type="password" (hidden input)
**And** a "Se connecter" button is displayed (variant="contained", size="large", fullWidth)
**And** autoFocus is set on the email field (UX15)
**And** the Material-UI theme uses primary color #1976D2 (NFR19)
**And** the page uses Roboto font (NFR24)
**And** When I submit valid credentials, I am redirected to /dashboard
**And** When credentials are invalid, I see a Snackbar error message in French (UX7, NFR23)
**And** the page is desktop-optimized (min-width 1024px, NFR8)

**Technical Notes:**
- Use Axios with withCredentials: true for API calls (NFR14)
- Store user in AuthContext on successful login (NFR22)
- PublicRoute wrapper redirects authenticated users to dashboard (AR15)

---

### Story 1.6: Frontend - AuthContext & Protected Routes

As a **developer**,
I want global authentication state management with protected routing,
So that the app enforces authentication across all pages.

**Acceptance Criteria:**

**Given** the React application structure
**When** I implement AuthContext
**Then** it provides: user object, loading state, login() function, logout() function
**And** useAuth() hook is available for all components
**And** ProtectedRoute component redirects to /login if not authenticated (AR14)
**And** PublicRoute component redirects to /dashboard if already authenticated (AR15)
**And** React Router is configured with protected and public routes (NFR21)
**And** GET /api/auth/me is called on app initialization to restore session
**And** logout() calls POST /api/auth/logout and clears AuthContext state
**And** all API calls use Axios with withCredentials: true (NFR14)

---

### Story 1.7: Frontend - User Management Page (ADMIN)

As an **administrator**,
I want a user management interface to create, view, update, and delete users,
So that I can manage hospital staff accounts.

**Acceptance Criteria:**

**Given** I am logged in as ADMIN and on the /users page (ProtectedRoute)
**When** I view the page
**Then** I see a Material-UI Table with columns: Name, Email, Role, Actions
**And** I can filter users by role using a Select dropdown
**And** I can search users by name/email using a TextField with debounce
**And** I can click "Ajouter Utilisateur" button to open a Dialog for user creation
**And** the creation Dialog includes validated fields: name, email, password, role (Select)
**And** I can edit a user by clicking an Edit IconButton (opens Dialog with pre-filled data)
**And** I can delete a user by clicking a Delete IconButton (shows confirmation Dialog per UX8)
**And** all actions show Snackbar feedback: "Utilisateur créé avec succès", "Utilisateur supprimé", etc. (UX7)
**And** loading states are shown during API calls (CircularProgress per UX9)
**And** empty state message is shown when no users exist (UX10)
**And** all buttons follow placement rules: primary on right, secondary on left (UX11)

---

## Epic 2: Patient Registration & Administrative Intake

**Epic Goal:** Secretary staff can create and maintain a centralized patient registry accessible to all hospital staff.

### Story 2.1: Backend - Patient Model & CRUD Endpoints

As a **secretary**,
I want to create and manage patient records,
So that I can maintain an accurate patient registry.

**Acceptance Criteria:**

**Given** Prisma schema is configured
**When** I create the Patient model
**Then** it includes fields: id (UUID), firstName, lastName, birthDate (DateTime), createdAt, updatedAt
**And** the patients table is created via Prisma migration
**And** POST /api/patients creates a new patient (SECRETARY role only, enforced by RolesGuard)
**And** GET /api/patients returns paginated patient list (limit, offset parameters per FR25)
**And** GET /api/patients?search=<term> filters by firstName or lastName
**And** GET /api/patients/:id returns patient details
**And** PATCH /api/patients/:id updates patient information (SECRETARY only)
**And** all authenticated users can view patients (GET endpoints)
**And** DTOs validate firstName, lastName, birthDate with class-validator (AR12)
**And** API responses follow consistent format: { data, message } (FR18)
**And** French error messages for validation errors (NFR23)

---

### Story 2.2: Frontend - Patient List Page

As a **staff member**,
I want to view a searchable, paginated list of all patients,
So that I can find patient information quickly.

**Acceptance Criteria:**

**Given** I am authenticated and on /patients page
**When** I view the page
**Then** I see a Material-UI Table with columns: Prénom, Nom, Date de naissance, Actions
**And** I can search patients by name using a TextField (debounced search)
**And** the table shows 50 patients per page with pagination controls
**And** I can click on a patient row to view details
**And** loading state is shown while fetching data (CircularProgress per UX9)
**And** empty state message "Aucun patient trouvé" is shown when list is empty (UX10)
**And** dates are formatted in French locale (e.g., "15/05/1980")

---

### Story 2.3: Frontend - Create/Edit Patient Form (SECRETARY)

As a **secretary**,
I want a form to create and edit patient records,
So that I can manage patient information accurately.

**Acceptance Criteria:**

**Given** I am logged in as SECRETARY
**When** I click "Ajouter Patient" button on /patients page
**Then** a Dialog opens with a form containing: Prénom (TextField), Nom (TextField), Date de naissance (DatePicker)
**And** autoFocus is set on the Prénom field (UX15)
**And** all fields are required with validation
**And** the DatePicker uses Material-UI @mui/x-date-pickers with dayjs
**And** "Annuler" button is on the left, "Créer" button (contained variant) is on the right (UX11, UX12)
**And** on submit, patient is created via POST /api/patients
**And** success shows Snackbar "Patient créé avec succès" (UX7)
**And** form errors display in French (NFR23)
**And** edit mode pre-fills the form with existing patient data
**And** PATCH /api/patients/:id is called on edit submission
**And** non-SECRETARY users do not see the "Ajouter Patient" button (role-based UI)

---

## Epic 3: Appointment Planning & Scheduling

**Epic Goal:** Secretaries can schedule patient appointments with doctors and manage the appointment calendar.

### Story 3.1: Backend - Appointment Model & Creation

As a **secretary**,
I want to create appointments linking patients with doctors,
So that I can schedule consultations.

**Acceptance Criteria:**

**Given** Patient and User models exist
**When** I create the Appointment model
**Then** it includes: id (UUID), date (DateTime), motif (String), status (enum: SCHEDULED, CHECKED_IN, IN_CONSULTATION, CONSULTATION_COMPLETED, CANCELLED), patientId (FK to Patient), doctorId (FK to User), createdAt, updatedAt
**And** AppointmentStatus enum is defined in schema
**And** cascade delete is configured on foreign keys (NFR25)
**And** Prisma migration creates appointments table
**And** POST /api/appointments creates appointment (SECRETARY only)
**And** the endpoint validates that doctorId references a user with role DOCTOR
**And** the endpoint prevents double-booking: same doctor cannot have overlapping appointments (409 error per AR13)
**And** default status is SCHEDULED
**And** DTOs validate: date (future), motif, patientId, doctorId
**And** 400 error if patient or doctor not found
**And** French error messages (NFR23)

---

### Story 3.2: Backend - Appointment Filtering & Retrieval

As a **staff member**,
I want to view and filter appointments by various criteria,
So that I can find relevant appointments quickly.

**Acceptance Criteria:**

**Given** appointments exist in the system
**When** I call GET /api/appointments
**Then** I receive a list of appointments with patient and doctor details included
**And** I can filter by doctorId: GET /api/appointments?doctorId=<id>
**And** I can filter by patientId: GET /api/appointments?patientId=<id>
**And** I can filter by status: GET /api/appointments?status=SCHEDULED
**And** I can filter by date: GET /api/appointments?date=2026-01-05
**And** GET /api/appointments/:id returns full appointment details with patient and doctor info
**And** appointments are sorted by date (ascending)
**And** response time is <2 seconds (NFR6)

---

### Story 3.3: Frontend - Appointment List with Filters

As a **staff member**,
I want to view appointments with filtering options,
So that I can find specific appointments easily.

**Acceptance Criteria:**

**Given** I am on /appointments page
**When** I view the page
**Then** I see a Material-UI Table with columns: Patient, Médecin, Date, Heure, Motif, Statut, Actions
**And** I can filter by doctor using a Select dropdown (populated with DOCTOR role users)
**And** I can filter by patient using an Autocomplete search
**And** I can filter by status using a Select dropdown (SCHEDULED, CHECKED_IN, etc.)
**And** I can filter by date using a DatePicker
**And** status is displayed as a Material-UI Chip with color coding (UX3, UX14):
  - SCHEDULED: Blue (#1976D2)
  - CHECKED_IN: Orange (#F57C00)
  - IN_CONSULTATION: Purple
  - CONSULTATION_COMPLETED/COMPLETED: Green (#388E3C)
  - CANCELLED: Red (#D32F2F)
**And** loading state shows CircularProgress (UX9)
**And** empty state message shown when no appointments (UX10)
**And** dates formatted in French

---

### Story 3.4: Frontend - Create Appointment Form (SECRETARY)

As a **secretary**,
I want a form to create new appointments,
So that I can schedule patient consultations.

**Acceptance Criteria:**

**Given** I am logged in as SECRETARY and on /appointments page
**When** I click "Créer Rendez-vous" button
**Then** a Dialog opens with form fields:
  - Patient (Autocomplete search)
  - Médecin (Select with DOCTOR role users only)
  - Date (DatePicker - future dates only)
  - Heure (TimePicker)
  - Motif (TextField multiline)
**And** all fields are required
**And** autoFocus on Patient field (UX15)
**And** on submit, POST /api/appointments is called
**And** success shows Snackbar "Rendez-vous créé avec succès" (UX7)
**And** 409 error (doctor double-booked) shows French error: "Le médecin a déjà un rendez-vous à cette heure" (AR13)
**And** buttons: "Annuler" left, "Créer" right (contained variant) (UX11, UX12)
**And** non-SECRETARY users don't see create button

---

## Epic 4: Appointment Check-In & Consultation Tracking

**Epic Goal:** Secretaries can check-in patients, doctors can view their consultation schedule, and appointments progress through consultation workflow.

### Story 4.1: Backend - Appointment Status Update & Check-In

As a **secretary**,
I want to check-in patients when they arrive for their appointment,
So that doctors know which patients are ready for consultation.

**Acceptance Criteria:**

**Given** an appointment with status SCHEDULED exists
**When** SECRETARY sends PATCH /api/appointments/:id with status: CHECKED_IN
**Then** the appointment status updates to CHECKED_IN
**And** PATCH endpoint accepts status updates from SECRETARY and DOCTOR roles
**And** SECRETARY can change status: SCHEDULED → CHECKED_IN, or SCHEDULED → CANCELLED
**And** DOCTOR can change status: CHECKED_IN → IN_CONSULTATION, IN_CONSULTATION → CONSULTATION_COMPLETED
**And** invalid status transitions return 400 error with explanation
**And** DELETE /api/appointments/:id sets status to CANCELLED (SECRETARY only)
**And** updatedAt timestamp is updated
**And** French error messages for invalid transitions

---

### Story 4.2: Backend - Doctor's Appointment View (Filtered)

As a **doctor**,
I want to view my assigned appointments filtered by date and status,
So that I can see my consultation schedule.

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR
**When** I call GET /api/appointments?doctorId=<my-id>&date=<today>
**Then** I receive only appointments assigned to me
**And** I can further filter by status (e.g., CHECKED_IN to see patients ready for consultation)
**And** appointments include full patient details (name, birthDate)
**And** appointments are sorted by date and time
**And** the response is fast (<2 seconds per NFR6)

---

### Story 4.3: Frontend - Doctor Dashboard with Appointments

As a **doctor**,
I want a dashboard showing my appointments for today,
So that I can start my work immediately without navigating (UX2: role-optimized entry).

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR
**When** I am redirected to /dashboard after login
**Then** I see "Consultations du jour" as the page title
**And** a Material-UI Table shows my appointments for today
**And** columns: Patient, Heure, Motif, Statut, Actions
**And** status shown as Chip with color coding (UX3, UX14)
**And** Badge notification shows count of CHECKED_IN patients ready for consultation (UX4)
**And** I can click "Démarrer Consultation" button (large, contained variant per UX6) for CHECKED_IN appointments
**And** "Démarrer Consultation" is disabled if status is not CHECKED_IN, with tooltip explanation (UX6)
**And** I can view all my appointments (not just today) by clicking "Voir tous mes rendez-vous"
**And** loading state and empty state handled (UX9, UX10)

---

### Story 4.4: Frontend - Consultation Workflow Actions

As a **doctor**,
I want to change appointment status during consultation workflow,
So that the system tracks consultation progress.

**Acceptance Criteria:**

**Given** I am viewing an appointment with CHECKED_IN status
**When** I click "Démarrer Consultation"
**Then** the appointment status updates to IN_CONSULTATION via PATCH /api/appointments/:id
**And** a Snackbar confirms "Consultation démarrée" (UX7)
**And** the button changes to "Terminer Consultation"
**And** when I click "Terminer Consultation", status updates to CONSULTATION_COMPLETED
**And** Snackbar confirms "Consultation terminée" (UX7)
**And** feedback is shown within <200ms (UX16)
**And** after completion, I can create a prescription (link to Epic 5)

---

### Story 4.5: Frontend - Cancel Appointment (SECRETARY)

As a **secretary**,
I want to cancel appointments,
So that I can manage schedule changes.

**Acceptance Criteria:**

**Given** I am logged in as SECRETARY viewing an appointment
**When** I click "Annuler" IconButton
**Then** a confirmation Dialog appears: "Êtes-vous sûr de vouloir annuler le rendez-vous de [Patient] le [Date] à [Heure]? Cette action est irréversible." (UX8)
**And** Dialog has "Non, revenir" and "Oui, annuler le RDV" buttons (error color for confirm)
**And** on confirmation, DELETE /api/appointments/:id is called
**And** status changes to CANCELLED
**And** Snackbar shows "Rendez-vous annulé avec succès" (UX7)
**And** cancelled appointments are visually distinct in the list (Red chip per UX14)

---

## Epic 5: Medical Prescription Creation & Laboratory Submission

**Epic Goal:** Doctors can create laboratory test prescriptions after consultations and send them to the laboratory for analysis.

### Story 5.1: Backend - Prescription Model & Creation

As a **doctor**,
I want to create prescriptions for laboratory tests,
So that patients can get necessary analyses.

**Acceptance Criteria:**

**Given** Patient and User models exist
**When** I create the Prescription model
**Then** it includes: id (UUID), text (Text), status (enum: CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED), patientId (FK to Patient), doctorId (FK to User), createdAt, updatedAt
**And** PrescriptionStatus enum is defined
**And** cascade delete configured (NFR25)
**And** one-to-one relation to Result model (result field optional, AR26)
**And** Prisma migration creates prescriptions table
**And** POST /api/prescriptions creates prescription (DOCTOR only)
**And** doctorId is automatically set to current authenticated user (via @CurrentUser decorator)
**And** default status is CREATED
**And** DTOs validate: text (required, min length), patientId
**And** 400 error if patient not found
**And** 403 error if non-DOCTOR attempts to create
**And** French error messages (NFR23)

---

### Story 5.2: Backend - Send Prescription to Lab

As a **doctor**,
I want to send prescriptions to the laboratory,
So that biologists can see new analysis requests.

**Acceptance Criteria:**

**Given** a prescription with status CREATED exists
**When** DOCTOR sends PATCH /api/prescriptions/:id with status: SENT_TO_LAB
**Then** the prescription status updates to SENT_TO_LAB
**And** only DOCTOR role can change status from CREATED → SENT_TO_LAB
**And** invalid status transitions return 400 error
**And** updatedAt timestamp updated
**And** the prescription becomes visible to BIOLOGIST role

---

### Story 5.3: Backend - Prescription Filtering & Retrieval

As a **staff member**,
I want to view and filter prescriptions,
So that I can find relevant prescriptions quickly.

**Acceptance Criteria:**

**Given** prescriptions exist
**When** I call GET /api/prescriptions
**Then** I receive prescriptions list with patient and doctor details
**And** I can filter by doctorId: GET /api/prescriptions?doctorId=<id>
**And** I can filter by patientId: GET /api/prescriptions?patientId=<id>
**And** I can filter by status: GET /api/prescriptions?status=SENT_TO_LAB
**And** GET /api/prescriptions/:id returns full details including result if exists
**And** prescriptions sorted by createdAt (descending - newest first)
**And** response includes result object if prescription is COMPLETED

---

### Story 5.4: Frontend - Create Prescription Dialog (DOCTOR)

As a **doctor**,
I want to create a prescription after completing a consultation,
So that I can request laboratory tests.

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR and viewing a CONSULTATION_COMPLETED appointment
**When** I click "Créer Prescription" button (large, contained variant)
**Then** a Dialog opens with title "Créer une prescription"
**And** form contains:
  - Patient name (read-only, pre-filled from appointment)
  - Détails de la prescription (TextField multiline, 8 rows, autoFocus per UX15)
**And** placeholder text: "Ex: Analyse sanguine : NFS, glycémie à jeun, bilan lipidique"
**And** on submit, POST /api/prescriptions is called
**And** success shows Snackbar "Prescription créée avec succès" (UX7)
**And** buttons: "Annuler" left, "Créer" right (UX11, UX12)
**And** Dialog closes and prescription appears in doctor's prescription list

---

### Story 5.5: Frontend - Doctor's Prescription List with Send to Lab

As a **doctor**,
I want to view my prescriptions and send them to the laboratory,
So that biologists can start analyses.

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR on /prescriptions page
**When** I view the page
**Then** I see a Table with columns: Patient, Date, Détails (truncated), Statut, Actions
**And** I can filter by patient (Autocomplete)
**And** I can filter by status (Select)
**And** status displayed as Chip with colors (UX14):
  - CREATED: Blue (#1976D2)
  - SENT_TO_LAB: Orange (#F57C00)
  - IN_PROGRESS: Indigo (#3F51B5)
  - COMPLETED: Green (#388E3C)
**And** for prescriptions with CREATED status, I see "Envoyer au labo" button
**And** clicking "Envoyer au labo" calls PATCH /api/prescriptions/:id with status: SENT_TO_LAB
**And** Snackbar confirms "Prescription envoyée au laboratoire" (UX7)
**And** status Chip updates to SENT_TO_LAB color
**And** I can click a row to view full prescription details in a Dialog
**And** loading and empty states handled (UX9, UX10)

---

## Epic 6: Laboratory Analysis & Results Validation

**Epic Goal:** Biologists can receive prescription requests, perform analyses, record and validate results with automatic workflow progression.

### Story 6.1: Backend - Result Model & One-to-One Relationship

As a **developer**,
I want to create the Result model linked to Prescription,
So that biologists can store laboratory results.

**Acceptance Criteria:**

**Given** Prescription model exists
**When** I create the Result model
**Then** it includes: id (UUID), text (Text), prescriptionId (FK to Prescription, unique), createdAt, updatedAt
**And** prescriptionId is unique (enforces one-to-one relationship per FR26)
**And** cascade delete configured
**And** Prisma migration creates results table
**And** Prescription model has optional result relation field

---

### Story 6.2: Backend - Biologist Updates Prescription Status

As a **biologist**,
I want to update prescription status as I progress through analysis,
So that the system tracks laboratory workflow.

**Acceptance Criteria:**

**Given** a prescription with status SENT_TO_LAB exists
**When** BIOLOGIST sends PATCH /api/prescriptions/:id with status: IN_PROGRESS
**Then** the prescription status updates to IN_PROGRESS
**And** only BIOLOGIST role can change status: SENT_TO_LAB → IN_PROGRESS → COMPLETED
**And** DOCTOR cannot change these statuses (403 error)
**And** invalid transitions return 400 error with explanation
**And** updatedAt timestamp updated

---

### Story 6.3: Backend - Create Lab Result with Auto-Complete

As a **biologist**,
I want to create laboratory results for prescriptions,
So that doctors can review analysis outcomes.

**Acceptance Criteria:**

**Given** a prescription with status IN_PROGRESS or SENT_TO_LAB exists
**When** BIOLOGIST sends POST /api/results with { text, prescriptionId }
**Then** a new result is created (BIOLOGIST role only)
**And** the prescription status automatically updates to COMPLETED (FR13)
**And** 400 error if prescriptionId not found
**And** 409 error if prescription already has a result (FR27 - duplicate prevention)
**And** 403 error if non-BIOLOGIST attempts to create
**And** DTOs validate text (required, min length)
**And** French error messages
**And** the result includes the prescription relationship in response

---

### Story 6.4: Backend - Update/Correct Lab Results

As a **biologist**,
I want to update laboratory results after initial entry,
So that I can correct errors or add additional findings.

**Acceptance Criteria:**

**Given** a result exists for a prescription
**When** BIOLOGIST sends PATCH /api/results/:id with { text }
**Then** the result text is updated
**And** only BIOLOGIST role can update results
**And** updatedAt timestamp is updated
**And** prescription remains in COMPLETED status
**And** 404 error if result not found
**And** 403 error if non-BIOLOGIST attempts update

---

### Story 6.5: Backend - Biologist's Prescription View

As a **biologist**,
I want to view prescriptions sent to the laboratory,
So that I can see pending analyses.

**Acceptance Criteria:**

**Given** I am logged in as BIOLOGIST
**When** I call GET /api/prescriptions?status=SENT_TO_LAB
**Then** I receive only prescriptions with status SENT_TO_LAB or IN_PROGRESS
**And** GET /api/results returns all results I've created
**And** GET /api/results?prescriptionId=<id> returns result for specific prescription
**And** all results include prescription details (patient, doctor, prescription text)

---

### Story 6.6: Frontend - Biologist Dashboard with New Requests

As a **biologist**,
I want a dashboard showing new laboratory requests,
So that I can start work immediately (UX2: role-optimized entry).

**Acceptance Criteria:**

**Given** I am logged in as BIOLOGIST
**When** I am redirected to /dashboard after login
**Then** I see "Nouvelles demandes d'analyses" as page title
**And** a Badge shows count of prescriptions with SENT_TO_LAB status (UX4)
**And** a Table displays prescriptions with status SENT_TO_LAB or IN_PROGRESS
**And** columns: Patient, Médecin, Date, Prescription (truncated), Statut, Actions
**And** status shown as Chip (UX3, UX14)
**And** for SENT_TO_LAB prescriptions, I see "Démarrer l'analyse" button (large, contained)
**And** for IN_PROGRESS prescriptions, I see "Saisir résultats" button
**And** clicking a row opens prescription details Dialog
**And** loading and empty states handled (UX9, UX10)

---

### Story 6.7: Frontend - Start Analysis & Enter Results

As a **biologist**,
I want to mark prescriptions as in-progress and enter results,
So that I can complete the laboratory workflow.

**Acceptance Criteria:**

**Given** I am viewing a prescription with SENT_TO_LAB status
**When** I click "Démarrer l'analyse"
**Then** PATCH /api/prescriptions/:id is called with status: IN_PROGRESS
**And** Snackbar confirms "Analyse démarrée" (UX7)
**And** status Chip updates to IN_PROGRESS color (Indigo)
**And** the button changes to "Saisir résultats"
**And** when I click "Saisir résultats", a Dialog opens
**And** Dialog contains:
  - Patient name, Médecin name, Prescription text (read-only)
  - Résultats (TextField multiline, 10 rows, autoFocus per UX15)
**And** placeholder: "Ex: NFS: 5.2M/μL, Glycémie: 0.95g/L, Cholestérol: 1.8g/L - Résultats normaux"
**And** on submit, POST /api/results is called
**And** prescription status auto-updates to COMPLETED
**And** Snackbar confirms "Résultats enregistrés et validés" (UX7)
**And** status Chip updates to COMPLETED (Green)
**And** buttons: "Annuler" left, "Valider" right (UX11, UX12)
**And** if result already exists (409), show French error message (UX13)

---

### Story 6.8: Frontend - View & Edit Results

As a **biologist**,
I want to view and edit laboratory results,
So that I can correct errors or add findings.

**Acceptance Criteria:**

**Given** I am viewing a prescription with COMPLETED status
**When** I click on the prescription row
**Then** a Dialog displays full prescription and result details
**And** I see an "Modifier résultats" IconButton (edit icon per UX20)
**And** clicking edit opens an editable TextField with existing result text
**And** on submit, PATCH /api/results/:id is called
**And** Snackbar confirms "Résultats mis à jour" (UX7)
**And** updatedAt timestamp is visible
**And** only BIOLOGIST can see edit option

---

## Epic 7: Medical Results Review & Interpretation

**Epic Goal:** Doctors can review and interpret laboratory results for their patients, completing the full clinical workflow.

### Story 7.1: Backend - Doctor's Results View

As a **doctor**,
I want to view laboratory results for my prescriptions,
So that I can interpret analyses and continue patient care.

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR
**When** I call GET /api/results
**Then** I receive results for prescriptions I created (filter by my doctorId)
**And** results include full prescription details (patient, text) and result text
**And** GET /api/results/:id returns detailed result information
**And** results are sorted by createdAt (descending - newest first)
**And** only DOCTOR and BIOLOGIST roles can access /api/results endpoints
**And** response time <2 seconds (NFR6)

---

### Story 7.2: Frontend - Doctor's Results List

As a **doctor**,
I want to view laboratory results for my patients,
So that I can interpret analyses.

**Acceptance Criteria:**

**Given** I am logged in as DOCTOR on /results page
**When** I view the page
**Then** I see a Table with columns: Patient, Date prescription, Date résultats, Prescription (truncated), Actions
**And** I can filter by patient (Autocomplete)
**And** I can click "Voir détails" to open a Dialog
**And** the Dialog shows:
  - Patient name and birthDate
  - Prescription date and prescribing doctor
  - Full prescription text
  - Results date
  - Full results text
**And** loading and empty states handled (UX9, UX10)
**And** dates formatted in French

---

### Story 7.3: Frontend - Patient Record with Tabs & Complete History

As a **staff member**,
I want to view complete patient information with tabs for different sections,
So that I can see the full patient journey (UX5: tab navigation).

**Acceptance Criteria:**

**Given** I am viewing a patient's detailed page
**When** I land on the page
**Then** I see Material-UI Tabs at the top: Informations | Rendez-vous | Prescriptions | Résultats
**And** the Informations tab shows: firstName, lastName, birthDate
**And** the Rendez-vous tab shows all appointments for this patient with status chips
**And** the Prescriptions tab shows all prescriptions with status chips
**And** the Résultats tab shows all completed laboratory results
**And** tabs with new content show Badge notifications (e.g., "2" on Résultats if 2 new results) (UX4)
**And** I can navigate between tabs without page reload
**And** each tab content has loading states (UX9)

---

### Story 7.4: Frontend - Workflow Stepper in Patient View

As a **staff member**,
I want to see the complete 11-step workflow progress for a patient,
So that I understand where the patient is in their journey (UX1: workflow visualization).

**Acceptance Criteria:**

**Given** I am viewing a patient's detailed page
**When** I view the page
**Then** I see a Material-UI Stepper at the top showing all 11 steps:
  1. Demande RDV
  2. Création patient
  3. Planification RDV
  4. Check-in
  5. Pré-consultation (grayed out - out of scope)
  6. Consultation
  7. Prescription
  8. Prélèvement (grayed out - out of scope)
  9. Analyse labo
  10. Interprétation résultats
  11. Clôture (grayed out - out of scope)
**And** completed steps show checkmark icon (CheckCircle per UX20)
**And** current step is highlighted
**And** future steps are grayed out
**And** the stepper is alternativeLabel (horizontal layout)
**And** out-of-scope steps (5, 8, 11) are visually distinct (disabled appearance)

---

### Story 7.5: Frontend - Complete Workflow Validation

As a **system user**,
I want the complete clinical workflow to function end-to-end,
So that the system supports the full patient journey (FR20).

**Acceptance Criteria:**

**Given** a patient exists in the system
**When** I follow the complete workflow:
  1. SECRETARY creates patient
  2. SECRETARY creates appointment
  3. SECRETARY checks in patient (CHECKED_IN)
  4. DOCTOR starts consultation (IN_CONSULTATION)
  5. DOCTOR completes consultation (CONSULTATION_COMPLETED)
  6. DOCTOR creates prescription (CREATED)
  7. DOCTOR sends prescription to lab (SENT_TO_LAB)
  8. BIOLOGIST starts analysis (IN_PROGRESS)
  9. BIOLOGIST enters results (COMPLETED)
  10. DOCTOR views results
**Then** all transitions work seamlessly
**And** each action shows appropriate feedback (Snackbar per UX7)
**And** status updates are reflected in all views
**And** the workflow stepper shows progress accurately
**And** no step blocks or fails

---

## Epic 8: Role-Optimized Dashboards & UX Enhancements

**Epic Goal:** Each staff member experiences a personalized, intuitive interface with visual workflow guidance, immediate feedback, and role-specific optimizations.

### Story 8.1: Frontend - Material-UI Theme Configuration

As a **developer**,
I want a consistent Material-UI theme applied across the application,
So that the UI has a professional medical appearance.

**Acceptance Criteria:**

**Given** the React application
**When** I configure the Material-UI theme
**Then** primary color is #1976D2 (medical blue per NFR19)
**And** success color is #388E3C (green)
**And** warning color is #F57C00 (orange)
**And** error color is #D32F2F (red)
**And** background.default is #F5F5F5
**And** background.paper is #FFFFFF
**And** text.primary is #212121
**And** fontFamily is "Roboto", "Helvetica", "Arial", sans-serif (NFR24)
**And** button textTransform is 'none' (UX17 - no uppercase)
**And** shape.borderRadius is 8 (UX19)
**And** spacing scale uses theme.spacing() with multiples of 8px (UX18)
**And** ThemeProvider wraps the entire App
**And** CssBaseline is included for consistent baseline styles

---

### Story 8.2: Frontend - Role-Based Dashboard Routing

As a **staff member**,
I want to land on a dashboard optimized for my role after login,
So that I can start work immediately (UX2).

**Acceptance Criteria:**

**Given** I log in successfully
**When** authentication completes
**Then** I am redirected based on my role:
  - DOCTOR → /dashboard (shows "Consultations du jour")
  - BIOLOGIST → /dashboard (shows "Nouvelles demandes d'analyses")
  - SECRETARY → /dashboard (shows "Rendez-vous du jour")
  - ADMIN → /users (shows user management)
**And** each dashboard shows role-relevant information only
**And** dashboards use Material-UI Grid layout (3 columns)
**And** Cards display key metrics and action items
**And** Badges show notification counts (UX4)

---

### Story 8.3: Frontend - Navigation Layout with Sidebar

As a **staff member**,
I want a navigation sidebar with menu items based on my role,
So that I can access different sections easily.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view the application
**Then** I see a Layout with:
  - AppBar at top with: Logo/title, current user name, logout IconButton
  - Drawer (sidebar) on the left with navigation menu
**And** menu items vary by role:
  - ADMIN: Dashboard, Utilisateurs
  - DOCTOR: Dashboard, Patients (read-only), Rendez-vous, Prescriptions, Résultats
  - BIOLOGIST: Dashboard, Prescriptions, Résultats
  - SECRETARY: Dashboard, Patients, Rendez-vous
**And** menu items use Material-UI List with ListItemButton
**And** icons are used for each menu item (PersonIcon, EventIcon, LocalHospitalIcon, etc. per UX20)
**And** active route is highlighted
**And** the layout is responsive to min-width 1024px (NFR8)

---

### Story 8.4: Frontend - Global Snackbar Notification System

As a **user**,
I want to see feedback for all my actions,
So that I know operations succeeded or failed (UX7, UX16).

**Acceptance Criteria:**

**Given** I perform any action (create, update, delete)
**When** the action completes
**Then** a Snackbar appears with feedback message
**And** success messages use severity="success" with green background
**And** error messages use severity="error" with red background
**And** Snackbar auto-hides after 3 seconds
**And** Snackbar is positioned at top-center (anchorOrigin)
**And** feedback appears within <200ms of action completion (UX16)
**And** messages are in French (NFR23)
**And** messages are user-friendly and explanatory:
  - ✅ "Patient créé avec succès"
  - ✅ "Rendez-vous annulé"
  - ✅ "Prescription envoyée au laboratoire"
  - ❌ "Impossible de supprimer : des rendez-vous existent pour ce patient"

---

### Story 8.5: Frontend - Loading States & Skeletons

As a **user**,
I want to see loading indicators during data fetching,
So that I know the system is working (UX9).

**Acceptance Criteria:**

**Given** data is being fetched from the API
**When** I view a page or component
**Then** I see CircularProgress centered on the page/component
**And** tables show Skeleton rows while loading (Material-UI Skeleton component)
**And** no blank white pages are shown during loading
**And** loading indicators disappear when data is ready
**And** loading states are consistent across all pages

---

### Story 8.6: Frontend - Empty State Messages

As a **user**,
I want helpful messages when no data exists,
So that I understand why lists are empty and what to do next (UX10).

**Acceptance Criteria:**

**Given** a list/table has no data
**When** I view the empty list
**Then** I see a centered Box with:
  - Typography variant="h6" with message: "Aucun [item] trouvé"
  - Typography variant="body2" with explanation
  - Suggested action Button (outlined variant) if applicable
**And** examples:
  - Patients: "Aucun patient trouvé" + "Vous pouvez créer un nouveau patient en cliquant sur le bouton ci-dessus"
  - Appointments: "Aucun rendez-vous aujourd'hui" + "Voir le planning de la semaine" button
  - Results: "Aucun résultat disponible" + "Les résultats apparaîtront ici une fois validés par le laboratoire"
**And** empty states use the same styling across all pages

---

### Story 8.7: Frontend - Confirmation Dialogs for Destructive Actions

As a **user**,
I want confirmation before deleting or cancelling,
So that I don't accidentally lose data (UX8).

**Acceptance Criteria:**

**Given** I click a destructive action (delete, cancel)
**When** the button is clicked
**Then** a Material-UI Dialog appears with:
  - DialogTitle: "Confirmer [action]"
  - DialogContent: Specific details about what will be affected
  - DialogActions: "Non, revenir" (text button) + "Oui, [action]" (contained button, error color for very destructive actions)
**And** examples:
  - Delete user: "Êtes-vous sûr de vouloir supprimer l'utilisateur [Name]? Cette action est irréversible."
  - Cancel appointment: "Êtes-vous sûr de vouloir annuler le rendez-vous de [Patient] le [Date]? Cette action est irréversible."
**And** pressing Escape or clicking outside closes the dialog without action
**And** "Non" button is on the left, "Oui" button on the right (UX11)

---

### Story 8.8: Frontend - Consistent Button Hierarchy

As a **developer**,
I want consistent button styling across the application,
So that users recognize primary vs secondary actions (UX11, UX12).

**Acceptance Criteria:**

**Given** any page or dialog with multiple buttons
**When** I view the buttons
**Then** only ONE "contained" variant button exists per screen (primary action)
**And** primary action button is on the right
**And** secondary action buttons are on the left
**And** secondary buttons use "outlined" or "text" variant
**And** examples:
  - Dialog: "Annuler" (text, left) + "Créer" (contained, right)
  - Form: "Retour" (outlined, left) + "Sauvegarder" (contained, right)
**And** destructive primary actions use color="error"
**And** all buttons use size="large" for primary actions, size="medium" for secondary

---

### Story 8.9: Frontend - Status Color Scheme Consistency

As a **user**,
I want consistent color coding for statuses across the application,
So that I can quickly identify status at a glance (UX14).

**Acceptance Criteria:**

**Given** any status is displayed (Chip component)
**When** I view the status
**Then** colors are consistent:
  - **Appointment statuses:**
    - SCHEDULED: primary (Blue #1976D2)
    - CHECKED_IN: warning (Orange #F57C00)
    - IN_CONSULTATION: secondary (Purple)
    - CONSULTATION_COMPLETED/COMPLETED: success (Green #388E3C)
    - CANCELLED: error (Red #D32F2F)
  - **Prescription statuses:**
    - CREATED: primary (Blue #1976D2)
    - SENT_TO_LAB: warning (Orange #F57C00)
    - IN_PROGRESS: info (Indigo #3F51B5)
    - COMPLETED: success (Green #388E3C)
**And** Chip component includes an icon when appropriate (CheckCircle, HourglassEmpty, etc. per UX20)
**And** status labels are in French
**And** Chip size="small" for table cells

---

### Story 8.10: Frontend - Responsive Spacing & Layout

As a **developer**,
I want consistent spacing throughout the application,
So that the UI feels cohesive and professional (UX18, UX19).

**Acceptance Criteria:**

**Given** any page or component
**When** I implement spacing
**Then** I use theme.spacing() with standard multiples:
  - spacing(0.5) = 4px (tight spacing)
  - spacing(1) = 8px (small spacing)
  - spacing(2) = 16px (medium spacing)
  - spacing(3) = 24px (large spacing, Card padding)
  - spacing(4) = 32px (section margins)
**And** Cards use padding: theme.spacing(3)
**And** Dialogs use padding: theme.spacing(2)
**And** Section bottom margins use spacing(4)
**And** Grid container spacing is spacing(3)
**And** all Cards and Paper components have borderRadius: 8px (UX19)
**And** the layout feels balanced and not cramped

---

### Story 8.11: Frontend - Accessible Forms with Validation

As a **user**,
I want forms to guide me with clear labels, validation, and autofocus,
So that I can complete forms efficiently (UX15).

**Acceptance Criteria:**

**Given** any form in the application
**When** I open the form
**Then** the first input field has autoFocus (UX15)
**And** all required fields are marked with asterisk (*)
**And** TextFields show error state when validation fails
**And** helper text shows validation errors in French
**And** validation happens on blur (not every keystroke)
**And** submit button is disabled until form is valid
**And** form submits on Enter key press (for single-field forms like search)
**And** labels are clear and in French

---

### Story 8.12: Backend - Consistent API Response Format

As a **frontend developer**,
I want all API responses to follow a consistent format,
So that I can handle responses predictably (FR18).

**Acceptance Criteria:**

**Given** any API endpoint
**When** I call the endpoint
**Then** success responses follow format:
```json
{
  "data": { ... },
  "message": "Action réussie" // optional
}
```
**And** error responses follow format:
```json
{
  "statusCode": 400,
  "message": "Description de l'erreur en français",
  "error": "Bad Request"
}
```
**And** validation errors include field-specific messages
**And** all error messages are user-friendly and in French (NFR23, UX13)
**And** explanatory messages suggest solutions where applicable
