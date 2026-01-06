# API REST - Spécification Complète

## Base URL
```
http://localhost:3000/api
```

## Format des réponses
Toutes les réponses de l'API suivent ce format :

### Succès
```json
{
  "data": { ... },
  "message": "Action réussie"
}
```

### Erreur
```json
{
  "statusCode": 400,
  "message": "Description de l'erreur",
  "error": "Bad Request"
}
```

---

## 🔐 Authentification

### POST /auth/login
**Description :** Connexion d'un utilisateur

**Permissions :** Public

**Body :**
```json
{
  "email": "medecin@hospital.com",
  "password": "password123"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Dr. Martin",
      "email": "medecin@hospital.com",
      "role": "DOCTOR"
    }
  },
  "message": "Connexion réussie"
}
```

**Erreurs possibles :**
- `401` : Email ou mot de passe incorrect

---

### POST /auth/logout
**Description :** Déconnexion de l'utilisateur connecté

**Permissions :** Authentifié

**Réponse (200) :**
```json
{
  "message": "Déconnexion réussie"
}
```

---

### GET /auth/me
**Description :** Récupérer les informations de l'utilisateur connecté

**Permissions :** Authentifié

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Dr. Martin",
    "email": "medecin@hospital.com",
    "role": "DOCTOR",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `401` : Non authentifié

---

## 👥 Users (Utilisateurs)

### GET /users
**Description :** Liste de tous les utilisateurs

**Permissions :** ADMIN

**Query Params (optionnels) :**
- `role` : Filtrer par rôle (DOCTOR, BIOLOGIST, SECRETARY)
- `search` : Recherche par nom ou email

**Réponse (200) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Dr. Martin",
      "email": "medecin@hospital.com",
      "role": "DOCTOR",
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /users
**Description :** Créer un nouvel utilisateur

**Permissions :** ADMIN

**Body :**
```json
{
  "name": "Dr. Sophie Dupont",
  "email": "sophie.dupont@hospital.com",
  "password": "password123",
  "role": "DOCTOR"
}
```

**Réponse (201) :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Dr. Sophie Dupont",
    "email": "sophie.dupont@hospital.com",
    "role": "DOCTOR"
  },
  "message": "Utilisateur créé avec succès"
}
```

**Erreurs possibles :**
- `400` : Email déjà utilisé
- `403` : Permissions insuffisantes

---

### GET /users/:id
**Description :** Détails d'un utilisateur

**Permissions :** ADMIN ou l'utilisateur lui-même

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Dr. Martin",
    "email": "medecin@hospital.com",
    "role": "DOCTOR",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-02T10:00:00.000Z"
  }
}
```

---

### PATCH /users/:id
**Description :** Modifier un utilisateur

**Permissions :** ADMIN

**Body (tous optionnels) :**
```json
{
  "name": "Dr. Martin Nouveau",
  "email": "nouveau@hospital.com",
  "role": "BIOLOGIST"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Dr. Martin Nouveau",
    "email": "nouveau@hospital.com",
    "role": "BIOLOGIST"
  },
  "message": "Utilisateur modifié avec succès"
}
```

---

### DELETE /users/:id
**Description :** Supprimer un utilisateur

**Permissions :** ADMIN

**Réponse (200) :**
```json
{
  "message": "Utilisateur supprimé avec succès"
}
```

---

## 👤 Patients

### GET /patients
**Description :** Liste de tous les patients

**Permissions :** Authentifié (tous les rôles)

**Query Params (optionnels) :**
- `search` : Recherche par nom ou prénom
- `limit` : Nombre de résultats (défaut: 50)
- `offset` : Pagination (défaut: 0)

**Réponse (200) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-05-15T00:00:00.000Z",
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

### POST /patients
**Description :** Créer un nouveau patient

**Permissions :** SECRETARY

**Body :**
```json
{
  "firstName": "Marie",
  "lastName": "Martin",
  "birthDate": "1990-03-20"
}
```

**Réponse (201) :**
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Marie",
    "lastName": "Martin",
    "birthDate": "1990-03-20T00:00:00.000Z",
    "createdAt": "2026-01-02T10:00:00.000Z"
  },
  "message": "Patient créé avec succès"
}
```

**Erreurs possibles :**
- `403` : Seul le secrétariat peut créer des patients

---

### GET /patients/:id
**Description :** Détails d'un patient

**Permissions :** Authentifié

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jean",
    "lastName": "Dupont",
    "birthDate": "1980-05-15T00:00:00.000Z",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-02T10:00:00.000Z"
  }
}
```

---

### PATCH /patients/:id
**Description :** Modifier un patient

**Permissions :** SECRETARY

**Body (tous optionnels) :**
```json
{
  "firstName": "Jean-Pierre",
  "lastName": "Dupont",
  "birthDate": "1980-05-15"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jean-Pierre",
    "lastName": "Dupont",
    "birthDate": "1980-05-15T00:00:00.000Z"
  },
  "message": "Patient modifié avec succès"
}
```

---

## 📅 Appointments (Rendez-vous)

### GET /appointments
**Description :** Liste des rendez-vous

**Permissions :** Authentifié

**Query Params (optionnels) :**
- `doctorId` : Filtrer par médecin
- `patientId` : Filtrer par patient
- `status` : Filtrer par statut (SCHEDULED, COMPLETED, CANCELLED)
- `date` : Filtrer par date (format: YYYY-MM-DD)

**Réponse (200) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-01-05T14:00:00.000Z",
      "motif": "Consultation de suivi",
      "status": "SCHEDULED",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      },
      "createdAt": "2026-01-02T10:00:00.000Z"
    }
  ]
}
```

---

### POST /appointments
**Description :** Créer un rendez-vous

**Permissions :** SECRETARY

**Body :**
```json
{
  "date": "2026-01-10T15:00:00.000Z",
  "motif": "Première consultation",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid"
}
```

**Réponse (201) :**
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-10T15:00:00.000Z",
    "motif": "Première consultation",
    "status": "SCHEDULED",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid"
  },
  "message": "Rendez-vous créé avec succès"
}
```

**Erreurs possibles :**
- `400` : Patient ou médecin introuvable
- `409` : Le médecin a déjà un rendez-vous à cette heure

---

### GET /appointments/:id
**Description :** Détails d'un rendez-vous

**Permissions :** Authentifié

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-05T14:00:00.000Z",
    "motif": "Consultation de suivi",
    "status": "SCHEDULED",
    "patient": {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-05-15T00:00:00.000Z"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Martin",
      "email": "medecin@hospital.com"
    }
  }
}
```

---

### PATCH /appointments/:id
**Description :** Modifier un rendez-vous

**Permissions :** SECRETARY ou DOCTOR (pour changer le statut uniquement)

**Body (tous optionnels) :**
```json
{
  "date": "2026-01-10T16:00:00.000Z",
  "motif": "Consultation modifiée",
  "status": "COMPLETED"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "date": "2026-01-10T16:00:00.000Z",
    "motif": "Consultation modifiée",
    "status": "COMPLETED"
  },
  "message": "Rendez-vous modifié avec succès"
}
```

---

### DELETE /appointments/:id
**Description :** Annuler un rendez-vous (change le statut à CANCELLED)

**Permissions :** SECRETARY

**Réponse (200) :**
```json
{
  "message": "Rendez-vous annulé avec succès"
}
```

---

## 💊 Prescriptions

### GET /prescriptions
**Description :** Liste des prescriptions

**Permissions :** Authentifié

**Query Params (optionnels) :**
- `doctorId` : Filtrer par médecin
- `patientId` : Filtrer par patient
- `status` : Filtrer par statut (CREATED, SENT_TO_LAB, IN_PROGRESS, COMPLETED)

**Réponse (200) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Analyse sanguine complète",
      "status": "SENT_TO_LAB",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      },
      "createdAt": "2026-01-02T10:00:00.000Z",
      "result": null
    }
  ]
}
```

---

### POST /prescriptions
**Description :** Créer une prescription

**Permissions :** DOCTOR

**Body :**
```json
{
  "text": "Analyse sanguine : NFS, glycémie à jeun, bilan lipidique",
  "patientId": "patient-uuid"
}
```

**Réponse (201) :**
```json
{
  "data": {
    "id": "uuid",
    "text": "Analyse sanguine : NFS, glycémie à jeun, bilan lipidique",
    "status": "CREATED",
    "patientId": "patient-uuid",
    "doctorId": "current-doctor-uuid",
    "createdAt": "2026-01-02T10:00:00.000Z"
  },
  "message": "Prescription créée avec succès"
}
```

**Erreurs possibles :**
- `403` : Seul un médecin peut créer des prescriptions
- `400` : Patient introuvable

---

### GET /prescriptions/:id
**Description :** Détails d'une prescription

**Permissions :** Authentifié

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "text": "Analyse sanguine : NFS, glycémie à jeun, bilan lipidique",
    "status": "COMPLETED",
    "patient": {
      "id": "uuid",
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-05-15T00:00:00.000Z"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Martin",
      "email": "medecin@hospital.com"
    },
    "result": {
      "id": "uuid",
      "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L",
      "createdAt": "2026-01-03T14:00:00.000Z"
    },
    "createdAt": "2026-01-02T10:00:00.000Z"
  }
}
```

---

### PATCH /prescriptions/:id
**Description :** Modifier le statut d'une prescription

**Permissions :** DOCTOR (pour CREATED), BIOLOGIST (pour SENT_TO_LAB, IN_PROGRESS, COMPLETED)

**Body :**
```json
{
  "status": "SENT_TO_LAB"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "status": "SENT_TO_LAB",
    "updatedAt": "2026-01-02T11:00:00.000Z"
  },
  "message": "Statut de la prescription modifié avec succès"
}
```

**Erreurs possibles :**
- `400` : Transition de statut invalide
- `403` : Permissions insuffisantes

---

## 🔬 Results (Résultats)

### GET /results
**Description :** Liste des résultats

**Permissions :** DOCTOR, BIOLOGIST

**Query Params (optionnels) :**
- `prescriptionId` : Filtrer par prescription

**Réponse (200) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L",
      "prescription": {
        "id": "uuid",
        "text": "Analyse sanguine : NFS, glycémie à jeun",
        "patient": {
          "firstName": "Jean",
          "lastName": "Dupont"
        }
      },
      "createdAt": "2026-01-03T14:00:00.000Z"
    }
  ]
}
```

---

### POST /results
**Description :** Créer un résultat pour une prescription

**Permissions :** BIOLOGIST

**Body :**
```json
{
  "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L, Cholestérol total: 1.8g/L",
  "prescriptionId": "prescription-uuid"
}
```

**Réponse (201) :**
```json
{
  "data": {
    "id": "uuid",
    "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L, Cholestérol total: 1.8g/L",
    "prescriptionId": "prescription-uuid",
    "createdAt": "2026-01-03T14:00:00.000Z"
  },
  "message": "Résultat créé avec succès"
}
```

**Note :** La création d'un résultat change automatiquement le statut de la prescription à `COMPLETED`

**Erreurs possibles :**
- `403` : Seul un biologiste peut créer des résultats
- `400` : Prescription introuvable ou déjà complétée
- `409` : Un résultat existe déjà pour cette prescription

---

### GET /results/:id
**Description :** Détails d'un résultat

**Permissions :** DOCTOR, BIOLOGIST

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L",
    "prescription": {
      "id": "uuid",
      "text": "Analyse sanguine : NFS, glycémie à jeun",
      "status": "COMPLETED",
      "patient": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Martin"
      }
    },
    "createdAt": "2026-01-03T14:00:00.000Z"
  }
}
```

---

### PATCH /results/:id
**Description :** Modifier un résultat

**Permissions :** BIOLOGIST

**Body :**
```json
{
  "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L (corrigé)"
}
```

**Réponse (200) :**
```json
{
  "data": {
    "id": "uuid",
    "text": "Résultats normaux. NFS: 5.2M/μL, Glycémie: 0.95g/L (corrigé)",
    "updatedAt": "2026-01-03T15:00:00.000Z"
  },
  "message": "Résultat modifié avec succès"
}
```

---

## 📊 Récapitulatif des Permissions

| Endpoint | ADMIN | DOCTOR | BIOLOGIST | SECRETARY |
|----------|-------|--------|-----------|-----------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ |
| GET /users | ✅ | ❌ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ | ❌ |
| GET /patients | ✅ | ✅ | ✅ | ✅ |
| POST /patients | ✅ | ❌ | ❌ | ✅ |
| PATCH /patients | ✅ | ❌ | ❌ | ✅ |
| GET /appointments | ✅ | ✅ | ✅ | ✅ |
| POST /appointments | ✅ | ❌ | ❌ | ✅ |
| PATCH /appointments | ✅ | ✅ (statut) | ❌ | ✅ |
| GET /prescriptions | ✅ | ✅ | ✅ | ✅ |
| POST /prescriptions | ✅ | ✅ | ❌ | ❌ |
| PATCH /prescriptions | ✅ | ✅ (CREATED) | ✅ (LAB) | ❌ |
| GET /results | ✅ | ✅ | ✅ | ❌ |
| POST /results | ✅ | ❌ | ✅ | ❌ |
| PATCH /results | ✅ | ❌ | ✅ | ❌ |

---

**Date de création :** 02/01/2026
**Version :** 1.0
