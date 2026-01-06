export interface MedicalHistory {
  allergies?: string[];
  chronicDiseases?: string[];
  familyHistory?: string[];
  currentTreatments?: string[];
  notes?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: string;
  phone: string;
  address: string;
  emergencyContact: string;
  insurance: string;
  idNumber?: string | null;
  consentMedicalData: boolean;
  consentContact: boolean;
  medicalHistory?: MedicalHistory;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    prescriptions: number;
  };
  appointments?: any[];
  prescriptions?: any[];
  documents?: any[];
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: string;
  phone: string;
  address: string;
  emergencyContact: string;
  insurance: string;
  idNumber?: string;
  consentMedicalData: boolean;
  consentContact: boolean;
  medicalHistory?: MedicalHistory;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  sex?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  insurance?: string;
  idNumber?: string;
  consentMedicalData?: boolean;
  consentContact?: boolean;
  medicalHistory?: MedicalHistory;
}
