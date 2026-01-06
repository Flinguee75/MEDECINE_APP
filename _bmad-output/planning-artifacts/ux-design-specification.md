---
stepsCompleted: [1, 2, 3, 4, 6, 8, 11, 12, 14]
status: completed
inputDocuments:
  - "pdf/Cahier des charges MVP Gestion Hospitalière.pdf"
  - "pdf/Parcours Patient Clinique.pdf"
  - "docs/WIREFRAMES.md"
  - "docs/2026_01_04/specs/dashboard-navigation.md"
  - "docs/2026_01_04/specs/requirements.md"
  - "docs/2026_01_04/specs/user-stories.md"
---

# UX Design Specification - MEDECINE_APP

**Author:** Tidianecisse
**Date:** 2026-01-05
**Project:** Hospital Management System - MVP (7-day delivery)
**Status:** In Progress

---

## Executive Summary

### Project Vision

MEDECINE_APP est un système de gestion hospitalière desktop qui **fluidifie le workflow clinique complet** - de la prise de rendez-vous à la clôture administrative. L'objectif principal : **chaque persona sait exactement où en est le dossier et quelle est sa prochaine action**.

Le système gère un parcours patient en **11 étapes** impliquant 5 rôles distincts (Secrétariat, Infirmier, Médecin, Biologiste, Administrateur) avec des transitions d'état claires entre chaque étape.

### Target Users

**5 personas avec besoins distincts :**

1. **Secrétariat** - Gère flux administratif (patients, RDV, check-in, clôture/facturation)
   - Besoin : Vue claire des RDV à traiter, actions rapides

2. **Infirmier** - Prépare patients (constantes vitales, prélèvements)
   - Besoin : Liste patients en attente, saisie rapide de constantes

3. **Médecin** - Consulte, diagnostique, prescrit, interprète résultats
   - Besoin : **Point d'entrée direct sur consultations du jour**, visibilité sur constantes, envoi prescription simple

4. **Biologiste** - Analyse échantillons, valide résultats
   - Besoin : Notification claire nouvelles demandes, saisie résultats fluide

5. **Administrateur** - Gestion système
   - Besoin : Dashboard overview, gestion utilisateurs

**Caractéristiques communes :**
- Personnel médical (pas forcément tech-savvy)
- Utilisation quotidienne intensive
- Desktop uniquement (min 1024px)
- Environnement hôpital (pression temporelle, besoin de rapidité)

### Key Design Challenges

**Challenge #1 : Visibilité de l'état du dossier**
- **Problème** : Utilisateurs ne savent pas où en est le patient dans le workflow
- **Impact** : Confusion, perte de temps, erreurs de workflow
- **Solution UX** : Indicateur de progression visuel (stepper) montrant tout le parcours avec étape actuelle mise en évidence

**Challenge #2 : Actions contextuelles peu claires**
- **Problème** : Médecin ne sait pas "comment commencer la consultation", envoi/réception prescriptions floue
- **Impact** : Hésitation, frustration, formation nécessaire
- **Solution UX** : Boutons d'action primaires évidents ("Démarrer Consultation", "Créer Prescription") avec états désactivés si prérequis non remplis

**Challenge #3 : Navigation cloisonnée mais fluide**
- **Problème** : Chaque rôle doit voir SEULEMENT sa partie mais pouvoir naviguer dans le dossier
- **Impact** : Équilibre entre simplicité et accès à l'information
- **Solution UX** : Navigation par onglets avec permissions par rôle, informations read-only pour contexte

**Challenge #4 : Point d'entrée inadapté pour le médecin**
- **Problème** : Médecin ne devrait pas passer par dashboard générique
- **Impact** : Clic inutile, workflow ralenti
- **Solution UX** : Landing page médecin = "Consultations du jour" directement

### Design Opportunities

**Opportunity #1 : Workflow Visualization**
- Créer un **stepper visuel** montrant les 11 étapes du parcours patient
- Chaque persona voit tout le parcours mais n'interagit qu'avec sa partie
- Inspiration : Tracking colis Amazon, stepper Material-UI

**Opportunity #2 : Contextual CTAs (Call-to-Action)**
- Boutons primaires **géants et évidents** pour l'action suivante
- États désactivés avec message explicatif ("En attente des constantes")
- Notifications visuelles (badge, bandeau) pour nouvelles demandes

**Opportunity #3 : Role-Optimized Dashboards**
- Médecin → Direct "Consultations du jour" avec statut constantes
- Infirmier → "Patients à préparer" avec liste chronologique
- Biologiste → "Nouvelles demandes" avec badge notification
- Secrétariat → Vue administrative (check-in, clôture)

**Opportunity #4 : Smart Tab Navigation**
- Onglets dans dossier patient avec badges de notification
- Permissions adaptées par rôle (lecture vs écriture)
- Contexte accessible sans quitter la vue principale

---

## Core User Experience

### Defining Experience

**L'expérience centrale de MEDECINE_APP** repose sur un principe fondamental : **chaque persona sait instantanément où en est le dossier patient et quelle est sa prochaine action**.

Le système agit comme un **espace de collaboration partagé** où chaque rôle voit sa partie du workflow tout en comprenant le contexte global. Il n'y a pas de "handoff" manuel - les transitions se font automatiquement avec notifications proactives.

**Actions principales par persona :**
- **Médecin** : Consulter un patient (voir constantes, diagnostiquer, prescrire)
- **Infirmier** : Préparer un patient (saisir constantes vitales, collecter échantillons)
- **Biologiste** : Saisir et valider les résultats d'analyse
- **Secrétariat** : Enregistrer l'arrivée du patient (check-in) et clôturer administrativement

**La promesse UX** : "En un coup d'œil, je sais quoi faire maintenant."

### Platform Strategy

**Type d'application :** Application web desktop (navigateur)

**Contraintes plateforme :**
- Desktop uniquement, largeur minimale 1024px
- Interface souris + clavier (pas tactile)
- Réseau local hospitalier (pas de offline mode)
- Mono-écran (pas de gestion multi-fenêtres)

**Fonctionnalités plateforme :**
- ✅ **Notifications desktop** : Alertes navigateur quand nouveau résultat disponible ou nouvelle demande
- ✅ **Impression** : Prescriptions, résultats de laboratoire, factures imprimables
- ❌ Pas de version mobile (hors scope MVP)
- ❌ Pas de mode offline (connexion réseau requise)

**Stack technique confirmé :**
- Frontend : React + Material-UI (thème médical bleu #1976D2)
- Backend : NestJS + PostgreSQL
- Session-based authentication (pas JWT)

### Effortless Interactions

**Ce qui doit être ultra-simple (zéro friction) :**

**1. Visibilité instantanée du workflow**
- Stepper visuel Material-UI montrant les 11 étapes du parcours
- Étape actuelle en surbrillance, étapes passées validées (✓), futures grisées
- Visible en permanence dans le dossier patient

**2. Actions contextuelles évidentes**
- Bouton primaire **géant** pour l'action suivante ("Démarrer Consultation", "Saisir Constantes")
- État désactivé avec message explicatif si prérequis non remplis
- Un seul bouton évident par écran = pas d'hésitation

**3. Formulaires intelligents**
- **Constantes vitales** : Champs pré-ordonnés, focus automatique, validation temps réel
- **Prescriptions** : Template rapide, 1 clic pour envoyer au labo
- **Résultats** : Zone de texte large, validation biologiste avant envoi médecin

**4. Navigation fluide par onglets**
- Onglets dans dossier patient : Infos | Constantes | Prescriptions | Résultats | Notes
- Badges de notification sur onglets (ex: "2 nouveaux résultats")
- Permissions adaptées : lecture vs écriture selon rôle

**5. Transitions de statut automatiques**
- Infirmier valide constantes → Statut passe à "IN_CONSULTATION" automatiquement
- Biologiste valide résultat → Médecin reçoit notification automatiquement
- Pas de bouton "Changer statut" manuel

### Critical Success Moments

**Moments où l'utilisateur se dit "C'est bien pensé !" :**

**Médecin :**
- 🎯 Ouvre "Consultations du jour" → Voit "Jean Dupont - Constantes ✓ prêtes" avec bouton **"Démarrer"**
- 🎯 Clique "Démarrer" → Vue complète : Constantes + Historique + Notes infirmier en un seul écran
- 🎯 Termine consultation → Bouton **"Créer Prescription"** OU **"Terminer sans prescription"** évidents

**Infirmier :**
- 🎯 Voit "8 patients à préparer" avec liste chronologique par heure RDV
- 🎯 Saisit constantes → Clique "Valider" → Patient passe automatiquement en "Prêt pour consultation"
- 🎯 Notification : "Dr. Martin peut maintenant consulter Jean Dupont"

**Biologiste :**
- 🎯 Dashboard affiche **badge rouge "3 nouvelles demandes"** impossible à manquer
- 🎯 Clique demande → Voit prescription médecin + info patient + bouton **"Démarrer l'analyse"**
- 🎯 Valide résultat → Médecin reçoit notification desktop automatiquement

**Secrétariat :**
- 🎯 Voit liste RDV du jour avec statut visuel (couleur) pour chaque patient
- 🎯 Patient arrive → 1 clic "Check-in" → Patient passe en file infirmier automatiquement
- 🎯 Consultation terminée → Formulaire facturation pré-rempli avec montant, 1 clic pour clôturer

**Moments d'ÉCHEC à éviter absolument :**
- ❌ Médecin clique "Démarrer consultation" mais constantes non affichées = frustration majeure
- ❌ Biologiste ne voit pas nouvelle demande urgente = retard dans workflow
- ❌ Infirmier saisit constantes mais médecin ne le sait pas = patient attend inutilement
- ❌ Utilisateur ne sait pas à quelle étape est le dossier = confusion, erreurs

### Experience Principles

**Principes directeurs pour toutes les décisions UX :**

**Principe #1 : Workflow First (Le workflow est roi)**
- Chaque écran affiche clairement l'état du workflow (stepper visuel)
- Chaque action fait progresser le workflow de manière évidente
- Jamais de "statut caché" - tout est transparent

**Principe #2 : Zero Ambiguity (Zéro ambiguïté)**
- Un seul bouton d'action primaire par contexte
- Boutons désactivés = message explicatif clair ("En attente des constantes")
- Pas de "Que dois-je faire maintenant ?" - c'est évident visuellement

**Principe #3 : Automatic Transitions (Transitions automatiques)**
- Quand une action est validée → Statut change automatiquement
- Prochain rôle dans le workflow → Notifié automatiquement
- Pas de friction manuelle entre les étapes

**Principe #4 : Shared Context (Contexte partagé)**
- Le logiciel est un **espace commun** pour tous les rôles
- Chaque rôle voit sa partie mais comprend le workflow global
- Notifications cross-rôles pour fluidifier la collaboration

**Principe #5 : Role-Optimized Entry (Point d'entrée adapté)**
- Médecin → Direct "Consultations du jour" (pas de dashboard générique)
- Infirmier → "Patients à préparer" en priorité
- Biologiste → "Nouvelles demandes" avec badge notification
- Chacun arrive là où il doit agir immédiatement

**Principe #6 : Visual Feedback (Feedback visuel immédiat)**
- Actions → Feedback instantané (toast notification "Constantes enregistrées ✓")
- Changements de statut → Animation visuelle (stepper qui s'anime)
- Notifications desktop pour événements asynchrones (nouveau résultat disponible)

---

## Desired Emotional Response

### Primary Emotional Goals

**Émotions positives à créer :**
- **Confiance** : Le système est fiable et digne de confiance pour données patients sensibles
- **Contrôle** : L'utilisateur sait exactement où il en est, aucune surprise
- **Efficacité** : Gain de temps significatif vs processus manuel
- **Sérénité** : Interface claire et fluide, pas de stress additionnel
- **Professionnalisme** : Outil sérieux adapté au contexte médical

**Émotions négatives à éviter :**
- ❌ Confusion : "Je ne sais pas quoi faire"
- ❌ Anxiété : "J'ai peur de faire une erreur"
- ❌ Frustration : "Ça prend trop de temps"
- ❌ Impuissance : "Je ne peux pas faire ce que je veux"

### Emotional Journey Mapping

**Premier contact (découverte) :**
- Souhaité : "C'est intuitif, je comprends immédiatement"
- À éviter : "C'est compliqué, je dois suivre une formation"

**Utilisation quotidienne (cœur du workflow) :**
- Souhaité : "C'est fluide, automatique, je ne réfléchis pas"
- À éviter : "Je dois chercher, hésiter, cliquer partout"

**Après avoir complété une tâche :**
- Souhaité : "Fait ! C'était rapide et sans effort"
- À éviter : "Ouf, enfin terminé... j'espère que c'est bon"

**Quand erreur survient :**
- Souhaité : "Le message est clair, je sais quoi corriger"
- À éviter : "Qu'est-ce qui s'est passé ? Je suis bloqué"

**Utilisation répétée (retour) :**
- Souhaité : "J'apprécie cet outil, il me facilite la vie"
- À éviter : "Je dois encore utiliser ce truc..."

### Micro-Emotions

**Confiance vs Scepticisme** (🎯 CRITIQUE)
- Les utilisateurs doivent faire totalement confiance au système (données patients sensibles)
- Design : Validation visuelle, confirmations pour actions critiques

**Efficacité vs Frustration** (🎯 CRITIQUE)
- Environnement pression temporelle, chaque seconde compte
- Design : Actions rapides, 1 clic maximum, pas de navigation inutile

**Clarté vs Confusion** (🎯 CRITIQUE)
- Zéro ambiguïté autorisée (erreurs médicales potentielles)
- Design : Un seul chemin évident, statuts visuels clairs, langage médical précis

**Contrôle vs Impuissance** (Important)
- Utilisateur doit sentir qu'il maîtrise le workflow
- Design : Stepper visible, annulation possible, historique consultable

**Sérénité vs Anxiété** (Important)
- Pas de stress additionnel (environnement déjà stressant)
- Design : Interface propre, pas de rouge agressif (sauf urgences), feedback rassurant

### Design Implications

**Pour créer la CONFIANCE :**
- Validation en deux étapes pour actions critiques (suppression, clôture)
- Messages de confirmation clairs avec résumé de l'action
- Historique complet consultable (audit trail)
- Langage médical professionnel et précis

**Pour créer l'EFFICACITÉ :**
- Formulaires pré-remplis avec valeurs par défaut intelligentes
- Focus automatique sur premier champ
- Validation temps réel (pas d'erreur surprise à la fin)
- Raccourcis clavier pour actions fréquentes
- 1 clic maximum pour actions courantes

**Pour créer la CLARTÉ :**
- Un seul bouton d'action primaire par écran (impossible de se tromper)
- Stepper workflow toujours visible
- Statuts avec couleurs + icônes + texte (triple codage)
- Messages d'erreur explicites avec solution ("Il manque les constantes - Demander à l'infirmier")

**Pour créer le CONTRÔLE :**
- Annulation possible (bouton "Retour" toujours accessible)
- Brouillons sauvegardés automatiquement
- Possibilité de consulter sans modifier (mode lecture)
- Navigation libre dans les onglets du dossier

**Pour créer la SÉRÉNITÉ :**
- Design épuré, beaucoup d'espace blanc
- Animations douces (pas de flashs ou mouvements brusques)
- Couleurs apaisantes (bleu médical, pas de rouge agressif)
- Feedback positif systématique ("✓ Enregistré avec succès")
- Pas de compte à rebours ou timers stressants

### Emotional Design Principles

**Principe Émotionnel #1 : "Invisible en cas de succès"**
- Quand tout va bien, l'interface disparaît - l'utilisateur se concentre sur sa tâche
- Pas de distractions, pas de gamification, pas d'effets inutiles
- L'outil se fait oublier pour laisser place au travail médical

**Principe Émotionnel #2 : "Rassurant en cas d'erreur"**
- Les erreurs arrivent - le système doit être un allié, pas un juge
- Messages d'erreur constructifs, jamais accusateurs
- Toujours proposer une solution ou prochaine action

**Principe Émotionnel #3 : "Prédictible et cohérent"**
- Même pattern d'interaction partout (pas de surprise)
- Même emplacement pour boutons similaires
- Même feedback visuel pour mêmes actions
- L'utilisateur développe des automatismes = sérénité

**Principe Émotionnel #4 : "Respectueux du temps"**
- Jamais faire attendre sans raison
- Feedback immédiat (<200ms) pour toute action
- Chargements avec indication de progression
- Pas de clics inutiles ou navigation superflue

---

## Design System & Visual Foundation

### Design System Choice

**System sélectionné : Material-UI (MUI) v5+**

**Justification pour MEDECINE_APP :**
- ✅ **Rapidité MVP** : Composants prêts à l'emploi, documentation complète
- ✅ **Professionnalisme** : Design sérieux adapté contexte médical/entreprise
- ✅ **Accessibilité** : ARIA intégré, contraste conforme WCAG
- ✅ **Écosystème** : Grande communauté, composants tiers disponibles
- ✅ **Desktop-optimized** : Excellents composants desktop (Table, Drawer, Stepper)

**Installation :**
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
```

### Color Palette

**Couleurs principales :**

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',      // Bleu médical (boutons, liens, accents)
      light: '#42A5F5',     // Hover states
      dark: '#1565C0',      // Active states
      contrastText: '#fff', // Texte sur fond bleu
    },
    secondary: {
      main: '#424242',      // Gris foncé (textes secondaires)
      light: '#6D6D6D',
      dark: '#1B1B1B',
    },
    success: {
      main: '#388E3C',      // Vert (statuts validés, succès)
    },
    warning: {
      main: '#F57C00',      // Orange (alertes, en attente)
    },
    error: {
      main: '#D32F2F',      // Rouge (erreurs, urgent uniquement)
    },
    info: {
      main: '#0288D1',      // Bleu info
    },
    background: {
      default: '#F5F5F5',   // Fond de page
      paper: '#FFFFFF',     // Fond cards/dialogs
    },
    text: {
      primary: '#212121',   // Texte principal
      secondary: '#757575', // Texte secondaire
      disabled: '#BDBDBD',  // Texte désactivé
    },
  },
});
```

**Couleurs workflow (statuts) :**

```javascript
const workflowColors = {
  appointment: {
    SCHEDULED: '#1976D2',           // Bleu
    CHECKED_IN: '#F57C00',          // Orange
    IN_CONSULTATION: '#9C27B0',     // Violet
    CONSULTATION_COMPLETED: '#00897B', // Teal
    COMPLETED: '#388E3C',           // Vert
    CANCELLED: '#D32F2F',           // Rouge
  },
  prescription: {
    CREATED: '#1976D2',             // Bleu
    SENT_TO_LAB: '#F57C00',         // Orange
    SAMPLE_COLLECTED: '#9C27B0',    // Violet
    IN_PROGRESS: '#3F51B5',         // Indigo
    RESULTS_AVAILABLE: '#FBC02D',   // Jaune
    COMPLETED: '#388E3C',           // Vert
  },
};
```

### Typography

**Fonts :**
- **Primary** : Roboto (Material-UI default) - Excellent lisibilité, professionnelle
- **Monospace** : Roboto Mono - Pour données médicales (IDs, codes)

**Échelle typographique :**

```javascript
typography: {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: '2.5rem', fontWeight: 500 },  // Rarement utilisé
  h2: { fontSize: '2rem', fontWeight: 500 },    // Titres de page
  h3: { fontSize: '1.75rem', fontWeight: 500 }, // Titres de section
  h4: { fontSize: '1.5rem', fontWeight: 500 },  // Sous-titres
  h5: { fontSize: '1.25rem', fontWeight: 500 }, // Cards headers
  h6: { fontSize: '1rem', fontWeight: 500 },    // Labels importants
  body1: { fontSize: '1rem', lineHeight: 1.5 },     // Texte principal
  body2: { fontSize: '0.875rem', lineHeight: 1.43 }, // Texte secondaire
  button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' }, // Boutons
  caption: { fontSize: '0.75rem' },  // Timestamps, hints
}
```

**Important** : `textTransform: 'none'` pour boutons (pas de UPPERCASE agressif)

### Spacing & Layout

**Grid system :**
- Utiliser `<Grid container spacing={3}>` pour layouts
- Spacing standard : `theme.spacing(1)` = 8px

**Spacing scale :**
- xs: 4px (`spacing(0.5)`)
- sm: 8px (`spacing(1)`)
- md: 16px (`spacing(2)`)
- lg: 24px (`spacing(3)`)
- xl: 32px (`spacing(4)`)

**Padding standards :**
- Cards : `padding: theme.spacing(3)` (24px)
- Dialogs : `padding: theme.spacing(2)` (16px)
- Sections : `margin-bottom: theme.spacing(4)` (32px)

**Border radius :**
```javascript
shape: {
  borderRadius: 8, // Coins arrondis doux (professionnel)
}
```

### Iconography

**Icon library : Material Icons**

```bash
npm install @mui/icons-material
```

**Icons par contexte :**

```javascript
// Workflow
import CheckCircleIcon from '@mui/icons-material/CheckCircle';      // Validé
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // En attente
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';   // Médical
import ScienceIcon from '@mui/icons-material/Science';               // Labo
import PersonIcon from '@mui/icons-material/Person';                 // Patient
import EventIcon from '@mui/icons-material/Event';                   // Rendez-vous

// Actions
import AddIcon from '@mui/icons-material/Add';                       // Ajouter
import EditIcon from '@mui/icons-material/Edit';                     // Modifier
import DeleteIcon from '@mui/icons-material/Delete';                 // Supprimer
import SaveIcon from '@mui/icons-material/Save';                     // Sauvegarder
import CloseIcon from '@mui/icons-material/Close';                   // Fermer

// Notifications
import NotificationsIcon from '@mui/icons-material/Notifications';   // Notification
import WarningIcon from '@mui/icons-material/Warning';               // Alerte
import ErrorIcon from '@mui/icons-material/Error';                   // Erreur
import InfoIcon from '@mui/icons-material/Info';                     // Info
```

**Taille des icônes :**
- Small : 20px (`fontSize="small"`)
- Default : 24px
- Large : 36px (`fontSize="large"`)

---

## Component Strategy

### Core Components Mapping

**1. Workflow Stepper (CRITIQUE)**

Composant : `<Stepper>` Material-UI

```jsx
import { Stepper, Step, StepLabel } from '@mui/material';

const steps = [
  'Check-in',
  'Constantes',
  'Consultation',
  'Prescription',
  'Prélèvement',
  'Analyse',
  'Interprétation',
  'Clôture'
];

<Stepper activeStep={currentStepIndex} alternativeLabel>
  {steps.map((label, index) => (
    <Step key={label} completed={index < currentStepIndex}>
      <StepLabel>{label}</StepLabel>
    </Step>
  ))}
</Stepper>
```

**Où l'utiliser :** En haut de chaque vue dossier patient (toujours visible)

---

**2. Dashboards par Rôle**

Composant : `<Grid>` + `<Card>` + `<Badge>`

```jsx
import { Grid, Card, CardContent, CardActions, Button, Badge, Typography } from '@mui/material';

// Card d'action rapide
<Card>
  <CardContent>
    <Badge badgeContent={5} color="error">
      <NotificationsIcon />
    </Badge>
    <Typography variant="h5">Consultations prêtes</Typography>
    <Typography variant="body2" color="text.secondary">
      5 patients avec constantes validées
    </Typography>
  </CardContent>
  <CardActions>
    <Button variant="contained" size="large" fullWidth>
      Voir la liste
    </Button>
  </CardActions>
</Card>
```

**Où l'utiliser :** Dashboards de tous les rôles

---

**3. Listes de données**

Composant : `<Table>` ou `<List>` selon contexte

```jsx
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Patient</TableCell>
        <TableCell>Heure</TableCell>
        <TableCell>Statut</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {appointments.map(apt => (
        <TableRow key={apt.id}>
          <TableCell>{apt.patient.name}</TableCell>
          <TableCell>{apt.time}</TableCell>
          <TableCell>
            <Chip
              label={apt.status}
              color={getStatusColor(apt.status)}
              size="small"
            />
          </TableCell>
          <TableCell>
            <Button variant="contained" size="small">
              Démarrer
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

**Où l'utiliser :** Listes patients, rendez-vous, prescriptions, résultats

---

**4. Formulaires**

Composants : `<TextField>`, `<Select>`, `<Button>`

```jsx
import { TextField, Button, Box } from '@mui/material';

<Box component="form" onSubmit={handleSubmit}>
  <TextField
    fullWidth
    label="Poids (kg)"
    type="number"
    value={weight}
    onChange={(e) => setWeight(e.target.value)}
    required
    margin="normal"
    autoFocus  // Premier champ
  />

  <TextField
    fullWidth
    label="Taille (cm)"
    type="number"
    value={height}
    onChange={(e) => setHeight(e.target.value)}
    required
    margin="normal"
  />

  <Button
    type="submit"
    variant="contained"
    size="large"
    fullWidth
    sx={{ mt: 3 }}
  >
    Valider les constantes
  </Button>
</Box>
```

**Où l'utiliser :** Saisie constantes, création prescription, saisie résultats

---

**5. Dialogs/Modals**

Composant : `<Dialog>`

```jsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
  <DialogTitle>Créer une prescription</DialogTitle>
  <DialogContent>
    <TextField
      fullWidth
      multiline
      rows={8}
      label="Détails de la prescription"
      value={prescriptionText}
      onChange={(e) => setPrescriptionText(e.target.value)}
      margin="normal"
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Annuler</Button>
    <Button onClick={handleSave} variant="contained">
      Créer et envoyer au labo
    </Button>
  </DialogActions>
</Dialog>
```

**Où l'utiliser :** Création/édition rapide sans changer de page

---

**6. Notifications/Feedback**

Composant : `<Snackbar>` + `<Alert>`

```jsx
import { Snackbar, Alert } from '@mui/material';

<Snackbar
  open={showSuccess}
  autoHideDuration={3000}
  onClose={() => setShowSuccess(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert severity="success" variant="filled">
    ✓ Constantes enregistrées avec succès
  </Alert>
</Snackbar>
```

**Où l'utiliser :** Après chaque action (validation, envoi, erreur)

---

**7. Navigation par onglets (Dossier patient)**

Composant : `<Tabs>` + `<Badge>`

```jsx
import { Tabs, Tab, Badge, Box } from '@mui/material';

<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Informations" />
  <Tab label="Constantes" />
  <Tab
    label={
      <Badge badgeContent={2} color="error">
        Prescriptions
      </Badge>
    }
  />
  <Tab label="Résultats" />
  <Tab label="Notes" />
</Tabs>

<Box sx={{ p: 3 }}>
  {tabValue === 0 && <PatientInfo />}
  {tabValue === 1 && <Vitals />}
  {tabValue === 2 && <Prescriptions />}
  {tabValue === 3 && <Results />}
  {tabValue === 4 && <Notes />}
</Box>
```

**Où l'utiliser :** Vue dossier patient complète

---

**8. Statut visuel (Chips)**

Composant : `<Chip>`

```jsx
import { Chip } from '@mui/material';

const getStatusColor = (status) => {
  const colors = {
    SCHEDULED: 'primary',
    CHECKED_IN: 'warning',
    IN_CONSULTATION: 'secondary',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

<Chip
  label="Check-in effectué"
  color="warning"
  icon={<CheckCircleIcon />}
  size="small"
/>
```

**Où l'utiliser :** Partout où un statut est affiché

---

### Component Checklist par Page

**Dashboard Médecin :**
- [ ] `<Grid>` layout 3 colonnes
- [ ] `<Card>` pour chaque section
- [ ] `<Badge>` pour compteurs notifications
- [ ] `<Button variant="contained" size="large">` pour actions primaires
- [ ] `<List>` pour liste consultations

**Vue Dossier Patient :**
- [ ] `<Stepper>` workflow en haut
- [ ] `<Tabs>` pour navigation sections
- [ ] `<Card>` pour chaque section d'info
- [ ] `<Chip>` pour afficher statuts
- [ ] `<Button>` actions contextuelles selon rôle

**Formulaire Constantes (Infirmier) :**
- [ ] `<TextField>` pour chaque constante
- [ ] `autoFocus` sur premier champ
- [ ] `required` sur champs obligatoires
- [ ] `<Button fullWidth size="large">` pour valider
- [ ] `<Snackbar>` confirmation succès

**Liste Prescriptions (Biologiste) :**
- [ ] `<Table>` avec colonnes : Patient, Médecin, Date, Statut, Actions
- [ ] `<Chip>` pour statut prescription
- [ ] `<Badge>` pour nouvelles demandes
- [ ] `<Button>` "Démarrer l'analyse"

---

## UX Consistency Patterns

### Règles de Cohérence UI

**1. Placement des boutons d'action**

```
Règle : Bouton primaire TOUJOURS à droite, secondaire à gauche
```

✅ **Bon :**
```jsx
<DialogActions>
  <Button onClick={handleCancel}>Annuler</Button>
  <Button onClick={handleSave} variant="contained">Sauvegarder</Button>
</DialogActions>
```

❌ **Mauvais :**
```jsx
<DialogActions>
  <Button variant="contained">Sauvegarder</Button>
  <Button>Annuler</Button>
</DialogActions>
```

---

**2. Taille des boutons selon importance**

```
Règle : Action primaire = large, Actions secondaires = medium/small
```

✅ **Bon :**
```jsx
// Action critique page
<Button variant="contained" size="large" fullWidth>
  Démarrer la consultation
</Button>

// Actions secondaires
<Button size="small" startIcon={<EditIcon />}>
  Modifier
</Button>
```

---

**3. Messages d'erreur**

```
Règle : Toujours expliquer ET proposer solution
```

✅ **Bon :**
```jsx
"Impossible de démarrer la consultation : les constantes n'ont pas encore été saisies.
Demandez à l'infirmier de compléter les constantes vitales."
```

❌ **Mauvais :**
```jsx
"Erreur : constantes manquantes"
```

---

**4. Confirmation actions destructives**

```
Règle : Dialog de confirmation pour suppression/annulation
```

✅ **Bon :**
```jsx
<Dialog>
  <DialogTitle>Confirmer l'annulation</DialogTitle>
  <DialogContent>
    Êtes-vous sûr de vouloir annuler le rendez-vous de Jean Dupont le 05/01/2026 à 10:00 ?
    Cette action est irréversible.
  </DialogContent>
  <DialogActions>
    <Button>Non, revenir</Button>
    <Button color="error" variant="contained">Oui, annuler le RDV</Button>
  </DialogActions>
</Dialog>
```

---

**5. États de chargement**

```
Règle : Skeleton ou CircularProgress, jamais de page blanche
```

✅ **Bon :**
```jsx
import { CircularProgress, Box } from '@mui/material';

{loading ? (
  <Box display="flex" justifyContent="center" p={4}>
    <CircularProgress />
  </Box>
) : (
  <AppointmentsList data={appointments} />
)}
```

---

**6. États vides**

```
Règle : Message explicatif + action possible
```

✅ **Bon :**
```jsx
import { Box, Typography, Button } from '@mui/material';

{appointments.length === 0 && (
  <Box textAlign="center" p={4}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      Aucun rendez-vous aujourd'hui
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Vous n'avez pas de consultations prévues pour aujourd'hui.
    </Typography>
    <Button variant="outlined">
      Voir le planning de la semaine
    </Button>
  </Box>
)}
```

---

**7. Feedback visuel immédiat**

```
Règle : <200ms pour toute action utilisateur
```

✅ **Bon :**
```jsx
const handleClick = async () => {
  setLoading(true); // Feedback immédiat
  try {
    await saveData();
    setShowSuccess(true); // Toast succès
  } catch (error) {
    setShowError(true); // Toast erreur
  } finally {
    setLoading(false);
  }
};
```

---

**8. Hiérarchie visuelle**

```
Règle : 1 seul bouton "contained" par écran
```

✅ **Bon :**
```jsx
<Box>
  <Button variant="contained" size="large">Action primaire</Button>
  <Button variant="outlined">Action secondaire</Button>
  <Button variant="text">Action tertiaire</Button>
</Box>
```

❌ **Mauvais :**
```jsx
<Box>
  <Button variant="contained">Sauvegarder</Button>
  <Button variant="contained">Annuler</Button>
  <Button variant="contained">Modifier</Button>
</Box>
```

---

**9. Langage et ton**

```
Règle : Professionnel, précis, sans jargon technique IT
```

✅ **Bon :**
- "Constantes enregistrées avec succès"
- "En attente des résultats du laboratoire"
- "Le patient a été enregistré"

❌ **Mauvais :**
- "POST request success"
- "Erreur 500"
- "Record inserted in database"

---

**10. Responsive feedback selon type d'action**

```
Règle : Adapter le feedback à l'importance de l'action
```

| Action | Feedback |
|--------|----------|
| Sauvegarder constantes | Snackbar vert + son (optionnel) |
| Modifier nom patient | Snackbar neutre |
| Supprimer RDV | Dialog confirmation + Snackbar après |
| Envoi prescription au labo | Snackbar + Notification desktop au biologiste |
| Erreur critique | Dialog modal bloquant |

---

### Checklist de Cohérence

Avant de valider une page, vérifier :

- [ ] Un seul bouton primaire (contained) visible
- [ ] Boutons primaires à droite, secondaires à gauche
- [ ] Messages d'erreur explicatifs avec solution
- [ ] Feedback visuel immédiat (<200ms)
- [ ] États de chargement gérés (pas de page blanche)
- [ ] États vides avec message + action
- [ ] Actions destructives avec confirmation
- [ ] Statuts avec couleur + icône + texte
- [ ] Langage professionnel médical (pas IT)
- [ ] Espacement cohérent (spacing(2) ou spacing(3))

---

## Implementation Summary

### Priority UX Improvements for MVP

**🔴 CRITICAL (Jour 6)** - Sans ça, le MVP n'est pas utilisable :

1. **Workflow Stepper** - Ajouter `<Stepper>` en haut de vue dossier patient
2. **Boutons d'action contextuels** - "Démarrer Consultation", "Créer Prescription", etc.
3. **Statuts visuels** - `<Chip>` avec couleurs pour tous les statuts
4. **Badges notification** - `<Badge>` sur dashboards pour nouvelles demandes

**🟡 IMPORTANT (Jour 6-7)** - Améliore beaucoup l'expérience :

5. **Navigation par onglets** - `<Tabs>` dans dossier patient
6. **Messages de feedback** - `<Snackbar>` après chaque action
7. **États vides** - Messages quand aucune donnée
8. **Confirmation actions destructives** - Dialogs confirmation

**🟢 NICE TO HAVE (Post-MVP)** - Polissage :

9. Animations transitions
10. Notifications desktop (API Notification)
11. Raccourcis clavier
12. Mode impression optimisé

### Quick Start for Developers

**1. Installer Material-UI :**
```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

**2. Créer le thème :**
```javascript
// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    success: { main: '#388E3C' },
    warning: { main: '#F57C00' },
    error: { main: '#D32F2F' },
  },
  typography: {
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
});
```

**3. Wrapper App :**
```javascript
// src/App.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Your app */}
    </ThemeProvider>
  );
}
```

**4. Utiliser les composants :**
Copier-coller les examples du guide ci-dessus.

---

## Document Status

**Status:** ✅ COMPLETED (Express Mode)
**Date:** 2026-01-05
**Author:** Tidianecisse
**Next Step:** Create Epics & Stories for UX implementation

**Completed Sections:**
- ✅ Executive Summary (Vision, Users, Challenges, Opportunities)
- ✅ Core User Experience (Defining Experience, Platform, Effortless Interactions, Critical Moments, Principles)
- ✅ Desired Emotional Response (Goals, Journey, Micro-Emotions, Design Implications, Emotional Principles)
- ✅ Design System & Visual Foundation (Material-UI, Colors, Typography, Spacing, Icons)
- ✅ Component Strategy (8 core components with code examples)
- ✅ UX Consistency Patterns (10 rules with good/bad examples, checklist)
- ✅ Implementation Summary (Priorities, Quick Start)

**Skipped Sections (Not needed for MVP):**
- ❌ Inspiration Analysis (wireframes already exist)
- ❌ Design Direction Mockups (wireframes sufficient)
- ❌ User Journey Flows (parcours patient PDF exists)
- ❌ Responsive Design (desktop-only MVP)

---
