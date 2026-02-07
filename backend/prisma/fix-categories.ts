import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Mise à jour des catégories de prescriptions...');

  // Mettre à jour toutes les prescriptions sans catégorie pour les marquer comme BIOLOGIE
  const result = await prisma.prescription.updateMany({
    where: {
      OR: [
        { category: null },
        { category: '' },
      ],
    },
    data: {
      category: 'BIOLOGIE',
    },
  });

  console.log(`✅ ${result.count} prescriptions mises à jour avec la catégorie BIOLOGIE`);
  console.log('');
  console.log('📊 Résumé:');
  
  const bioCount = await prisma.prescription.count({
    where: { category: 'BIOLOGIE' },
  });
  
  const imagingCount = await prisma.prescription.count({
    where: { category: 'IMAGERIE' },
  });

  console.log(`  - Prescriptions BIOLOGIE: ${bioCount}`);
  console.log(`  - Prescriptions IMAGERIE: ${imagingCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
