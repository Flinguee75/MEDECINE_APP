# Dashboard Navigation & UI Design Specification

**Project**: Hospital Management System
**Date**: 2026-01-04
**Version**: 1.0
**UI Framework**: Material-UI (MUI) v5+

---

## Design Principles

### 1. Clarity & Visibility
- **No hidden functionality**: All workflow steps must be immediately visible
- **Clear entry points**: Users should know exactly where to enter data
- **Visual hierarchy**: Most important actions appear first and largest

### 2. Role-Based Design
- Each role has a unique dashboard layout optimized for their workflow
- Color coding helps users identify their role at a glance
- Only relevant actions are shown (no clutter)

### 3. Workflow Guidance
- Dashboard layout follows the chronological workflow
- Count badges show pending items requiring attention
- Empty states guide users on what to do when nothing is pending

### 4. Material Design Standards
- Use Material-UI components exclusively
- Consistent spacing (8px grid)
- Responsive grid layout (Grid v2)
- Elevation and shadows for depth
- Color palette follows Material Design guidelines

---

## Color Scheme by Role

| Role | Primary Color | Hex Code | Usage |
|------|--------------|----------|-------|
| ADMIN | Red | #d32f2f | Role chip, accent elements |
| DOCTOR | Blue | #1976d2 | Role chip, primary actions |
| BIOLOGIST | Green | #388e3c | Role chip, completion states |
| SECRETARY | Orange | #f57c00 | Role chip, administrative actions |
| NURSE | Teal | #00897b | Role chip, care-related actions |

### Status Colors (Universal)

| Status | Color | Hex Code |
|--------|-------|----------|
| SCHEDULED | Blue | #1976d2 |
| CHECKED_IN | Orange | #f57c00 |
| IN_CONSULTATION | Purple | #9c27b0 |
| CONSULTATION_COMPLETED | Teal | #00897b |
| COMPLETED | Green | #388e3c |
| CANCELLED | Red | #d32f2f |
| SENT_TO_LAB | Orange | #f57c00 |
| SAMPLE_COLLECTED | Purple | #9c27b0 |
| IN_PROGRESS | Indigo | #3949ab |
| RESULTS_AVAILABLE | Amber | #ffa726 |

---

## Common Dashboard Elements

### Header Section (All Roles)

```typescript
// Material-UI Components
<Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Avatar sx={{ width: 64, height: 64, bgcolor: [ROLE_COLOR] }}>
        {user.name.charAt(0)}
      </Avatar>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Bienvenue, {firstName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label={roleLabel} sx={{ bgcolor: [ROLE_COLOR], color: 'white' }} />
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>
    </Box>
    <Button variant="outlined" color="error" onClick={handleLogout}>
      Se déconnecter
    </Button>
  </Box>
</Paper>
```

**Key Features**:
- Large avatar with first initial
- Personalized greeting with first name only
- Role chip with distinctive color
- Email address for verification
- Prominent logout button

---

## SECRETARY Dashboard

### Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Avatar, "Bienvenue, [Name]", Role Chip, Logout)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── STATISTICS ────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │RDV Today │  │ New      │  │ RDV      │  │ Total    │  │
│  │    23    │  │ Patients │  │ à venir  │  │ Patients │  │
│  │          │  │    5     │  │    47    │  │   892    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘

┌───────────────────── QUICK ACTIONS ───────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │ Nouveau RDV     │  │ Enregistrer     │  │ Gérer les  │ │
│  │ [Icon]          │  │ Patient         │  │ RDV        │ │
│  │ Planifier un    │  │ [Icon]          │  │ [Icon]     │ │
│  │ nouveau rendez- │  │ Ajouter un      │  │ Consulter  │ │
│  │ vous            │  │ nouveau patient │  │ et modifier│ │
│  │ [Arrow]         │  │ [Arrow]         │  │ [Arrow]    │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
└───────────────────────────────────────────────────────────┘

┌─────────────────── WORKFLOW SECTIONS ─────────────────────┐
│  Check-In Aujourd'hui (Badge: 8)                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient Name  │ Doctor    │ Time  │ [Check In]   │   │
│  │ Jean Dupont   │ Dr.Martin │ 10:00 │ [Button]     │   │
│  └───────────────────────────────────────────────────┘   │
│                                                            │
│  Rendez-vous à Clôturer (Badge: 5)                       │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient Name  │ Status            │ [Close]      │   │
│  │ Marie Durant  │ CONSULTATION_COMP │ [Button]     │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Statistics Cards (Row 1)

**Component**: `StatCard` (custom, reusable)

**Card 1: RDV Aujourd'hui**
```typescript
<StatCard
  title="RDV aujourd'hui"
  value={23}
  icon={<Event />}
  color="#1976d2"
  subtitle="8 confirmés"
/>
```

**Card 2: Nouveaux Patients**
```typescript
<StatCard
  title="Nouveaux patients"
  value={5}
  icon={<PersonAdd />}
  color="#388e3c"
  subtitle="Cette semaine"
/>
```

**Card 3: RDV à Venir**
```typescript
<StatCard
  title="RDV à venir"
  value={47}
  icon={<Schedule />}
  color="#f57c00"
  subtitle="Cette semaine"
/>
```

**Card 4: Total Patients**
```typescript
<StatCard
  title="Total patients"
  value={892}
  icon={<People />}
  color="#9c27b0"
  subtitle="Base de données"
/>
```

### Quick Action Cards (Row 2)

**Component**: `QuickActionCard` (custom, clickable)

**Card 1: Nouveau Rendez-vous**
```typescript
<QuickActionCard
  title="Nouveau rendez-vous"
  description="Planifier un nouveau rendez-vous pour un patient"
  icon={<Event />}
  onClick={() => navigate('/appointments')}
  color="#1976d2"
/>
```

**Card 2: Enregistrer Patient**
```typescript
<QuickActionCard
  title="Enregistrer un patient"
  description="Ajouter un nouveau patient dans le système"
  icon={<PersonAdd />}
  onClick={() => navigate('/patients')}
  color="#388e3c"
/>
```

**Card 3: Gérer les RDV**
```typescript
<QuickActionCard
  title="Gérer les RDV"
  description="Consulter et modifier les rendez-vous existants"
  icon={<CalendarMonth />}
  onClick={() => navigate('/appointments')}
  color="#f57c00"
/>
```

### Workflow Sections (Row 3)

**Section 1: Check-In Aujourd'hui**

```typescript
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Check-In Aujourd'hui
      </Typography>
      <Badge badgeContent={8} color="primary">
        <Event />
      </Badge>
    </Box>

    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Médecin</TableCell>
            <TableCell>Heure</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scheduledAppointments.map(apt => (
            <TableRow key={apt.id}>
              <TableCell>{apt.patient.firstName} {apt.patient.lastName}</TableCell>
              <TableCell>{apt.doctor.name}</TableCell>
              <TableCell>{format(apt.date, 'HH:mm')}</TableCell>
              <TableCell>
                <Chip label="SCHEDULED" color="primary" size="small" />
              </TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => handleCheckIn(apt.id)}
                >
                  Check In
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </CardContent>
</Card>
```

**Empty State**:
```typescript
{scheduledAppointments.length === 0 && (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Event sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" color="text.secondary">
      Aucun rendez-vous à enregistrer
    </Typography>
    <Typography variant="body2" color="text.disabled">
      Tous les patients du jour ont été enregistrés
    </Typography>
  </Box>
)}
```

**Section 2: Rendez-vous à Clôturer**

```typescript
<Card>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Rendez-vous à Clôturer
      </Typography>
      <Badge badgeContent={5} color="warning">
        <Assignment />
      </Badge>
    </Box>

    <List>
      {toCloseAppointments.map(apt => (
        <ListItem
          key={apt.id}
          secondaryAction={
            <Button
              variant="outlined"
              color="success"
              onClick={() => openClosureDialog(apt.id)}
            >
              Clôturer
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#00897b' }}>
              <CheckCircle />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${apt.patient.firstName} ${apt.patient.lastName}`}
            secondary={`Dr. ${apt.doctor.name} - ${format(apt.date, 'dd/MM/yyyy HH:mm')}`}
          />
          <Chip label="CONSULTATION_COMPLETED" color="info" />
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

### Closure Dialog

```typescript
<Dialog open={closureDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
  <DialogTitle>Clôturer le rendez-vous</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Patient: {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.lastName}
    </Typography>

    <TextField
      fullWidth
      label="Montant de la facture (€)"
      type="number"
      value={billingAmount}
      onChange={(e) => setBillingAmount(e.target.value)}
      sx={{ mb: 2 }}
    />

    <FormControl fullWidth>
      <InputLabel>Statut du paiement</InputLabel>
      <Select value={billingStatus} onChange={(e) => setBillingStatus(e.target.value)}>
        <MenuItem value="PENDING">En attente</MenuItem>
        <MenuItem value="PAID">Payé</MenuItem>
        <MenuItem value="PARTIALLY_PAID">Partiellement payé</MenuItem>
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseDialog}>Annuler</Button>
    <Button variant="contained" onClick={handleClosureSubmit}>Confirmer</Button>
  </DialogActions>
</Dialog>
```

---

## NURSE Dashboard

### Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Avatar, "Bienvenue, [Name]", Role Chip, Logout)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── STATISTICS ────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Patients │  │ Échant.  │  │ Préparé  │  │ RDV      │  │
│  │ à Prépa. │  │ à Coll.  │  │ Auj.     │  │ Auj.     │  │
│  │    6     │  │    12    │  │    8     │  │    23    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘

┌─────────────────── WORKFLOW SECTIONS ─────────────────────┐
│  Patients à Préparer (Badge: 6)                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient      │ Doctor    │ Time  │ [Enter Vitals]│   │
│  │ Jean Dupont  │ Dr.Martin │ 10:00 │ [Button]      │   │
│  └───────────────────────────────────────────────────┘   │
│                                                            │
│  Échantillons à Collecter (Badge: 12)                    │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient      │ Test Type      │ [Collect Sample] │   │
│  │ Marie Durant │ CBC, Lipids    │ [Button]         │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Statistics Cards

**Card 1: Patients à Préparer**
```typescript
<StatCard
  title="Patients à préparer"
  value={6}
  icon={<Assignment />}
  color="#00897b"
  subtitle="Constantes à saisir"
/>
```

**Card 2: Échantillons à Collecter**
```typescript
<StatCard
  title="Échantillons à collecter"
  value={12}
  icon={<Science />}
  color="#f57c00"
  subtitle="Envoyés au labo"
/>
```

**Card 3: Préparés Aujourd'hui**
```typescript
<StatCard
  title="Préparés aujourd'hui"
  value={8}
  icon={<CheckCircle />}
  color="#388e3c"
  subtitle="Constantes saisies"
/>
```

**Card 4: RDV Aujourd'hui**
```typescript
<StatCard
  title="RDV aujourd'hui"
  value={23}
  icon={<Event />}
  color="#1976d2"
  subtitle="Vue d'ensemble"
/>
```

### Workflow Section 1: Patients à Préparer

```typescript
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Patients à Préparer
      </Typography>
      <Badge badgeContent={checkedInAppointments.length} color="primary">
        <Assignment />
      </Badge>
    </Box>

    <List>
      {checkedInAppointments.map(apt => (
        <ListItem
          key={apt.id}
          button
          onClick={() => openVitalsDialog(apt)}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#f57c00' }}>
              {apt.patient.firstName.charAt(0)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${apt.patient.firstName} ${apt.patient.lastName}`}
            secondary={`Dr. ${apt.doctor.name} - ${format(apt.date, 'HH:mm')}`}
          />
          <Chip label="CHECKED_IN" color="warning" size="small" />
          <IconButton edge="end">
            <ArrowForward />
          </IconButton>
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

### Vitals Entry Dialog

```typescript
<Dialog open={vitalsDialogOpen} onClose={handleCloseVitals} maxWidth="md" fullWidth>
  <DialogTitle>
    Saisir les Constantes
    <Typography variant="body2" color="text.secondary">
      {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.lastName}
    </Typography>
  </DialogTitle>

  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Poids (kg)"
          type="number"
          value={vitals.weight}
          onChange={(e) => setVitals({...vitals, weight: e.target.value})}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Taille (cm)"
          type="number"
          value={vitals.height}
          onChange={(e) => setVitals({...vitals, height: e.target.value})}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Température (°C)"
          type="number"
          value={vitals.temperature}
          onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">°C</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={3}>
        <TextField
          fullWidth
          label="TA Systolique"
          type="number"
          value={vitals.bloodPressure.systolic}
          onChange={(e) => setVitals({
            ...vitals,
            bloodPressure: {...vitals.bloodPressure, systolic: e.target.value}
          })}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={3}>
        <TextField
          fullWidth
          label="TA Diastolique"
          type="number"
          value={vitals.bloodPressure.diastolic}
          onChange={(e) => setVitals({
            ...vitals,
            bloodPressure: {...vitals.bloodPressure, diastolic: e.target.value}
          })}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Fréquence cardiaque"
          type="number"
          value={vitals.heartRate}
          onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
          required
          InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Fréquence respiratoire"
          type="number"
          value={vitals.respiratoryRate}
          onChange={(e) => setVitals({...vitals, respiratoryRate: e.target.value})}
          InputProps={{ endAdornment: <InputAdornment position="end">/min</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Saturation O2"
          type="number"
          value={vitals.oxygenSaturation}
          onChange={(e) => setVitals({...vitals, oxygenSaturation: e.target.value})}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Antécédents Médicaux Déclarés
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes d'antécédents"
          multiline
          rows={4}
          value={medicalHistoryNotes}
          onChange={(e) => setMedicalHistoryNotes(e.target.value)}
          placeholder="Allergies, maladies chroniques, médicaments actuels, antécédents familiaux..."
        />
      </Grid>
    </Grid>
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCloseVitals}>Annuler</Button>
    <Button
      variant="contained"
      onClick={handleSaveVitals}
      disabled={!isVitalsFormValid()}
    >
      Enregistrer les Constantes
    </Button>
  </DialogActions>
</Dialog>
```

### Workflow Section 2: Échantillons à Collecter

```typescript
<Card>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Échantillons à Collecter
      </Typography>
      <Badge badgeContent={toCollectPrescriptions.length} color="warning">
        <Science />
      </Badge>
    </Box>

    <List>
      {toCollectPrescriptions.map(prescription => (
        <ListItem
          key={prescription.id}
          secondaryAction={
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Science />}
              onClick={() => handleCollectSample(prescription.id)}
            >
              Collecter
            </Button>
          }
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#9c27b0' }}>
              <Science />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${prescription.patient.firstName} ${prescription.patient.lastName}`}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  {prescription.text.substring(0, 60)}...
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Prescrit par Dr. {prescription.doctor.name}
                </Typography>
              </>
            }
          />
          <Chip label="SENT_TO_LAB" color="warning" size="small" />
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

---

## DOCTOR Dashboard

### Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Avatar, "Bienvenue, Dr. [Name]", Role Chip)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── STATISTICS ────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ RDV      │  │ Prescr.  │  │ Résultats│  │ Patients │  │
│  │ Auj.     │  │ Attente  │  │ à Revoir │  │ Suivis   │  │
│  │    5     │  │    8     │  │    3     │  │   142    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘

┌───────────────────── QUICK ACTIONS ───────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │ Mes RDV         │  │ Mes Patients    │  │ Prescrip-  │ │
│  │ [Icon]          │  │ [Icon]          │  │ tions      │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
└───────────────────────────────────────────────────────────┘

┌─────────────────── WORKFLOW SECTIONS ─────────────────────┐
│  Consultations Prêtes (Badge: 5)                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient       │ Vitals Ready │ [Start Consult.]  │   │
│  │ Jean Dupont   │ ✓ Complete   │ [Button]          │   │
│  └───────────────────────────────────────────────────┘   │
│                                                            │
│  Résultats à Revoir (Badge: 3)                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient       │ Test Type    │ [Review Result]   │   │
│  │ Marie Durant  │ CBC          │ [Button]          │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Statistics Cards

**Card 1: RDV Aujourd'hui**
```typescript
<StatCard
  title="Rendez-vous aujourd'hui"
  value={5}
  icon={<Schedule />}
  color="#1976d2"
  subtitle="3 restants"
/>
```

**Card 2: Prescriptions en Attente**
```typescript
<StatCard
  title="Prescriptions en attente"
  value={8}
  icon={<Medication />}
  color="#f57c00"
  subtitle="À envoyer au labo"
/>
```

**Card 3: Résultats à Examiner**
```typescript
<StatCard
  title="Résultats à examiner"
  value={3}
  icon={<Assignment />}
  color="#388e3c"
  subtitle="Nouveaux résultats"
/>
```

**Card 4: Patients Suivis**
```typescript
<StatCard
  title="Patients suivis"
  value={142}
  icon={<People />}
  color="#9c27b0"
  subtitle="Actifs ce mois"
/>
```

### Workflow Section 1: Consultations Prêtes

```typescript
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Consultations Prêtes
      </Typography>
      <Badge badgeContent={readyConsultations.length} color="primary">
        <LocalHospital />
      </Badge>
    </Box>

    <List>
      {readyConsultations.map(apt => (
        <ListItem
          key={apt.id}
          button
          onClick={() => openConsultationView(apt)}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#9c27b0' }}>
              {apt.patient.firstName.charAt(0)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${apt.patient.firstName} ${apt.patient.lastName}`}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  {format(apt.date, 'dd/MM/yyyy HH:mm')} - {apt.motif}
                </Typography>
                <br />
                <Chip
                  icon={<CheckCircle />}
                  label="Constantes saisies"
                  size="small"
                  color="success"
                  sx={{ mt: 0.5 }}
                />
              </>
            }
          />
          <Chip label="IN_CONSULTATION" color="secondary" size="small" />
          <IconButton edge="end">
            <ArrowForward />
          </IconButton>
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

### Consultation View (Drawer or Dialog)

```typescript
<Drawer
  anchor="right"
  open={consultationDrawerOpen}
  onClose={handleCloseConsultation}
  sx={{ '& .MuiDrawer-paper': { width: '50%', p: 3 } }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
    <IconButton onClick={handleCloseConsultation} sx={{ mr: 2 }}>
      <Close />
    </IconButton>
    <Typography variant="h5">
      Consultation - {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.lastName}
    </Typography>
  </Box>

  <Divider sx={{ mb: 3 }} />

  {/* Patient Information */}
  <Card variant="outlined" sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Informations Patient
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Date de naissance</Typography>
          <Typography>{format(new Date(selectedAppointment?.patient.birthDate), 'dd/MM/yyyy')}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Téléphone</Typography>
          <Typography>{selectedAppointment?.patient.phone}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>

  {/* Vitals (Read-Only) */}
  <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Constantes Vitales
        </Typography>
        <Chip
          icon={<CheckCircle />}
          label={`Saisies par ${selectedAppointment?.vitalsEnteredBy.name}`}
          size="small"
          color="success"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Poids</Typography>
          <Typography variant="h6">{selectedAppointment?.vitals.weight} kg</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Taille</Typography>
          <Typography variant="h6">{selectedAppointment?.vitals.height} cm</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Température</Typography>
          <Typography variant="h6">{selectedAppointment?.vitals.temperature} °C</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Tension Artérielle</Typography>
          <Typography variant="h6">
            {selectedAppointment?.vitals.bloodPressure.systolic}/
            {selectedAppointment?.vitals.bloodPressure.diastolic} mmHg
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Fréquence Cardiaque</Typography>
          <Typography variant="h6">{selectedAppointment?.vitals.heartRate} bpm</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary">Saturation O2</Typography>
          <Typography variant="h6">{selectedAppointment?.vitals.oxygenSaturation} %</Typography>
        </Grid>
      </Grid>

      {selectedAppointment?.medicalHistoryNotes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Antécédents Déclarés
          </Typography>
          <Typography variant="body1">
            {selectedAppointment.medicalHistoryNotes}
          </Typography>
        </>
      )}
    </CardContent>
  </Card>

  {/* Consultation Notes (Editable) */}
  <Card variant="outlined" sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Notes de Consultation
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={8}
        value={consultationNotes}
        onChange={(e) => setConsultationNotes(e.target.value)}
        placeholder="Entrez vos observations, diagnostic, et recommandations..."
      />
    </CardContent>
  </Card>

  {/* Actions */}
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Button
      variant="outlined"
      fullWidth
      onClick={() => openPrescriptionDialog()}
    >
      Créer une Prescription
    </Button>
    <Button
      variant="contained"
      fullWidth
      onClick={handleCompleteConsultation}
      disabled={!consultationNotes}
    >
      Terminer la Consultation
    </Button>
  </Box>
</Drawer>
```

### Workflow Section 2: Résultats à Revoir

```typescript
<Card>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Résultats à Revoir
      </Typography>
      <Badge badgeContent={toReviewResults.length} color="warning">
        <Assignment />
      </Badge>
    </Box>

    <List>
      {toReviewResults.map(prescription => (
        <ListItem
          key={prescription.id}
          button
          onClick={() => openResultReview(prescription.result)}
          sx={{
            border: '1px solid',
            borderColor: 'warning.main',
            borderRadius: 1,
            mb: 1,
            '&:hover': { bgcolor: 'warning.lighter' }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#ffa726' }}>
              <Assignment />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${prescription.patient.firstName} ${prescription.patient.lastName}`}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  {prescription.text}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Validé par {prescription.result.validatedBy.name} le{' '}
                  {format(new Date(prescription.result.validatedAt), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </>
            }
          />
          <Chip label="RESULTS_AVAILABLE" color="warning" size="small" />
          <IconButton edge="end">
            <ArrowForward />
          </IconButton>
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

### Result Review Dialog

```typescript
<Dialog open={resultReviewOpen} onClose={handleCloseReview} maxWidth="md" fullWidth>
  <DialogTitle>
    Revoir les Résultats d'Analyse
    <Typography variant="body2" color="text.secondary">
      {selectedResult?.prescription.patient.firstName}{' '}
      {selectedResult?.prescription.patient.lastName}
    </Typography>
  </DialogTitle>

  <DialogContent>
    {/* Prescription Details */}
    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Prescription
        </Typography>
        <Typography variant="body1">
          {selectedResult?.prescription.text}
        </Typography>
      </CardContent>
    </Card>

    {/* Biologist Results (Read-Only) */}
    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#e8f5e9' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1 }}>
            Résultats du Biologiste
          </Typography>
          <Chip
            label={`Validé par ${selectedResult?.validatedBy.name}`}
            size="small"
            color="success"
          />
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {selectedResult?.text}
        </Typography>
      </CardContent>
    </Card>

    {/* Doctor Interpretation (Editable) */}
    <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
      Votre Interprétation Médicale
    </Typography>
    <TextField
      fullWidth
      multiline
      rows={6}
      value={interpretation}
      onChange={(e) => setInterpretation(e.target.value)}
      placeholder="Entrez votre interprétation clinique des résultats..."
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCloseReview}>Annuler</Button>
    <Button
      variant="contained"
      onClick={handleCompleteReview}
      disabled={!interpretation}
    >
      Valider l'Interprétation
    </Button>
  </DialogActions>
</Dialog>
```

---

## BIOLOGIST Dashboard

### Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Avatar, "Bienvenue, [Name]", Role Chip, Logout)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── STATISTICS ────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Analyses │  │ En Cours │  │ Complété │  │ Total    │  │
│  │ Attente  │  │ Analyse  │  │ Auj.     │  │ Ce Mois  │  │
│  │    12    │  │    7     │  │    18    │  │   234    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘

┌───────────────────── QUICK ACTIONS ───────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │ Prescriptions   │  │ Résultats       │  │ Historique │ │
│  │ Reçues          │  │ En Cours        │  │            │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
└───────────────────────────────────────────────────────────┘

┌─────────────────── WORKFLOW SECTIONS ─────────────────────┐
│  Échantillons Reçus (Badge: 12)                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient       │ Test Type      │ [Start Analysis] │   │
│  │ Jean Dupont   │ CBC, Lipids    │ [Button]         │   │
│  └───────────────────────────────────────────────────┘   │
│                                                            │
│  Analyses En Cours (Badge: 7)                            │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Patient       │ Started At     │ [Enter Results]  │   │
│  │ Marie Durant  │ 10:30          │ [Button]         │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Statistics Cards

**Card 1: Analyses en Attente**
```typescript
<StatCard
  title="Analyses en attente"
  value={12}
  icon={<Pending />}
  color="#f57c00"
  subtitle="À traiter"
/>
```

**Card 2: En Cours d'Analyse**
```typescript
<StatCard
  title="En cours d'analyse"
  value={7}
  icon={<Science />}
  color="#1976d2"
  subtitle="En laboratoire"
/>
```

**Card 3: Complétées Aujourd'hui**
```typescript
<StatCard
  title="Complétées aujourd'hui"
  value={18}
  icon={<CheckCircle />}
  color="#388e3c"
  subtitle="Résultats envoyés"
/>
```

**Card 4: Total Ce Mois**
```typescript
<StatCard
  title="Total ce mois"
  value={234}
  icon={<Assignment />}
  color="#9c27b0"
  subtitle="Analyses effectuées"
/>
```

### Workflow Section 1: Échantillons Reçus

```typescript
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Échantillons Reçus
      </Typography>
      <Badge badgeContent={receivedSamples.length} color="warning">
        <Science />
      </Badge>
    </Box>

    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Type d'Analyse</TableCell>
            <TableCell>Collecté Le</TableCell>
            <TableCell>Infirmier</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {receivedSamples.map(prescription => (
            <TableRow key={prescription.id}>
              <TableCell>
                {prescription.patient.firstName} {prescription.patient.lastName}
              </TableCell>
              <TableCell>{prescription.text}</TableCell>
              <TableCell>
                {format(new Date(prescription.sampleCollectedAt), 'dd/MM HH:mm')}
              </TableCell>
              <TableCell>{prescription.nurse?.name}</TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStartAnalysis(prescription.id)}
                >
                  Démarrer l'Analyse
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </CardContent>
</Card>
```

### Workflow Section 2: Analyses En Cours

```typescript
<Card>
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Analyses En Cours
      </Typography>
      <Badge badgeContent={inProgressAnalyses.length} color="primary">
        <Science />
      </Badge>
    </Box>

    <List>
      {inProgressAnalyses.map(prescription => (
        <ListItem
          key={prescription.id}
          button
          onClick={() => openResultEntry(prescription)}
          sx={{
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            mb: 1,
            '&:hover': { bgcolor: 'primary.lighter' }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#3949ab' }}>
              <Science />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${prescription.patient.firstName} ${prescription.patient.lastName}`}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  {prescription.text}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Démarré le {format(new Date(prescription.analysisStartedAt), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </>
            }
          />
          <Chip label="IN_PROGRESS" color="primary" size="small" />
          <IconButton edge="end">
            <ArrowForward />
          </IconButton>
        </ListItem>
      ))}
    </List>
  </CardContent>
</Card>
```

### Result Entry Dialog

```typescript
<Dialog open={resultEntryOpen} onClose={handleCloseEntry} maxWidth="md" fullWidth>
  <DialogTitle>
    Saisir les Résultats d'Analyse
    <Typography variant="body2" color="text.secondary">
      {selectedPrescription?.patient.firstName} {selectedPrescription?.patient.lastName}
    </Typography>
  </DialogTitle>

  <DialogContent>
    {/* Prescription Details */}
    <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Prescription
        </Typography>
        <Typography variant="body1">
          {selectedPrescription?.text}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Prescrit par Dr. {selectedPrescription?.doctor.name} le{' '}
          {format(new Date(selectedPrescription?.createdAt), 'dd/MM/yyyy')}
        </Typography>
      </CardContent>
    </Card>

    {/* Result Entry */}
    <Typography variant="subtitle1" gutterBottom>
      Résultats de l'Analyse
    </Typography>
    <TextField
      fullWidth
      multiline
      rows={10}
      value={resultText}
      onChange={(e) => setResultText(e.target.value)}
      placeholder="Entrez les résultats détaillés de l'analyse...

Exemple:
Complete Blood Count (CBC):
- WBC: 7.2 x10^3/μL (normal: 4-10)
- RBC: 4.8 x10^6/μL (normal: 4.5-5.5)
- Hemoglobin: 14.5 g/dL (normal: 13-17)
- Hematocrit: 42% (normal: 40-50)
- Platelet: 250 x10^3/μL (normal: 150-400)

Conclusion: Toutes les valeurs dans les limites normales."
    />

    <Alert severity="info" sx={{ mt: 2 }}>
      <AlertTitle>Note Important</AlertTitle>
      Après validation, les résultats seront envoyés au médecin prescripteur pour interprétation médicale.
    </Alert>
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCloseEntry}>Annuler</Button>
    <Button
      variant="contained"
      color="success"
      onClick={handleValidateResults}
      disabled={!resultText}
      startIcon={<CheckCircle />}
    >
      Valider et Envoyer les Résultats
    </Button>
  </DialogActions>
</Dialog>
```

---

## ADMIN Dashboard

### Layout (No Changes Required)

The ADMIN dashboard is already complete and does not need modifications for this workflow. It includes:
- User management
- System overview statistics
- Access to all patient/appointment data

---

## Common UI Components

### StatCard Component

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card
    elevation={2}
    sx={{
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)' }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);
```

### QuickActionCard Component

```typescript
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  color = '#1976d2'
}) => (
  <Card
    elevation={1}
    sx={{
      height: '100%',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        elevation: 4,
        transform: 'translateY(-2px)',
        borderColor: color,
        borderWidth: 2
      },
      border: '1px solid',
      borderColor: 'divider'
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ArrowForward sx={{ color }} />
      </Box>
    </CardContent>
  </Card>
);
```

### StatusChip Component

```typescript
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    SCHEDULED: '#1976d2',
    CHECKED_IN: '#f57c00',
    IN_CONSULTATION: '#9c27b0',
    CONSULTATION_COMPLETED: '#00897b',
    COMPLETED: '#388e3c',
    CANCELLED: '#d32f2f',
    CREATED: '#1976d2',
    SENT_TO_LAB: '#f57c00',
    SAMPLE_COLLECTED: '#9c27b0',
    IN_PROGRESS: '#3949ab',
    RESULTS_AVAILABLE: '#ffa726',
  };
  return colorMap[status] || '#757575';
};

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    SCHEDULED: 'Planifié',
    CHECKED_IN: 'Enregistré',
    IN_CONSULTATION: 'En Consultation',
    CONSULTATION_COMPLETED: 'Consultation Terminée',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    CREATED: 'Créée',
    SENT_TO_LAB: 'Envoyée au Labo',
    SAMPLE_COLLECTED: 'Échantillon Collecté',
    IN_PROGRESS: 'En Analyse',
    RESULTS_AVAILABLE: 'Résultats Disponibles',
  };
  return labelMap[status] || status;
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => (
  <Chip
    label={getStatusLabel(status)}
    sx={{ bgcolor: getStatusColor(status), color: 'white' }}
    size={size}
  />
);
```

---

## Empty State Patterns

### Generic Empty State

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    {React.cloneElement(icon as React.ReactElement, {
      sx: { fontSize: 64, color: 'text.disabled', mb: 2 }
    })}
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
    )}
    {action}
  </Box>
);
```

**Usage Examples**:

```typescript
// No appointments to check in
<EmptyState
  icon={<Event />}
  title="Aucun rendez-vous à enregistrer"
  subtitle="Tous les patients du jour ont été enregistrés"
/>

// No vitals to enter
<EmptyState
  icon={<Assignment />}
  title="Aucun patient à préparer"
  subtitle="Tous les patients enregistrés ont déjà leurs constantes"
/>

// No results to review
<EmptyState
  icon={<Science />}
  title="Aucun résultat en attente"
  subtitle="Tous les résultats de laboratoire ont été examinés"
  action={
    <Button variant="outlined" onClick={() => navigate('/prescriptions')}>
      Voir toutes les prescriptions
    </Button>
  }
/>
```

---

## Responsive Layout Grid

All dashboards use Material-UI Grid v2 with responsive breakpoints:

```typescript
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 3 }}>
    {/* StatCard 1 */}
  </Grid>
  <Grid size={{ xs: 12, md: 3 }}>
    {/* StatCard 2 */}
  </Grid>
  <Grid size={{ xs: 12, md: 3 }}>
    {/* StatCard 3 */}
  </Grid>
  <Grid size={{ xs: 12, md: 3 }}>
    {/* StatCard 4 */}
  </Grid>
</Grid>
```

Breakpoints:
- **xs** (0-600px): 1 column (mobile - not required for MVP but good practice)
- **md** (900px+): 4 columns (desktop)

---

## Navigation Flow Summary

### SECRETARY Workflow
1. Login → Dashboard
2. See "Check-In Today" section → Click patient → Check in
3. Patient status: SCHEDULED → CHECKED_IN
4. Later: See "Appointments to Close" → Click → Enter billing → Close
5. Patient status: CONSULTATION_COMPLETED → COMPLETED

### NURSE Workflow
1. Login → Dashboard
2. See "Patients to Prepare" → Click patient → Enter vitals
3. Patient status: CHECKED_IN → IN_CONSULTATION
4. See "Samples to Collect" → Click prescription → Collect sample
5. Prescription status: SENT_TO_LAB → SAMPLE_COLLECTED

### DOCTOR Workflow
1. Login → Dashboard
2. See "Consultations Ready" → Click patient → View vitals → Enter notes
3. Patient status: IN_CONSULTATION → CONSULTATION_COMPLETED
4. Create prescription → Send to lab
5. Prescription status: CREATED → SENT_TO_LAB
6. Later: See "Results to Review" → Click → Read biologist data → Enter interpretation
7. Prescription status: RESULTS_AVAILABLE → COMPLETED

### BIOLOGIST Workflow
1. Login → Dashboard
2. See "Samples Received" → Click → Start analysis
3. Prescription status: SAMPLE_COLLECTED → IN_PROGRESS
4. See "In Progress" → Click → Enter results → Validate
5. Prescription status: IN_PROGRESS → RESULTS_AVAILABLE

---

## Implementation Checklist

### Frontend Components to Create/Modify

**New Components**:
- [ ] NurseDashboard.tsx
- [ ] VitalsDialog.tsx (enhanced version)
- [ ] SampleCollectionList.tsx
- [ ] ResultReviewDialog.tsx
- [ ] ClosureDialog.tsx
- [ ] ConsultationDrawer.tsx
- [ ] ResultEntryDialog.tsx

**Modified Components**:
- [ ] Dashboard.tsx (add NURSE case)
- [ ] SecretaryDashboard (add check-in and closure sections)
- [ ] DoctorDashboard (add consultation ready and results to review)
- [ ] BiologistDashboard (add samples received and in progress)
- [ ] AppointmentsList.tsx (add check-in button)
- [ ] PrescriptionsList.tsx (add send-to-lab, collect-sample, start-analysis buttons)
- [ ] ResultsList.tsx (add review button)

**Reusable Components**:
- [ ] StatCard.tsx
- [ ] QuickActionCard.tsx
- [ ] StatusChip.tsx
- [ ] EmptyState.tsx

### API Integration Points

**New Endpoints to Call**:
- [ ] PATCH /api/appointments/:id/check-in
- [ ] PATCH /api/appointments/:id/vitals
- [ ] PATCH /api/appointments/:id/consultation
- [ ] PATCH /api/appointments/:id/close
- [ ] PATCH /api/prescriptions/:id/send-to-lab
- [ ] PATCH /api/prescriptions/:id/collect-sample
- [ ] PATCH /api/prescriptions/:id/start-analysis
- [ ] PATCH /api/results/:id/review

**Modified Endpoints**:
- [ ] GET /api/appointments (add status filters)
- [ ] GET /api/prescriptions (add status filters)
- [ ] POST /api/results (change behavior: set RESULTS_AVAILABLE)

---

## Testing Checklist

### Visual Testing
- [ ] All dashboards display correctly on 1024px+ screens
- [ ] Colors match specification for each role
- [ ] Icons are appropriate and clear
- [ ] Status chips use correct colors
- [ ] Empty states display when no data
- [ ] Badge counts are accurate

### Functional Testing
- [ ] Each role sees only their sections
- [ ] Clicking quick action cards navigates correctly
- [ ] Dialogs open and close properly
- [ ] Forms validate correctly
- [ ] Success messages appear after actions
- [ ] Error messages are user-friendly

### Workflow Testing
- [ ] Complete patient journey works end-to-end
- [ ] Status transitions trigger UI updates
- [ ] Items move between sections correctly
- [ ] Badge counts decrease when actions are taken

---

**Document Status**: COMPLETE
**Implementation Priority**: HIGH
**Estimated Effort**: 2-3 days for all dashboards
**Author**: Requirements Analyst
**Last Updated**: 2026-01-04
