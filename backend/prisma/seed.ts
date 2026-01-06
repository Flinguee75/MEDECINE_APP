import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des utilisateurs
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const biologistPassword = await bcrypt.hash('biologist123', 10);
  const secretaryPassword = await bcrypt.hash('secretary123', 10);
  const nursePassword = await bcrypt.hash('nurse123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@hospital.com' },
    update: {},
    create: {
      name: 'Dr. Martin',
      email: 'doctor@hospital.com',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const biologist = await prisma.user.upsert({
    where: { email: 'biologist@hospital.com' },
    update: {},
    create: {
      name: 'Marie Biologiste',
      email: 'biologist@hospital.com',
      password: biologistPassword,
      role: 'BIOLOGIST',
    },
  });

  const secretary = await prisma.user.upsert({
    where: { email: 'secretary@hospital.com' },
    update: {},
    create: {
      name: 'Sophie Secrétaire',
      email: 'secretary@hospital.com',
      password: secretaryPassword,
      role: 'SECRETARY',
    },
  });

  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@hospital.com' },
    update: {},
    create: {
      name: 'Nadia Infirmière',
      email: 'nurse@hospital.com',
      password: nursePassword,
      role: 'NURSE',
    },
  });

  console.log('✅ Users created');

  // Créer des patients
  const patient1 = await prisma.patient.upsert({
    where: { id: '3e1d2a5e-9b4f-4f9a-8d2b-6c2b8b6f6e31' },
    update: {},
    create: {
      id: '3e1d2a5e-9b4f-4f9a-8d2b-6c2b8b6f6e31',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: new Date('1980-05-15'),
      sex: 'M',
      phone: '0600000001',
      address: '12 rue des Lilas',
      emergencyContact: 'Claire Dupont - 0609090909',
      insurance: 'CNAM',
      idNumber: 'CI-000001',
      consentMedicalData: true,
      consentContact: true,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { id: '5f7a2c9d-1b6e-4ad2-9c07-3d7f8b9c0a12' },
    update: {},
    create: {
      id: '5f7a2c9d-1b6e-4ad2-9c07-3d7f8b9c0a12',
      firstName: 'Marie',
      lastName: 'Martin',
      birthDate: new Date('1990-03-20'),
      sex: 'F',
      phone: '0601020304',
      address: '8 avenue du Parc',
      emergencyContact: 'Paul Martin - 0608080808',
      insurance: 'Mutuelle Santé Plus',
      idNumber: 'CI-000002',
      consentMedicalData: true,
      consentContact: true,
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { id: '8c2f4b7e-6a19-4f3e-b2c1-1d4e5f6a7b8c' },
    update: {},
    create: {
      id: '8c2f4b7e-6a19-4f3e-b2c1-1d4e5f6a7b8c',
      firstName: 'Pierre',
      lastName: 'Durand',
      birthDate: new Date('1975-10-12'),
      sex: 'M',
      phone: '0605060708',
      address: '4 boulevard Central',
      emergencyContact: 'Sarah Durand - 0607070707',
      insurance: 'CNAM',
      idNumber: 'CI-000003',
      consentMedicalData: true,
      consentContact: true,
    },
  });

  console.log('✅ Patients created');

  // Créer des rendez-vous pour démontrer les différents états du workflow

  // 1. Appointment SCHEDULED - à enregistrer
  await prisma.appointment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      date: new Date('2026-01-05T10:00:00'),
      motif: 'Consultation de suivi',
      patientId: patient1.id,
      doctorId: doctor.id,
      status: 'SCHEDULED',
    },
  });

  // 2. Appointment CHECKED_IN - en attente de constantes vitales
  await prisma.appointment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      date: new Date('2026-01-05T14:00:00'),
      motif: 'Première consultation',
      patientId: patient2.id,
      doctorId: doctor.id,
      status: 'CHECKED_IN',
      checkedInAt: new Date('2026-01-05T13:45:00'),
    },
  });

  // 3. Appointment IN_CONSULTATION - en attente de consultation
  await prisma.appointment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      date: new Date('2026-01-05T15:30:00'),
      motif: 'Résultats d\'analyse',
      patientId: patient3.id,
      doctorId: doctor.id,
      status: 'IN_CONSULTATION',
      checkedInAt: new Date('2026-01-05T15:15:00'),
      vitalsEnteredAt: new Date('2026-01-05T15:20:00'),
      vitalsEnteredBy: nurse.id,
      vitals: {
        weight: 75.5,
        height: 175,
        temperature: 37.2,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
        },
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      },
      medicalHistoryNotes: 'Patient reports seasonal allergies to pollen',
    },
  });

  // 4. Appointment CONSULTATION_COMPLETED - en attente de clôture
  await prisma.appointment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000104' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000104',
      date: new Date('2026-01-04T09:00:00'),
      motif: 'Examen de routine',
      patientId: patient1.id,
      doctorId: doctor.id,
      status: 'CONSULTATION_COMPLETED',
      checkedInAt: new Date('2026-01-04T08:45:00'),
      vitalsEnteredAt: new Date('2026-01-04T08:50:00'),
      vitalsEnteredBy: nurse.id,
      consultedAt: new Date('2026-01-04T09:20:00'),
      consultedBy: doctor.id,
      vitals: {
        weight: 70,
        height: 170,
        temperature: 37.0,
        bloodPressure: { systolic: 118, diastolic: 78 },
        heartRate: 68,
      },
      consultationNotes: 'Patient in good health. All vitals within normal range. Recommend routine blood work.',
    },
  });

  console.log('✅ Appointments created');

  // Créer des prescriptions pour démontrer les différents états du workflow

  // 1. Prescription CREATED - en attente d'envoi au labo
  const prescription1 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      text: 'Analyse sanguine complète : NFS, glycémie à jeun, bilan lipidique',
      status: 'CREATED',
      patientId: patient1.id,
      doctorId: doctor.id,
    },
  });

  // 2. Prescription SENT_TO_LAB - en attente de collecte d'échantillon
  const prescription2 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      text: 'Test d\'allergie : pollen, acariens, poils d\'animaux',
      status: 'SENT_TO_LAB',
      patientId: patient2.id,
      doctorId: doctor.id,
    },
  });

  // 3. Prescription SAMPLE_COLLECTED - en attente d'analyse
  const prescription3 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000203' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000203',
      text: 'Bilan hépatique complet',
      status: 'SAMPLE_COLLECTED',
      patientId: patient3.id,
      doctorId: doctor.id,
      nurseId: nurse.id,
      sampleCollectedAt: new Date('2026-01-05T10:30:00'),
    },
  });

  // 4. Prescription IN_PROGRESS - en cours d'analyse
  const prescription4 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000204' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000204',
      text: 'Radiographie thoracique',
      status: 'IN_PROGRESS',
      patientId: patient1.id,
      doctorId: doctor.id,
      nurseId: nurse.id,
      sampleCollectedAt: new Date('2026-01-04T14:00:00'),
      analysisStartedAt: new Date('2026-01-04T14:30:00'),
    },
  });

  // 5. Prescription RESULTS_AVAILABLE - résultats disponibles, en attente de revue
  const prescription5 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000205' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000205',
      text: 'Test allergologique complet',
      status: 'RESULTS_AVAILABLE',
      patientId: patient3.id,
      doctorId: doctor.id,
      nurseId: nurse.id,
      sampleCollectedAt: new Date('2026-01-03T10:00:00'),
      analysisStartedAt: new Date('2026-01-03T11:00:00'),
      analysisCompletedAt: new Date('2026-01-03T16:00:00'),
    },
  });

  // 6. Prescription COMPLETED - terminé avec revue du médecin
  const prescription6 = await prisma.prescription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000206' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000206',
      text: 'Hémogramme complet',
      status: 'COMPLETED',
      patientId: patient2.id,
      doctorId: doctor.id,
      nurseId: nurse.id,
      sampleCollectedAt: new Date('2026-01-02T09:00:00'),
      analysisStartedAt: new Date('2026-01-02T10:00:00'),
      analysisCompletedAt: new Date('2026-01-02T15:00:00'),
    },
  });

  console.log('✅ Prescriptions created');

  // Créer des résultats pour démontrer les états

  // Résultat validé par biologiste, en attente de revue
  await prisma.result.upsert({
    where: { id: '00000000-0000-0000-0000-000000000301' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000301',
      text: `RÉSULTATS TEST ALLERGOLOGIQUE

Allergènes testés : pollen, acariens, poils d'animaux, aliments courants

Résultats :
- Pollen de graminées : POSITIF (niveau 3/5)
- Acariens : NÉGATIF
- Poils de chat : POSITIF (niveau 2/5)
- Aliments : Tous NÉGATIFS

Conclusion technique : Présence d'anticorps IgE spécifiques au pollen et aux poils de chat.`,
      prescriptionId: prescription5.id,
      validatedBy: biologist.id,
      validatedAt: new Date('2026-01-03T16:00:00'),
    },
  });

  // Résultat complété avec revue du médecin
  await prisma.result.upsert({
    where: { id: '00000000-0000-0000-0000-000000000302' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000302',
      text: `HÉMOGRAMME COMPLET

Globules rouges : 4.8 M/μL (normal : 4.5-5.5)
Hémoglobine : 14.5 g/dL (normal : 13-17)
Hématocrite : 42% (normal : 40-50)
Globules blancs : 7200 /μL (normal : 4000-11000)
Plaquettes : 250000 /μL (normal : 150000-400000)

Conclusion technique : Tous les paramètres dans les normes.`,
      prescriptionId: prescription6.id,
      validatedBy: biologist.id,
      validatedAt: new Date('2026-01-02T15:00:00'),
      reviewedBy: doctor.id,
      reviewedAt: new Date('2026-01-02T17:00:00'),
      interpretation: `Interprétation médicale :

Hémogramme complet dans les limites de la normale. Pas de signe d'anémie, d'infection ou de trouble de la coagulation. Patient en bonne santé hématologique.

Recommandation : Aucun traitement nécessaire. Contrôle de routine dans 1 an.`,
    },
  });

  console.log('✅ Results created');

  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📊 Database state summary:');
  console.log('  - 5 users (ADMIN, DOCTOR, BIOLOGIST, SECRETARY, NURSE)');
  console.log('  - 3 patients');
  console.log('  - 4 appointments (SCHEDULED, CHECKED_IN, IN_CONSULTATION, CONSULTATION_COMPLETED)');
  console.log('  - 6 prescriptions (all workflow states)');
  console.log('  - 2 results (one awaiting review, one completed)');
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('  - Admin: admin@hospital.com / admin123');
  console.log('  - Doctor: doctor@hospital.com / doctor123');
  console.log('  - Biologist: biologist@hospital.com / biologist123');
  console.log('  - Secretary: secretary@hospital.com / secretary123');
  console.log('  - Nurse: nurse@hospital.com / nurse123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
