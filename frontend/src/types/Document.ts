import { Patient } from './Patient';

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy?: string;
  patientId: string;
  patient?: Patient;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  name: string;
  type: string;
  url: string;
  patientId: string;
}

export interface UpdateDocumentDto {
  name?: string;
  type?: string;
  url?: string;
}
