import { Prescription } from './Prescription';

export interface Hematology {
  rbc?: number; // Globules rouges (M/µL)
  wbc?: number; // Globules blancs (K/µL)
  platelets?: number; // Plaquettes (K/µL)
  hemoglobin?: number; // Hémoglobine (g/dL)
  hematocrit?: number; // Hématocrite (%)
}

export interface Biochemistry {
  glucose?: number; // Glycémie (g/L)
  creatinine?: number; // Créatinine (mg/L)
  urea?: number; // Urée (g/L)
  uricAcid?: number; // Acide urique (mg/L)
}

export interface LipidProfile {
  totalCholesterol?: number; // Cholestérol total (g/L)
  hdl?: number; // HDL (g/L)
  ldl?: number; // LDL (g/L)
  triglycerides?: number; // Triglycérides (g/L)
}

export interface BiologicalData {
  hematology?: Hematology;
  biochemistry?: Biochemistry;
  lipidProfile?: LipidProfile;
}

export interface Result {
  id: string;
  data?: BiologicalData;
  text: string; // Commentaires et conclusion du biologiste

  // Validation and review
  validatedBy?: string;
  validatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  interpretation?: string; // Doctor's interpretation and recommendations

  prescriptionId: string;
  prescription?: Prescription;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResultDto {
  data?: BiologicalData;
  text: string;
  prescriptionId: string;
}

export interface UpdateResultDto {
  data?: BiologicalData;
  text?: string;
}

export interface ReviewResultDto {
  interpretation: string;
  recommendations?: string;
}
