# Ajout de la Gestion des Examens d'Imagerie

## Résumé des Modifications

Une nouvelle fonctionnalité légère a été ajoutée pour permettre aux médecins de prescrire des examens d'imagerie médicale (radiologie, échographie, scanner, IRM) directement depuis la page de consultation.

## Approche Technique

**Principe:** Réutilisation maximale du système existant des prescriptions biologiques avec un simple champ `category` pour distinguer "BIOLOGIE" et "IMAGERIE".

## Modifications Apportées

### Backend

#### 1. Base de Données (Prisma)
- **Fichier:** `backend/prisma/schema.prisma`
- **Modification:** Ajout d'un champ optionnel `category` dans le modèle `Prescription`
  ```prisma
  category String? @default("BIOLOGIE")  // "BIOLOGIE" ou "IMAGERIE"
  ```
- **Migration:** `20260125040856_add_prescription_category`

#### 2. DTO
- **Fichier:** `backend/src/prescriptions/dto/create-prescription.dto.ts`
- **Modification:** Ajout du champ optionnel `category`
  ```typescript
  @IsString()
  @IsOptional()
  category?: string;
  ```

### Frontend

#### 1. Types TypeScript
- **Fichier:** `frontend/src/types/Prescription.ts`
- **Modifications:**
  - Ajout du champ `category?: string` dans l'interface `Prescription`
  - Ajout du champ `category?: string` dans l'interface `CreatePrescriptionDto`

#### 2. Page de Consultation
- **Fichier:** `frontend/src/pages/Appointments/AppointmentConsultationPage.tsx`
- **Modifications principales:**

**a) Nouveaux états React:**
```typescript
const [imagingRequests, setImagingRequests] = useState<Prescription[]>([]);
const [imagingLoading, setImagingLoading] = useState(false);
const [imagingError, setImagingError] = useState('');
const [imagingSuccess, setImagingSuccess] = useState('');
```

**b) Nouvelle fonction de création:**
```typescript
const handleCreateImagingRequest = async () => {
  // Crée une prescription avec category: 'IMAGERIE'
}
```

**c) Filtrage des prescriptions:**
- Les prescriptions sont maintenant filtrées par catégorie lors du chargement
- Biologie: `category === 'BIOLOGIE'` ou `category` non défini
- Imagerie: `category === 'IMAGERIE'`

**d) Nouvel onglet:**
- Ajout d'un onglet "Examens Imagerie" (index 4)
- L'onglet "Conclusion & suivi" passe à l'index 5

## Interface Utilisateur

### Onglet "Examens Imagerie"

L'interface est identique à celle des examens biologiques, avec les différences suivantes:

1. **Titre:** "Demande d'examen d'imagerie"
2. **Placeholder:** "Ex: Radio thorax, Echo abdominale, Scanner..."
3. **Label bouton:** "Prescrire examen imagerie"
4. **Couleur:** Badge violet (secondary) au lieu de bleu (primary)
5. **Fond des cartes:** Violet clair (#faf8ff) avec bordure (#e3d5ff)

### Champs du Formulaire

- **Type d'examen** (texte libre)
  - Exemples: Radio thorax, Échographie abdominale, Scanner cérébral, IRM genou
- **Urgence** (select)
  - Standard
  - Urgente
- **Indication clinique** (textarea)
  - Contexte médical justifiant l'examen
- **Envoyer au service d'imagerie** (select)
  - Oui / Non

### Affichage des Prescriptions

Les examens prescrits s'affichent avec:
- Badge violet indiquant le statut
- Texte complet de la prescription
- Date de prescription

## Workflow

Le workflow est identique à celui des examens biologiques:

1. **CREATED** → Prescription créée par le médecin
2. **SENT_TO_LAB** → Envoyée au service d'imagerie
3. **IN_PROGRESS** → Examen en cours
4. **RESULTS_AVAILABLE** → Résultats disponibles
5. **COMPLETED** → Validé par le médecin

## Rétrocompatibilité

- Les prescriptions existantes sans champ `category` sont automatiquement considérées comme "BIOLOGIE"
- Aucune migration de données nécessaire
- Le système continue de fonctionner normalement pour les prescriptions biologiques

## Test de la Fonctionnalité

### Étapes de Test

1. **Démarrer l'application**
   ```bash
   # Backend
   cd backend && npm run start:dev
   
   # Frontend
   cd frontend && npm start
   ```

2. **Se connecter en tant que médecin**
   - Email: `doctor@hospital.com`
   - Mot de passe: `password123`

3. **Accéder à une consultation**
   - Aller dans le tableau de bord médecin
   - Cliquer sur "Consulter" pour un rendez-vous

4. **Tester la prescription d'imagerie**
   - Cliquer sur l'onglet "Examens Imagerie"
   - Remplir le formulaire:
     - Type: "Radio thorax face + profil"
     - Urgence: Standard
     - Indication: "Suspicion de pneumonie"
   - Cliquer sur "Prescrire examen imagerie"
   - Vérifier que la prescription apparaît avec un badge violet

5. **Vérifier la séparation**
   - L'onglet "Examens Biologiques" ne doit afficher que les prescriptions biologiques
   - L'onglet "Examens Imagerie" ne doit afficher que les prescriptions d'imagerie

## Avantages de cette Approche

✅ **Ultra léger:** Seulement 1 champ en base de données
✅ **Réutilisation:** Même logique métier, même workflow
✅ **Visuel clair:** Distinction par couleur (bleu vs violet)
✅ **Maintenable:** Pas de duplication de code
✅ **Évolutif:** Facile d'ajouter d'autres catégories si nécessaire

## Fichiers Modifiés

### Backend (3 fichiers)
1. `backend/prisma/schema.prisma`
2. `backend/src/prescriptions/dto/create-prescription.dto.ts`
3. Migration: `backend/prisma/migrations/20260125040856_add_prescription_category/`

### Frontend (2 fichiers)
1. `frontend/src/types/Prescription.ts`
2. `frontend/src/pages/Appointments/AppointmentConsultationPage.tsx`

## Notes Importantes

- Le champ `category` est optionnel pour maintenir la compatibilité
- Les variables d'état `labType`, `labUrgency`, `labComment` sont réutilisées pour l'imagerie (économie de code)
- La fonction `formatLabStatus` est partagée entre biologie et imagerie
- Le workflow complet (envoi au labo, collecte, analyse) fonctionne pour les deux catégories

## Prochaines Évolutions Possibles

- Ajouter des types d'examens prédéfinis (liste déroulante)
- Permettre l'upload de résultats d'imagerie (images DICOM, PDF)
- Ajouter un rôle "Radiologue" pour valider les résultats
- Créer un tableau de bord spécifique pour le service d'imagerie
