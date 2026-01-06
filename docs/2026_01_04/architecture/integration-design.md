# Integration Design - Complete Clinical Workflow

**Project**: Hospital Management System MVP
**Date**: 2026-01-04
**Version**: 1.0
**Architecture**: Monorepo (Backend + Frontend)

---

## Executive Summary

This document specifies how backend modules, frontend components, and the database integrate to deliver the complete clinical workflow. It covers API contracts, error handling patterns, testing strategies, and deployment considerations.

**Key Integration Points**:
- Frontend ↔ Backend: RESTful API with session cookies
- Backend ↔ Database: Prisma ORM with type-safe queries
- Module Communication: Dependency injection and service layer
- Error Propagation: Standardized error handling across layers

---

## System Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components (TypeScript)                             │ │
│  │    - Role-based Dashboards                                 │ │
│  │    - Form Dialogs (Vitals, Consultation, etc.)            │ │
│  │    - Lists and Tables                                      │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │  API Service Layer (Axios)                                 │ │
│  │    - appointmentService.checkIn()                          │ │
│  │    - appointmentService.enterVitals()                      │ │
│  │    - prescriptionService.collectSample()                   │ │
│  └────────────────┬───────────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ HTTP + Session Cookie
                    │ Content-Type: application/json
                    │ withCredentials: true
                    │
┌───────────────────▼──────────────────────────────────────────────┐
│                        BACKEND LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Controllers (NestJS)                                      │ │
│  │    @UseGuards(AuthGuard, RolesGuard)                      │ │
│  │    @Roles(Role.NURSE)                                     │ │
│  │    async enterVitals(@Param, @Body, @CurrentUser)         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │  Service Layer (Business Logic)                           │ │
│  │    - State transition validation                          │ │
│  │    - Data transformation                                  │ │
│  │    - Transaction management                               │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │  Prisma Client (ORM)                                      │ │
│  │    - Type-safe queries                                    │ │
│  │    - Automatic type generation                            │ │
│  │    - Transaction support                                  │ │
│  └────────────────┬───────────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ SQL Queries
                    │
┌───────────────────▼──────────────────────────────────────────────┐
│                    DATABASE LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                       │ │
│  │    - Tables: users, patients, appointments, etc.          │ │
│  │    - Constraints: FK, Unique, NOT NULL                    │ │
│  │    - Indexes: status, date, patientId, etc.              │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## Frontend-Backend Integration

### API Contract Pattern

**Request Format**:
```typescript
// Frontend Service
async enterVitals(appointmentId: string, data: VitalsFormData) {
  return api.patch(`/appointments/${appointmentId}/vitals`, data);
}

// API Client Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // CRITICAL: Send session cookie
});
```

**Response Format**:
```typescript
// Success (200/201)
{
  data: { /* entity data */ },
  message: "Operation successful"
}

// Error (400/403/404/500)
{
  statusCode: 400,
  message: "Descriptive error message",
  error: "Bad Request"
}
```

### Session Management Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│ Frontend │                 │ Backend  │                 │ Database │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ POST /auth/login           │                            │
     ├───────────────────────────>│                            │
     │ {email, password}          │                            │
     │                            │ SELECT * FROM users        │
     │                            │ WHERE email = ?            │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ bcrypt.compare(password)   │
     │                            │                            │
     │                            │ session.userId = user.id   │
     │                            │                            │
     │ Set-Cookie: sessionId      │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ GET /appointments          │                            │
     │ Cookie: sessionId          │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ AuthGuard checks session   │
     │                            │                            │
     │                            │ SELECT * FROM users        │
     │                            │ WHERE id = session.userId  │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ RolesGuard checks role     │
     │                            │                            │
     │                            │ SELECT * FROM appointments │
     │                            ├───────────────────────────>│
     │                            │                            │
     │ 200 OK                     │                            │
     │ {data: [...]}              │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
```

---

## Backend Module Integration

### Module Dependency Injection

**AppointmentsModule Structure**:
```typescript
// appointments.module.ts
@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],  // Export for other modules
})
export class AppointmentsModule {}

// app.module.ts
@Module({
  imports: [
    PrismaModule,       // Global module (provides PrismaService)
    AuthModule,         // Global module (provides guards)
    AppointmentsModule,
    PrescriptionsModule,
    ResultsModule,
    // ...
  ],
})
export class AppModule {}
```

### Service Layer Pattern

```typescript
// appointments.service.ts
@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}  // Injected by NestJS

  async checkIn(id: string, userId: string): Promise<Appointment> {
    // 1. Validation: Check appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    // 2. Business Logic: Validate state transition
    if (appointment.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Cannot check in: appointment status must be SCHEDULED'
      );
    }

    // 3. Data Mutation: Update with transaction safety
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async enterVitals(
    id: string,
    data: EnterVitalsDto,
    userId: string
  ): Promise<Appointment> {
    // 1. Validation
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    // 2. State validation
    if (appointment.status !== 'CHECKED_IN') {
      throw new BadRequestException(
        'Cannot enter vitals: appointment status must be CHECKED_IN'
      );
    }

    // 3. Update with audit trail
    return this.prisma.appointment.update({
      where: { id },
      data: {
        vitals: data.vitals as any,  // JSON field
        medicalHistoryNotes: data.medicalHistoryNotes,
        vitalsEnteredBy: userId,
        vitalsEnteredAt: new Date(),
        status: 'IN_CONSULTATION',  // Auto-transition
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }
}
```

### Cross-Module Communication

**Scenario**: When biologist creates result, update prescription status

```typescript
// results.service.ts
@Injectable()
export class ResultsService {
  constructor(
    private prisma: PrismaService,
    private prescriptionsService: PrescriptionsService  // Inject other service
  ) {}

  async create(data: CreateResultDto, userId: string): Promise<Result> {
    // 1. Validate prescription exists and is in correct state
    const prescription = await this.prescriptionsService.findOne(
      data.prescriptionId
    );

    if (prescription.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Cannot create result: prescription status must be IN_PROGRESS'
      );
    }

    // 2. Check for duplicate result
    const existing = await this.prisma.result.findUnique({
      where: { prescriptionId: data.prescriptionId },
    });

    if (existing) {
      throw new ConflictException(
        'Result already exists for this prescription'
      );
    }

    // 3. Create result and update prescription in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create result
      const result = await tx.result.create({
        data: {
          text: data.text,
          data: data.data,
          prescriptionId: data.prescriptionId,
          validatedBy: userId,
          validatedAt: new Date(),
        },
        include: {
          prescription: {
            include: {
              patient: true,
              doctor: true,
            },
          },
        },
      });

      // Update prescription status
      await tx.prescription.update({
        where: { id: data.prescriptionId },
        data: {
          status: 'RESULTS_AVAILABLE',  // NOT COMPLETED
          analysisCompletedAt: new Date(),
        },
      });

      return result;
    });
  }
}
```

**Benefits**:
- Single transaction ensures data consistency
- Service method encapsulates complex logic
- Type safety from TypeScript and Prisma

---

## Error Handling Integration

### Backend Error Handling

```typescript
// Global exception filter (main.ts)
app.useGlobalFilters(new AllExceptionsFilter());

// Custom exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma errors
      if (exception.code === 'P2002') {
        status = 409;
        message = 'Resource already exists';
      } else if (exception.code === 'P2025') {
        status = 404;
        message = 'Resource not found';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Frontend Error Handling

```typescript
// API interceptor for global error handling
api.interceptors.response.use(
  (response) => response.data,  // Unwrap {data, message}
  (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data.message || 'An error occurred';

      // Handle specific errors
      if (error.response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        enqueueSnackbar('You do not have permission for this action', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(message, { variant: 'error' });
      }
    } else if (error.request) {
      // Request made but no response
      enqueueSnackbar('Unable to connect to server', { variant: 'error' });
    } else {
      // Other error
      enqueueSnackbar('An unexpected error occurred', { variant: 'error' });
    }

    return Promise.reject(error);
  }
);
```

---

## State Transition Validation

### Centralized Validation Service

```typescript
// state-validator.service.ts
@Injectable()
export class StateValidatorService {
  validateAppointmentTransition(
    currentStatus: AppointmentStatus,
    targetStatus: AppointmentStatus
  ): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      SCHEDULED: ['CHECKED_IN', 'CANCELLED'],
      CHECKED_IN: ['IN_CONSULTATION', 'CANCELLED'],
      IN_CONSULTATION: ['CONSULTATION_COMPLETED', 'CANCELLED'],
      CONSULTATION_COMPLETED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[currentStatus];

    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${targetStatus}`
      );
    }
  }

  validatePrescriptionTransition(
    currentStatus: PrescriptionStatus,
    targetStatus: PrescriptionStatus
  ): void {
    const validTransitions: Record<PrescriptionStatus, PrescriptionStatus[]> = {
      CREATED: ['SENT_TO_LAB'],
      SENT_TO_LAB: ['SAMPLE_COLLECTED'],
      SAMPLE_COLLECTED: ['IN_PROGRESS'],
      IN_PROGRESS: ['RESULTS_AVAILABLE'],
      RESULTS_AVAILABLE: ['COMPLETED'],
      COMPLETED: [],
    };

    const allowed = validTransitions[currentStatus];

    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${targetStatus}`
      );
    }
  }
}
```

**Usage in Service**:
```typescript
async completeConsultation(id: string, notes: string): Promise<Appointment> {
  const appointment = await this.prisma.appointment.findUnique({ where: { id } });

  // Validate transition
  this.stateValidator.validateAppointmentTransition(
    appointment.status,
    'CONSULTATION_COMPLETED'
  );

  return this.prisma.appointment.update({
    where: { id },
    data: {
      status: 'CONSULTATION_COMPLETED',
      consultationNotes: notes,
      consultedAt: new Date(),
    },
  });
}
```

---

## Testing Strategy

### Unit Testing (Backend Services)

```typescript
// appointments.service.spec.ts
describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('checkIn', () => {
    it('should check in a scheduled appointment', async () => {
      const appointment = {
        id: '1',
        status: 'SCHEDULED',
        date: new Date(),
      };

      jest.spyOn(prisma.appointment, 'findUnique').mockResolvedValue(appointment);
      jest.spyOn(prisma.appointment, 'update').mockResolvedValue({
        ...appointment,
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      });

      const result = await service.checkIn('1', 'user-id');

      expect(result.status).toBe('CHECKED_IN');
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CHECKED_IN' }),
        })
      );
    });

    it('should throw error for non-scheduled appointment', async () => {
      jest.spyOn(prisma.appointment, 'findUnique').mockResolvedValue({
        id: '1',
        status: 'CHECKED_IN',
      });

      await expect(service.checkIn('1', 'user-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
```

### Integration Testing (API Endpoints)

```typescript
// appointments.controller.spec.ts (e2e)
describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  describe('PATCH /appointments/:id/check-in', () => {
    it('should check in appointment as SECRETARY', async () => {
      // Create test appointment
      const appointment = await prisma.appointment.create({
        data: {
          date: new Date(),
          motif: 'Test',
          status: 'SCHEDULED',
          patientId: 'patient-id',
          doctorId: 'doctor-id',
        },
      });

      // Login as secretary
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'secretary@hospital.com', password: 'secretary123' });

      const cookie = loginResponse.headers['set-cookie'];

      // Check in
      const response = await request(app.getHttpServer())
        .patch(`/appointments/${appointment.id}/check-in`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.data.status).toBe('CHECKED_IN');
      expect(response.body.data.checkedInAt).toBeDefined();
    });

    it('should return 403 for DOCTOR role', async () => {
      // Login as doctor
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'doctor@hospital.com', password: 'doctor123' });

      const cookie = loginResponse.headers['set-cookie'];

      await request(app.getHttpServer())
        .patch(`/appointments/any-id/check-in`)
        .set('Cookie', cookie)
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Manual End-to-End Testing

**Test Case**: Complete Patient Journey

```typescript
// Complete workflow test script
async function testCompleteWorkflow() {
  // 1. Login as SECRETARY
  const secretary = await login('secretary@hospital.com', 'secretary123');

  // 2. Create patient
  const patient = await createPatient({
    firstName: 'Test',
    lastName: 'Patient',
    birthDate: '1990-01-01',
  });

  // 3. Create appointment
  const appointment = await createAppointment({
    patientId: patient.id,
    doctorId: doctorId,
    date: new Date(),
    motif: 'Test consultation',
  });

  // 4. Check in patient
  await checkIn(appointment.id);
  assert(appointment.status === 'CHECKED_IN');

  // 5. Login as NURSE
  const nurse = await login('nurse@hospital.com', 'nurse123');

  // 6. Enter vitals
  await enterVitals(appointment.id, {
    vitals: { weight: 70, height: 170, /* ... */ },
  });
  assert(appointment.status === 'IN_CONSULTATION');

  // 7. Login as DOCTOR
  const doctor = await login('doctor@hospital.com', 'doctor123');

  // 8. Complete consultation
  await completeConsultation(appointment.id, 'Consultation notes');
  assert(appointment.status === 'CONSULTATION_COMPLETED');

  // 9. Create and send prescription
  const prescription = await createPrescription({
    patientId: patient.id,
    text: 'CBC',
  });
  await sendToLab(prescription.id);
  assert(prescription.status === 'SENT_TO_LAB');

  // 10. Login as NURSE, collect sample
  await collectSample(prescription.id);
  assert(prescription.status === 'SAMPLE_COLLECTED');

  // 11. Login as BIOLOGIST
  const biologist = await login('biologist@hospital.com', 'biologist123');

  // 12. Start analysis
  await startAnalysis(prescription.id);
  assert(prescription.status === 'IN_PROGRESS');

  // 13. Enter results
  const result = await createResult({
    prescriptionId: prescription.id,
    text: 'All values normal',
  });
  assert(prescription.status === 'RESULTS_AVAILABLE');

  // 14. Login as DOCTOR, review result
  await reviewResult(result.id, 'No action required');
  assert(prescription.status === 'COMPLETED');

  // 15. Login as SECRETARY, close appointment
  await closeAppointment(appointment.id, {
    billingAmount: 150,
    billingStatus: 'PAID',
  });
  assert(appointment.status === 'COMPLETED');

  console.log('✅ Complete workflow test passed!');
}
```

---

## Deployment Integration

### Environment Configuration

```env
# Backend (.env)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/hospital_prod
SESSION_SECRET=production-secret-key-change-me
CORS_ORIGIN=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
```

### Build Process

```bash
# Backend build
cd backend
npm run build
# Output: dist/ folder

# Frontend build
cd frontend
npm run build
# Output: dist/ folder

# Combined build (from root)
npm run build
```

### Production Deployment

```
Server
├── /opt/hospital-app/
│   ├── backend/
│   │   ├── dist/              (compiled NestJS)
│   │   ├── prisma/            (schema and migrations)
│   │   ├── node_modules/
│   │   └── package.json
│   │
│   ├── frontend/
│   │   └── dist/              (built React app)
│   │
│   └── docker-compose.yml     (optional)
```

### Process Manager (PM2)

```bash
# Start backend
pm2 start backend/dist/main.js --name hospital-backend

# Serve frontend with nginx
# /etc/nginx/sites-available/hospital
server {
  listen 80;
  server_name hospital.local;

  # Frontend
  location / {
    root /opt/hospital-app/frontend/dist;
    try_files $uri /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## Monitoring & Logging

### Backend Logging

```typescript
// Structured logging with winston
import { Logger } from '@nestjs/common';

export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  async checkIn(id: string, userId: string): Promise<Appointment> {
    this.logger.log(`Checking in appointment ${id} by user ${userId}`);

    try {
      const result = await this.prisma.appointment.update({/* ... */});
      this.logger.log(`Successfully checked in appointment ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to check in appointment ${id}: ${error.message}`);
      throw error;
    }
  }
}
```

### Frontend Logging

```typescript
// Simple console logging for MVP
export const logEvent = (category: string, action: string, details?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[${category}] ${action}`, details);
  }
};

// Usage
logEvent('Appointment', 'Check-in', { appointmentId: '123' });
```

---

## Performance Optimization

### Database Query Optimization

```typescript
// Use select to reduce payload
const appointments = await this.prisma.appointment.findMany({
  where: { status: 'CHECKED_IN' },
  select: {
    id: true,
    date: true,
    motif: true,
    status: true,
    patient: {
      select: { firstName: true, lastName: true },
    },
    doctor: {
      select: { name: true },
    },
  },
});

// Use include only when needed
const appointment = await this.prisma.appointment.findUnique({
  where: { id },
  include: {
    patient: true,
    doctor: true,
  },
});
```

### Frontend Optimization

```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchPatients(query);
  }, 300),
  []
);

// Pagination for large lists
const [page, setPage] = useState(1);
const [limit] = useState(50);

useEffect(() => {
  fetchAppointments({ limit, offset: (page - 1) * limit });
}, [page, limit]);
```

---

## Security Considerations

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Input Validation

```typescript
// Use DTOs with class-validator
export class EnterVitalsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VitalsDataDto)
  vitals: VitalsDataDto;

  @IsOptional()
  @MaxLength(2000)
  medicalHistoryNotes?: string;
}

export class VitalsDataDto {
  @IsNumber()
  @Min(1)
  @Max(500)
  weight: number;

  @IsNumber()
  @Min(50)
  @Max(250)
  height: number;

  // ... other fields
}
```

### SQL Injection Protection

Prisma automatically protects against SQL injection:

```typescript
// Safe: Prisma parameterizes queries
await this.prisma.appointment.findMany({
  where: { patientId: userInput },  // Safely parameterized
});

// Never use raw SQL with user input unless parameterized
await this.prisma.$queryRaw`
  SELECT * FROM appointments
  WHERE patientId = ${userInput}  // Still safe with Prisma
`;
```

---

## References

- Architecture Design: `/docs/2026_01_04/architecture/architecture.md`
- API Specification: `/docs/2026_01_04/architecture/api-spec.md`
- Database Design: `/docs/2026_01_04/architecture/database-design.md`
- Frontend Architecture: `/docs/2026_01_04/architecture/frontend-architecture.md`
- NestJS Documentation: https://docs.nestjs.com/
- Prisma Documentation: https://www.prisma.io/docs

---

**Document Status**: COMPLETE
**Next Steps**: Begin implementation with backend migrations
**Author**: System Architecture Specialist
**Last Updated**: 2026-01-04
