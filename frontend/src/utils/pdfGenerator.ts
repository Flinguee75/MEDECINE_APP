import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImagingPrescriptionData {
  patientName: string;
  patientDOB: string;
  doctorName: string;
  examType: string;
  anatomicalRegion: string;
  urgency: 'STANDARD' | 'URGENT';
  withContrast: boolean;
  clinicalIndication: string;
  diagnosticQuestion?: string;
  allergies?: string;
  previousExams?: string;
  prescriptionDate: Date;
  consultationId: string;
}

export const generateImagingPrescriptionPDF = (data: ImagingPrescriptionData) => {
  const doc = new jsPDF();
  
  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = 20;

  // Fonction helper pour ajouter du texte
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
    } else {
      doc.text(text, margin, yPosition);
    }
    yPosition += lineHeight;
  };

  const addMultilineText = (text: string, fontSize: number = 11, maxWidth: number = pageWidth - 2 * margin) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight;
  };

  const addSpacer = (space: number = lineHeight) => {
    yPosition += space;
  };

  // En-tête
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  addText('PRESCRIPTION D\'EXAMEN D\'IMAGERIE MÉDICALE', 16, true, 'center');
  yPosition = 35;
  addText(format(data.prescriptionDate, 'dd MMMM yyyy', { locale: fr }), 10, false, 'center');
  
  doc.setTextColor(0, 0, 0);
  yPosition = 55;

  // Informations médecin
  addText('Médecin prescripteur', 12, true);
  addText(`Dr. ${data.doctorName}`, 11);
  addSpacer();
  addLine();
  addSpacer();

  // Informations patient
  addText('Informations du patient', 12, true);
  addText(`Nom: ${data.patientName}`, 11);
  addText(`Date de naissance: ${data.patientDOB}`, 11);
  addSpacer();
  addLine();
  addSpacer();

  // Détails de l'examen
  addText('Détails de l\'examen', 12, true);
  addText(`Type d'examen: ${data.examType}`, 11, true);
  addText(`Région anatomique: ${data.anatomicalRegion}`, 11);
  
  // Urgence avec couleur
  if (data.urgency === 'URGENT') {
    doc.setTextColor(220, 53, 69);
    addText('URGENCE: EXAMEN URGENT', 11, true);
    doc.setTextColor(0, 0, 0);
  } else {
    addText('Urgence: Standard', 11);
  }
  
  if (data.withContrast) {
    doc.setTextColor(255, 140, 0);
    addText('⚠ AVEC INJECTION DE PRODUIT DE CONTRASTE', 11, true);
    doc.setTextColor(0, 0, 0);
  }
  
  addSpacer();
  addLine();
  addSpacer();

  // Indication clinique
  addText('Indication clinique / Renseignements cliniques', 12, true);
  addMultilineText(data.clinicalIndication, 10);
  addSpacer();

  // Question diagnostique
  if (data.diagnosticQuestion) {
    addLine();
    addSpacer();
    addText('Question diagnostique', 12, true);
    addMultilineText(data.diagnosticQuestion, 10);
    addSpacer();
  }

  // Allergies
  if (data.allergies) {
    addLine();
    addSpacer();
    doc.setTextColor(220, 53, 69);
    addText('⚠ ALLERGIES CONNUES', 12, true);
    doc.setTextColor(0, 0, 0);
    addMultilineText(data.allergies, 10);
    addSpacer();
  }

  // Examens antérieurs
  if (data.previousExams) {
    addLine();
    addSpacer();
    addText('Examens antérieurs', 12, true);
    addMultilineText(data.previousExams, 10);
    addSpacer();
  }

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 30;
  yPosition = footerY;
  addLine();
  addText(`ID Consultation: ${data.consultationId}`, 9, false, 'center');
  addText(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 8, false, 'center');

  // Signature
  yPosition = footerY - 20;
  doc.text('Signature du médecin:', margin, yPosition);
  doc.line(margin + 50, yPosition + 5, margin + 100, yPosition + 5);

  // Télécharger le PDF
  const fileName = `Prescription_Imagerie_${data.patientName.replace(/\s+/g, '_')}_${format(data.prescriptionDate, 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
