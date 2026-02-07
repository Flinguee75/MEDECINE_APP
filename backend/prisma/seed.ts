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
  const radiologistPassword = await bcrypt.hash('radiologist123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {
      name: 'Aïssata Koné',
    },
    create: {
      name: 'Aïssata Koné',
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@hospital.com' },
    update: {
      name: 'Nadège Kouamé',
    },
    create: {
      name: 'Nadège Kouamé',
      email: 'doctor@hospital.com',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const biologist = await prisma.user.upsert({
    where: { email: 'biologist@hospital.com' },
    update: {
      name: 'Akissi Yao',
    },
    create: {
      name: 'Akissi Yao',
      email: 'biologist@hospital.com',
      password: biologistPassword,
      role: 'BIOLOGIST',
    },
  });

  const secretary = await prisma.user.upsert({
    where: { email: 'secretary@hospital.com' },
    update: {
      name: 'Awa Traoré',
    },
    create: {
      name: 'Awa Traoré',
      email: 'secretary@hospital.com',
      password: secretaryPassword,
      role: 'SECRETARY',
    },
  });

  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@hospital.com' },
    update: {
      name: 'Mariam Konan',
    },
    create: {
      name: 'Mariam Konan',
      email: 'nurse@hospital.com',
      password: nursePassword,
      role: 'NURSE',
    },
  });

  const radiologist = await prisma.user.upsert({
    where: { email: 'radiologist@hospital.com' },
    update: {
      name: 'Dr. Kouassi (Radiologue)',
    },
    create: {
      name: 'Dr. Kouassi (Radiologue)',
      email: 'radiologist@hospital.com',
      password: radiologistPassword,
      role: 'RADIOLOGIST',
    },
  });

  console.log('✅ Users created');
  console.log('🎉 Seeding complete (accounts only)!');
  console.log('');
  console.log('📊 Database state summary:');
  console.log('  - 6 users (ADMIN, DOCTOR, BIOLOGIST, SECRETARY, NURSE, RADIOLOGIST)');
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('  - Admin: admin@hospital.com / admin123');
  console.log('  - Doctor: doctor@hospital.com / doctor123');
  console.log('  - Biologist: biologist@hospital.com / biologist123');
  console.log('  - Secretary: secretary@hospital.com / secretary123');
  console.log('  - Nurse: nurse@hospital.com / nurse123');
  console.log('  - Radiologist: radiologist@hospital.com / radiologist123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
