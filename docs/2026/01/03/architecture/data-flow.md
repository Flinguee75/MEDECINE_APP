# Flux de Données - Module Prescriptions

## Document de Contrôle

- **Projet**: Système de Gestion Hospitalière MVP (7 jours)
- **Module**: Prescriptions Data Flow
- **Version**: 1.0
- **Date**: 2026-01-03
- **Type**: Diagrammes de flux et séquences

---

## Table des Matières

1. [Vue d'Ensemble des Flux](#vue-densemble-des-flux)
2. [Flux Backend → Frontend](#flux-backend--frontend)
3. [Flux de Données par Cas d'Usage](#flux-de-données-par-cas-dusage)
4. [Gestion des États Frontend](#gestion-des-états-frontend)
5. [Synchronisation et Mise à Jour](#synchronisation-et-mise-à-jour)
6. [Optimisation et Caching](#optimisation-et-caching)

---

## Vue d'Ensemble des Flux

### Architecture Globale des Données

```
┌──────────────────────────────────────────────────────────────┐
│                    Data Flow Architecture                     │
│                                                               │
│  ┌────────────┐       ┌────────────┐       ┌──────────────┐ │
│  │  Frontend  │       │   Backend  │       │  PostgreSQL  │ │
│  │   (React)  │◄─────►│  (NestJS)  │◄─────►│   Database   │ │
│  │            │ HTTP  │            │ Prisma│              │ │
│  │  - State   │ REST  │  - Service │  ORM  │  - Tables    │ │
│  │  - UI      │ JSON  │  - Guards  │       │  - Relations │ │
│  └────────────┘       └────────────┘       └──────────────┘ │
│         │                    │                      │        │
│    User Actions        Business Logic          Data Layer   │
│    - create()          - validate()            - CREATE     │
│    - findAll()         - transform()           - SELECT     │
│    - update()          - authorize()           - UPDATE     │
│                                                 - DELETE     │
└──────────────────────────────────────────────────────────────┘
```

### Couches d'Application

**Frontend (React)**:
- **UI Layer**: Composants Material-UI
- **State Layer**: useState, useEffect
- **Service Layer**: prescriptionService.ts
- **API Layer**: axios instance

**Backend (NestJS)**:
- **Controller Layer**: Routes HTTP
- **Guard Layer**: AuthGuard, RolesGuard
- **Service Layer**: Business logic
- **Repository Layer**: PrismaService

**Database (PostgreSQL)**:
- **Tables**: prescriptions, patients, users, results
- **Relations**: Foreign keys avec CASCADE
- **Indexes**: patientId, doctorId, status

---

## Flux Backend → Frontend

### Flux de Données Complet

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Complete Data Flow                                │
│                                                                       │
│  User Action → Frontend Component → Service → API Request →          │
│  Backend Controller → Guards → Service → Prisma → Database →         │
│  Response → Transform → API Response → Frontend Service →            │
│  Component State Update → UI Re-render                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Étape 1: Action Utilisateur → Frontend

```
User
  │
  │ Clique "Créer Prescription"
  ▼
┌─────────────────────────────────┐
│  CreatePrescription.tsx         │
│                                 │
│  State:                         │
│  - selectedPatient: Patient     │
│  - text: string                 │
│  - loading: boolean             │
│  - error: string                │
│                                 │
│  handleSubmit():                │
│  1. Validate input (frontend)  │
│  2. Call prescriptionService   │
└────────────┬────────────────────┘
             │
             │ prescriptionService.create({text, patientId})
             ▼
┌─────────────────────────────────┐
│  prescriptionService.ts         │
│                                 │
│  create(dto):                   │
│  const response = await         │
│    api.post('/prescriptions',   │
│      dto)                       │
│  return response.data           │
└────────────┬────────────────────┘
             │
             │ HTTP POST /api/prescriptions
             │ Headers: Cookie: connect.sid
             │ Body: { text, patientId }
             ▼
```

### Étape 2: Backend Processing

```
┌─────────────────────────────────┐
│  NestJS Backend                 │
│                                 │
│  1. Request received            │
│  2. Session middleware extracts │
│     userId from cookie          │
│  3. Route to Controller         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  PrescriptionsController        │
│                                 │
│  @Post()                        │
│  @UseGuards(AuthGuard)          │
│  @UseGuards(RolesGuard)         │
│  @Roles(DOCTOR, ADMIN)          │
│                                 │
│  create(@Body() dto,            │
│         @CurrentUser() userId)  │
└────────────┬────────────────────┘
             │
             │ Guards execution
             ▼
┌─────────────────────────────────┐
│  AuthGuard                      │
│  - Check session.userId exists  │
│  - If not: throw 401            │
└────────────┬────────────────────┘
             │ ✓ Authenticated
             ▼
┌─────────────────────────────────┐
│  RolesGuard                     │
│  - Fetch user from DB           │
│  - Check role in [DOCTOR,ADMIN] │
│  - If not: throw 403            │
└────────────┬────────────────────┘
             │ ✓ Authorized
             ▼
┌─────────────────────────────────┐
│  PrescriptionsService           │
│                                 │
│  create(dto, userId):           │
│  1. Validate patient exists     │
│  2. Create prescription         │
│     - text from DTO             │
│     - patientId from DTO        │
│     - doctorId = userId         │
│     - status = CREATED          │
│  3. Include relations           │
│  4. Return prescription         │
└────────────┬────────────────────┘
             │
             │ prisma.prescription.create()
             ▼
┌─────────────────────────────────┐
│  PrismaService                  │
│                                 │
│  prescription.create({          │
│    data: {                      │
│      text,                      │
│      patientId,                 │
│      doctorId,                  │
│      status: 'CREATED'          │
│    },                           │
│    include: {                   │
│      patient: true,             │
│      doctor: { select: {...} } │
│    }                            │
│  })                             │
└────────────┬────────────────────┘
             │
             │ SQL INSERT + SELECT (JOIN)
             ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│                                 │
│  INSERT INTO prescriptions      │
│  (id, text, status,             │
│   patientId, doctorId,          │
│   createdAt, updatedAt)         │
│  VALUES (uuid(), ?, 'CREATED',  │
│          ?, ?, NOW(), NOW())    │
│  RETURNING *                    │
│                                 │
│  + JOIN patients ON ...         │
│  + JOIN users ON ...            │
└────────────┬────────────────────┘
             │
             │ Prescription with relations
             ▼
```

### Étape 3: Response → Frontend

```
┌─────────────────────────────────┐
│  Backend Response               │
│                                 │
│  {                              │
│    data: {                      │
│      id: "550e...",             │
│      text: "...",               │
│      status: "CREATED",         │
│      patient: {...},            │
│      doctor: {...}              │
│    },                           │
│    message: "Prescription       │
│             créée avec succès"  │
│  }                              │
└────────────┬────────────────────┘
             │
             │ HTTP 201 Created
             │ Content-Type: application/json
             ▼
┌─────────────────────────────────┐
│  prescriptionService.ts         │
│                                 │
│  return response.data           │
│  // { data: Prescription,       │
│  //   message: string }         │
└────────────┬────────────────────┘
             │
             │ Promise<{data, message}>
             ▼
┌─────────────────────────────────┐
│  CreatePrescription.tsx         │
│                                 │
│  try {                          │
│    const result = await         │
│      prescriptionService.create │
│    setSuccess(result.message)   │
│    setTimeout(() =>             │
│      navigate('/prescriptions') │
│    , 1500)                      │
│  } catch (err) {                │
│    setError(err.response        │
│      ?.data?.message)           │
│  }                              │
└─────────────────────────────────┘
             │
             │ State update
             ▼
┌─────────────────────────────────┐
│  UI Re-render                   │
│                                 │
│  - Alert: "Prescription créée   │
│            avec succès"         │
│  - Navigate to /prescriptions   │
│  - List refreshed               │
└─────────────────────────────────┘
```

---

## Flux de Données par Cas d'Usage

### Cas d'Usage 1: Lister les Prescriptions

```
┌──────────────────────────────────────────────────────────────┐
│  UC1: List Prescriptions with Filters                        │
└──────────────────────────────────────────────────────────────┘

User selects filter → Frontend
  │
  │ PrescriptionsList.tsx
  │ useEffect(() => { loadPrescriptions() }, [statusFilter])
  ▼
prescriptionService.findAll({ status: 'SENT_TO_LAB' })
  │
  │ GET /api/prescriptions?status=SENT_TO_LAB
  ▼
Backend: PrescriptionsController.findAll(@Query('status') status)
  │
  │ AuthGuard ✓ (tous les rôles)
  ▼
PrescriptionsService.findAll(undefined, undefined, status)
  │
  │ Build where clause: { status: 'SENT_TO_LAB' }
  ▼
prisma.prescription.findMany({
  where: { status: 'SENT_TO_LAB' },
  include: { patient: true, doctor: {...} },
  orderBy: { createdAt: 'desc' }
})
  │
  │ SQL: SELECT * FROM prescriptions
  │      WHERE status = 'SENT_TO_LAB'
  │      ORDER BY createdAt DESC
  │      + JOIN patients, users
  ▼
Database returns: Prescription[]
  │
  │ Response: { data: Prescription[] }
  ▼
Frontend: setPrescriptions(response.data)
  │
  │ UI Update
  ▼
Table displays:
- Filtered prescriptions
- Badges colorés (SENT_TO_LAB → blue)
- Boutons conditionnels selon rôle
```

### Cas d'Usage 2: Transition de Statut

```
┌──────────────────────────────────────────────────────────────┐
│  UC2: Status Transition (DOCTOR sends to lab)                │
└──────────────────────────────────────────────────────────────┘

User clicks "Envoyer au labo"
  │
  │ PrescriptionsList.tsx
  │ handleStatusUpdate(prescriptionId, 'SENT_TO_LAB')
  ▼
prescriptionService.updateStatus(id, 'SENT_TO_LAB')
  │
  │ PATCH /api/prescriptions/:id
  │ Body: { status: 'SENT_TO_LAB' }
  ▼
Backend: PrescriptionsController.update(
  id, { status: 'SENT_TO_LAB' }, userId, session
)
  │
  │ AuthGuard ✓
  │ RolesGuard ✓ (DOCTOR, BIOLOGIST, ADMIN)
  ▼
Get user: prisma.user.findUnique({ where: { id: userId } })
  │
  │ User.role = DOCTOR
  ▼
PrescriptionsService.update(id, dto, userId, userRole)
  │
  │ 1. findOne(id) - get current prescription
  ▼
Current prescription:
  - status: CREATED
  - doctorId: userId (same as current user) ✓
  │
  │ 2. validateStatusTransition(
  │      'CREATED', 'SENT_TO_LAB', 'DOCTOR', userId, doctorId
  │    )
  ▼
Validation State Machine:
  - IF currentStatus === CREATED ✓
  - AND newStatus === SENT_TO_LAB ✓
  - AND userRole === DOCTOR ✓
  - AND userId === doctorId ✓
  - THEN allow
  │
  │ 3. prisma.prescription.update()
  ▼
Database:
  UPDATE prescriptions
  SET status = 'SENT_TO_LAB',
      updatedAt = NOW()
  WHERE id = ?
  │
  │ Response: Prescription updated
  ▼
Frontend: loadPrescriptions() // Refresh list
  │
  │ UI Update
  ▼
Table updated:
- Badge: "Envoyée au labo" (blue)
- Bouton "Envoyer au labo" disparu
- Apparaît dans vue BIOLOGIST
```

### Cas d'Usage 3: Biologiste Traite Prescription

```
┌──────────────────────────────────────────────────────────────┐
│  UC3: Biologist Processes Prescription                       │
└──────────────────────────────────────────────────────────────┘

Step 1: Biologist views queue
  │
  │ PrescriptionsList.tsx (BIOLOGIST)
  │ Filter: status=SENT_TO_LAB
  ▼
GET /api/prescriptions?status=SENT_TO_LAB
  │
  │ Returns prescriptions waiting for processing
  ▼
UI displays:
- Liste prescriptions SENT_TO_LAB
- Bouton "Commencer" visible pour chaque

User clicks "Commencer"
  │
  │ PATCH /api/prescriptions/:id
  │ Body: { status: 'IN_PROGRESS' }
  ▼
validateStatusTransition:
  - SENT_TO_LAB → IN_PROGRESS ✓
  - Role: BIOLOGIST ✓
  - Allow
  │
  │ UPDATE status = 'IN_PROGRESS'
  ▼
Prescription moved from queue to "En cours"

[Biologiste travaille au laboratoire - hors système]

User clicks "Terminer"
  │
  │ PATCH /api/prescriptions/:id
  │ Body: { status: 'COMPLETED' }
  ▼
validateStatusTransition:
  - IN_PROGRESS → COMPLETED ✓
  - Role: BIOLOGIST ✓
  - Allow
  │
  │ UPDATE status = 'COMPLETED'
  ▼
Prescription ready for Result (Jour 5)
UI displays:
- Badge "Terminée" (green)
- Disparaît de liste "En cours"
- Médecin peut consulter
```

---

## Gestion des États Frontend

### État Local (useState)

#### PrescriptionsList.tsx

```typescript
// State management
const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');

// Data flow
useEffect(() => {
  loadPrescriptions();
}, [statusFilter]); // Re-fetch when filter changes

const loadPrescriptions = async () => {
  setLoading(true); // Loading state
  try {
    const response = await prescriptionService.findAll({ status: statusFilter });
    setPrescriptions(response.data); // Update data
    setError(''); // Clear error
  } catch (err: any) {
    setError(err.response?.data?.message);
  } finally {
    setLoading(false); // Loading complete
  }
};
```

**Flux de données**:
```
User change filter
  ↓
setStatusFilter('SENT_TO_LAB')
  ↓
useEffect triggered
  ↓
loadPrescriptions()
  ↓
setLoading(true)
  ↓
API call
  ↓
setPrescriptions(data)
  ↓
setLoading(false)
  ↓
Component re-render
  ↓
UI updated with filtered data
```

#### CreatePrescription.tsx

```typescript
// Form state
const [patients, setPatients] = useState<Patient[]>([]);
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [text, setText] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

// Initialization
useEffect(() => {
  loadPatients(); // Load once on mount
}, []);

// Form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const result = await prescriptionService.create({ text, patientId });
    setSuccess(result.message);
    setTimeout(() => navigate('/prescriptions'), 1500);
  } catch (err) {
    setError(err.response?.data?.message);
  } finally {
    setLoading(false);
  }
};
```

**Flux de données**:
```
Component mount
  ↓
useEffect(() => loadPatients())
  ↓
setPatients(data)
  ↓
User selects patient → setSelectedPatient()
User types text → setText()
  ↓
User submits
  ↓
handleSubmit()
  ↓
setLoading(true)
  ↓
API call
  ↓
Success: setSuccess() → navigate()
Error: setError()
  ↓
setLoading(false)
  ↓
Re-render with feedback
```

### État Global (AuthContext)

```typescript
// AuthContext provides global auth state
const { user } = useAuth();

// Used for conditional rendering
{user?.role === 'DOCTOR' && <CreateButton />}
{user?.role === 'BIOLOGIST' && <ProcessButton />}

// User data structure
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'BIOLOGIST' | 'SECRETARY';
}
```

**Flux de données**:
```
Login successful
  ↓
AuthContext.setUser(userData)
  ↓
All consuming components re-render
  ↓
Conditional UI based on user.role
  ↓
API calls include session cookie (automatic)
```

---

## Synchronisation et Mise à Jour

### Pattern: Load → Update → Reload

```
┌──────────────────────────────────────────────────────────────┐
│  Synchronization Pattern                                      │
└──────────────────────────────────────────────────────────────┘

Initial Load:
  Component mount → loadPrescriptions() → setState(data)

User Action (update status):
  Click button → API call → Success → loadPrescriptions()
                                    → setState(refreshed data)

Filter Change:
  setFilter(newValue) → useEffect triggered → loadPrescriptions()
                                            → setState(filtered data)
```

**Exemple Complet**:
```typescript
// 1. Initial load
useEffect(() => {
  loadPrescriptions();
}, []);

// 2. User updates status
const handleStatusUpdate = async (id, newStatus) => {
  try {
    await prescriptionService.updateStatus(id, newStatus);
    loadPrescriptions(); // ← Reload to sync state
  } catch (err) {
    setError(err.message);
  }
};

// 3. UI always shows current DB state
```

### Optimistic vs Pessimistic Updates

**Current Pattern: Pessimistic (MVP)**
```
User action → API call → Wait response → Update UI
```

**Avantage**:
- UI toujours synchronisée avec DB
- Pas de rollback complexe
- Simple à implémenter

**Future: Optimistic Updates**
```
User action → Update UI immediately → API call → On error: rollback UI
```

**Bénéfice**:
- UI réactive
- Meilleure UX
- Complexité accrue

---

## Optimisation et Caching

### Stratégies Actuelles (MVP)

#### 1. Include Relations (Backend)

```typescript
// Une seule requête SQL au lieu de N+1
include: {
  patient: true,
  doctor: { select: {...} },
  result: true
}

// SQL généré par Prisma:
SELECT p.*,
       pat.id as patient_id, pat.firstName, pat.lastName,
       doc.id as doctor_id, doc.name, doc.email,
       r.id as result_id, r.text as result_text
FROM prescriptions p
LEFT JOIN patients pat ON p.patientId = pat.id
LEFT JOIN users doc ON p.doctorId = doc.id
LEFT JOIN results r ON r.prescriptionId = p.id
```

**Avantage**: Temps de réponse réduit (< 100ms)

#### 2. Database Indexes

```prisma
@@index([patientId])  // Filtrage rapide par patient
@@index([doctorId])   // Filtrage rapide par médecin
@@index([status])     // Filtrage rapide par statut
```

**Avantage**: Requêtes filtrées O(log n) au lieu de O(n)

#### 3. Pas de Pagination (MVP)

**Justification**:
- Volume attendu: < 1000 prescriptions
- Liste complète acceptable: < 300ms
- Simplification développement

**Future**: Pagination si volume > 1000

### Stratégies Futures (Post-MVP)

#### 1. React Query / SWR

```typescript
// Caching automatique
const { data, error, isLoading } = useQuery(
  ['prescriptions', statusFilter],
  () => prescriptionService.findAll({ status: statusFilter }),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

**Avantages**:
- Cache frontend automatique
- Refetch intelligent
- Optimistic updates
- Invalidation cache

#### 2. Redis Backend Cache

```typescript
// Cache pour requêtes fréquentes
const cacheKey = `prescriptions:${status}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await prisma.prescription.findMany(...);
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
return data;
```

**Avantages**:
- Réduction charge DB
- Temps de réponse < 50ms
- Scalabilité

#### 3. WebSocket pour Sync Temps Réel

```typescript
// Backend émet événement
socket.emit('prescription:updated', { id, status });

// Frontend écoute
socket.on('prescription:updated', (data) => {
  setPrescriptions(prev =>
    prev.map(p => p.id === data.id ? { ...p, status: data.status } : p)
  );
});
```

**Avantages**:
- Synchronisation automatique multi-utilisateurs
- Pas de polling
- UX améliorée

---

## Diagrammes de Flux Détaillés

### Diagramme de Séquence: Création Complète

```
DOCTOR    UI         Service    Controller  Guards    Service   Prisma   DB
  │        │            │            │         │         │         │      │
  │ Select │            │            │         │         │         │      │
  │ patient│            │            │         │         │         │      │
  │ Type   │            │            │         │         │         │      │
  │ text   │            │            │         │         │         │      │
  │ Click  │            │            │         │         │         │      │
  │ Create │            │            │         │         │         │      │
  ├────────►            │            │         │         │         │      │
  │        │ Validate   │            │         │         │         │      │
  │        │ frontend   │            │         │         │         │      │
  │        ├────────────►            │         │         │         │      │
  │        │            │ POST /api  │         │         │         │      │
  │        │            ├────────────►         │         │         │      │
  │        │            │            │ Auth    │         │         │      │
  │        │            │            ├─────────►         │         │      │
  │        │            │            │         │ Check   │         │      │
  │        │            │            │         │ session │         │      │
  │        │            │            │◄────────┤         │         │      │
  │        │            │            │  ✓ OK   │         │         │      │
  │        │            │            ├─────────►         │         │      │
  │        │            │            │         │ Roles   │         │      │
  │        │            │            │         ├─────────►         │      │
  │        │            │            │         │         │ Get user│      │
  │        │            │            │         │         ├─────────►      │
  │        │            │            │         │         │         │ SEL  │
  │        │            │            │         │         │◄────────┤      │
  │        │            │            │         │◄────────┤         │      │
  │        │            │            │◄────────┤  ✓ OK   │         │      │
  │        │            │            │  Exec   │         │         │      │
  │        │            │            ├─────────────────────►        │      │
  │        │            │            │         │         │ create()│      │
  │        │            │            │         │         ├─────────►      │
  │        │            │            │         │         │         │ Find │
  │        │            │            │         │         │         │ pat  │
  │        │            │            │         │         │         ├──────►
  │        │            │            │         │         │         │◄─────┤
  │        │            │            │         │         │         │  ✓   │
  │        │            │            │         │         │         ├──────►
  │        │            │            │         │         │         │ INS  │
  │        │            │            │         │         │         │◄─────┤
  │        │            │            │         │         │◄────────┤      │
  │        │            │            │◄────────────────────┤ Prescr│      │
  │        │            │◄───────────┤         │         │         │      │
  │        │◄───────────┤ 201        │         │         │         │      │
  │◄───────┤ Created    │            │         │         │         │      │
  │ Success│            │            │         │         │         │      │
  │ Message│            │            │         │         │         │      │
  │ Navigate           │            │         │         │         │      │
  │ /prescriptions     │            │         │         │         │      │
```

### Diagramme de Flux: Filtrage et Affichage

```
┌─────────────────────────────────────────────────────────────────┐
│  User Interface (PrescriptionsList)                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Filter      │  │  Prescriptions│  │  Action      │         │
│  │  Dropdown    │  │  Table        │  │  Buttons     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ onChange        │                 │ onClick
          ▼                 │                 ▼
    setStatusFilter('SENT_TO_LAB')   handleStatusUpdate(id, status)
          │                 │                 │
          │                 │                 │
          ▼                 │                 ▼
    useEffect triggered     │           API call PATCH
          │                 │                 │
          │                 │                 │
          ▼                 │                 ▼
    loadPrescriptions()     │           Response received
          │                 │                 │
          │                 │                 │
          ▼                 │                 ▼
    GET /api/prescriptions  │           loadPrescriptions()
       ?status=SENT_TO_LAB  │                 │
          │                 │                 │
          ▼                 │                 ▼
    Response: { data: [...] }            Refresh data
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 │
    setPrescriptions(data) ─────────────────┘
          │
          │
          ▼
    Component re-render
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Updated UI                                                      │
│  - Table shows filtered prescriptions                            │
│  - Badges show correct colors                                    │
│  - Buttons show based on role + status                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Résumé des Flux de Données

### Points Clés

1. **Flux Unidirectionnel**: User → UI → Service → API → Backend → DB
2. **Synchronisation**: Reload après chaque modification
3. **État Local**: useState pour données composant
4. **État Global**: AuthContext pour utilisateur
5. **Validation Multi-niveau**: Frontend + Backend (Guards + Service)
6. **Relations Imbriquées**: Include Prisma pour performance
7. **Type Safety**: TypeScript end-to-end

### Optimisations Appliquées

**Backend**:
- ✅ Include relations (pas de N+1)
- ✅ Index database sur champs filtrés
- ✅ Transactions Prisma pour cohérence

**Frontend**:
- ✅ Validation avant API call
- ✅ Loading states pour UX
- ✅ Error handling centralisé
- ✅ Conditional rendering

### Améliorations Futures

**Performance**:
- Cache Redis backend
- React Query frontend
- Pagination server-side

**Temps Réel**:
- WebSocket pour sync multi-users
- Optimistic updates
- Offline support

---

**Document généré le**: 2026-01-03
**Statut**: ✅ Complete
**Type**: Data Flow Documentation
