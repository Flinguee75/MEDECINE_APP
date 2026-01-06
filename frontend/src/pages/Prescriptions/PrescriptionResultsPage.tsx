import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionsService } from '../../services/prescriptionsService';
import { documentsService } from '../../services/documentsService';
import { resultsService } from '../../services/resultsService';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';
import { format } from 'date-fns';

const resultDocType = (prescriptionId: string) => `BIO_RESULT:${prescriptionId}`;

type Attachment = {
  file: File;
  dataUrl: string;
};

export const PrescriptionResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const result = await prescriptionsService.getOne(id);
        setPrescription(result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const canSubmit =
    prescription?.status === PrescriptionStatus.IN_PROGRESS ||
    prescription?.status === PrescriptionStatus.COMPLETED;

  const hasResult = Boolean(prescription?.result);

  const handleSubmit = async () => {
    if (!id) return;
    if (!text.trim()) {
      setError('Veuillez saisir les résultats');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await resultsService.create({
        prescriptionId: id,
        text: text.trim(),
      });
      if (attachments.length > 0 && prescription) {
        await Promise.all(
          attachments.map((item) =>
            documentsService.create({
              name: item.file.name,
              type: resultDocType(prescription.id),
              url: item.dataUrl,
              patientId: prescription.patientId,
            })
          )
        );
      }
      setSuccess('Résultats enregistrés');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted: Attachment[] = [];
    for (const file of Array.from(files)) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      if (!isPdf && !isImage) {
        setError('Seuls les fichiers PDF et images sont acceptés');
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erreur de lecture fichier'));
        reader.readAsDataURL(file);
      });
      accepted.push({ file, dataUrl });
    }
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((item) => item.file.name !== name));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Chargement...
        </Typography>
      </Container>
    );
  }

  if (!prescription) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Prescription introuvable</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Saisie des résultats
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {hasResult && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cette prescription a déjà un résultat.
        </Alert>
      )}
      {!canSubmit && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La prescription doit être en cours pour saisir des résultats.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {prescription.patient?.firstName} {prescription.patient?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statut: {prescription.status}
          </Typography>
          {prescription.createdAt && (
            <Typography variant="caption" color="text.secondary">
              Prescription créée le {format(new Date(prescription.createdAt), 'dd/MM/yyyy HH:mm')}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Demande du médecin
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
            {prescription.text}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Résultats biologiques
          </Typography>
          <TextField
            fullWidth
            label="Résultats (texte libre)"
            placeholder="Ex: NFS normale, CRP élevée à 35 mg/L, glycémie à jeun 1.12 g/L..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            minRows={4}
            sx={{ mt: 2 }}
          />

          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Pièces jointes (PDF ou images)
          </Typography>
          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 2 }}
            disabled={saving || hasResult}
          >
            Ajouter des fichiers
            <input
              type="file"
              hidden
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </Button>
          {attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {attachments.map((item) => {
                const isImage = item.file.type.startsWith('image/');
                return (
                  <Box key={item.file.name} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.file.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      {isImage ? (
                        <Box
                          component="img"
                          src={item.dataUrl}
                          alt={item.file.name}
                          sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                        />
                      ) : (
                        <Link href={item.dataUrl} target="_blank" rel="noreferrer">
                          Voir le PDF
                        </Link>
                      )}
                      <Button color="error" onClick={() => handleRemoveAttachment(item.file.name)}>
                        Supprimer
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit || saving || hasResult}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les résultats'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
