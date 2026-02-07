import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour corriger les prescriptions d'imagerie existantes
 * - S'assurer que toutes les prescriptions d'imagerie ont category = 'IMAGERIE'
 * - Vérifier qu'aucune prescription d'imagerie n'a le statut SENT_TO_LAB
 */
async function main() {
  console.log('🔍 Vérification des prescriptions d\'imagerie...\n');

  // Trouver toutes les prescriptions qui contiennent des mots-clés d'imagerie
  const allPrescriptions = await prisma.prescription.findMany({
    include: {
      patient: true,
      doctor: true,
    },
  });

  const imagingKeywords = [
    'radio',
    'échographie',
    'scanner',
    'irm',
    'imagerie',
    'thorax',
    'abdomen',
    'radiographie',
    'radiologie',
    'radiologue',
    'imaging',
    'x-ray',
    'ct scan',
    'mri',
    'ultrasound',
  ];

  let updatedCount = 0;
  let issuesFound = 0;

  for (const prescription of allPrescriptions) {
    const textLower = prescription.text.toLowerCase();
    const isImaging = imagingKeywords.some(keyword => textLower.includes(keyword));

    if (isImaging) {
      console.log(`\n📋 Prescription trouvée: ${prescription.text.substring(0, 60)}...`);
      console.log(`   Catégorie actuelle: ${prescription.category || 'NULL'}`);
      console.log(`   Statut: ${prescription.status}`);

      // Vérifier si la catégorie est incorrecte
      if (prescription.category !== 'IMAGERIE') {
        console.log(`   ⚠️  Correction de la catégorie: ${prescription.category} → IMAGERIE`);
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: { category: 'IMAGERIE' },
        });
        updatedCount++;
      }

      // Vérifier si le statut est problématique
      if (prescription.status === 'SENT_TO_LAB') {
        console.log(`   ❌ PROBLÈME: Une prescription d'imagerie ne devrait pas avoir le statut SENT_TO_LAB`);
        console.log(`      → Cette prescription devrait être gérée par le radiologue, pas le biologiste`);
        issuesFound++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Résumé:');
  console.log(`   - Prescriptions mises à jour: ${updatedCount}`);
  console.log(`   - Problèmes de statut trouvés: ${issuesFound}`);
  
  if (issuesFound > 0) {
    console.log('\n⚠️  ATTENTION: Des prescriptions d\'imagerie ont le statut SENT_TO_LAB');
    console.log('   Ces prescriptions ne devraient pas être dans le workflow du laboratoire.');
    console.log('   Elles devraient être gérées par le radiologue avec un workflow séparé.');
  }

  console.log('\n✅ Vérification terminée!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
