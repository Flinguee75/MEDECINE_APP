import { useEffect, useMemo, useState } from 'react';
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
import Grid from '@mui/material/GridLegacy';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionsService } from '../../services/prescriptionsService';
import { documentsService } from '../../services/documentsService';
import { resultsService } from '../../services/resultsService';
import { Prescription, PrescriptionStatus } from '../../types/Prescription';
import { Document } from '../../types/Document';
import { BiologicalData } from '../../types/Result';
import { format } from 'date-fns';

const resultDocType = (prescriptionId: string) => `BIO_RESULT:${prescriptionId}`;

const renderBiologicalData = (data?: BiologicalData) => {
  if (!data) return null;
  const rows: Array<{ label: string; value?: number | string }> = [
    { label: 'RBC', value: data.hematology?.rbc },
    { label: 'WBC', value: data.hematology?.wbc },
    { label: 'Plaquettes', value: data.hematology?.platelets },
    { label: 'Hémoglobine', value: data.hematology?.hemoglobin },
    { label: 'Hématocrite', value: data.hematology?.hematocrit },
    { label: 'Glycémie', value: data.biochemistry?.glucose },
    { label: 'Créatinine', value: data.biochemistry?.creatinine },
    { label: 'Urée', value: data.biochemistry?.urea },
    { label: 'Acide urique', value: data.biochemistry?.uricAcid },
    { label: 'Cholestérol total', value: data.lipidProfile?.totalCholesterol },
    { label: 'HDL', value: data.lipidProfile?.hdl },
    { label: 'LDL', value: data.lipidProfile?.ldl },
    { label: 'Triglycérides', value: data.lipidProfile?.triglycerides },
  ];

  const filled = rows.filter((row) => row.value !== undefined && row.value !== null);
  if (filled.length === 0) return null;

  return (
    <Grid container spacing={1} sx={{ mt: 1 }}>
      {filled.map((row) => (
        <Grid item xs={12} sm={6} md={4} key={row.label}>
          <Typography variant="caption" color="text.secondary">
            {row.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.value}
          </Typography>
        </Grid>
      ))}
    </Grid>
  );
};

export const PrescriptionReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [attachments, setAttachments] = useState<Document[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const data = await prescriptionsService.getOne(id);
        setPrescription(data);
        if (data.result?.interpretation) {
          setInterpretation(data.result.interpretation);
        }
        if (data.patientId) {
          const docs = await documentsService.getAll({ patientId: data.patientId });
          setAttachments(docs.filter((doc) => doc.type === resultDocType(data.id)));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const result = prescription?.result;
  const isReviewed = Boolean(result?.reviewedAt);
  const canReview = prescription?.status === PrescriptionStatus.RESULTS_AVAILABLE;

  const statusLabel = useMemo(() => {
    switch (prescription?.status) {
      case PrescriptionStatus.RESULTS_AVAILABLE:
        return 'Résultat reçu';
      case PrescriptionStatus.COMPLETED:
        return 'Validée';
      case PrescriptionStatus.IN_PROGRESS:
        return 'En cours';
      case PrescriptionStatus.SENT_TO_LAB:
      case PrescriptionStatus.SAMPLE_COLLECTED:
      case PrescriptionStatus.CREATED:
        return 'En attente';
      default:
        return prescription?.status || '';
    }
  }, [prescription?.status]);

  const handleReview = async () => {
    if (!result) {
      setError('Aucun résultat disponible');
      return;
    }
    if (!interpretation.trim()) {
      setError('Veuillez saisir une interprétation');
      return;
    }
    try {
      setSaving(true);
      await resultsService.review(result.id, {
        interpretation: interpretation.trim(),
        recommendations: recommendations.trim() || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
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
          Révision des résultats
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!result && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Aucun résultat biologiste n'est disponible pour cette prescription.
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
            Statut: {statusLabel}
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
            Demande biologique
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
            {prescription.text}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Résultats biologiste
          </Typography>
          {result?.text ? (
            <>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                {result.text}
              </Typography>
              {renderBiologicalData(result.data)}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucun résultat textuel disponible.
            </Typography>
          )}
          {result?.reviewedAt && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Résultat révisé le {format(new Date(result.reviewedAt), 'dd/MM/yyyy HH:mm')}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Pièces jointes
          </Typography>
          {attachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aucun fichier joint
            </Typography>
          ) : (
            <Box sx={{ mt: 1 }}>
              {attachments.map((doc) => {
                const isImage = doc.url.startsWith('data:image');
                return (
                  <Box key={doc.id} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {doc.name}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {isImage ? (
                        <Box
                          component="img"
                          src={doc.url}
                          alt={doc.name}
                          sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                        />
                      ) : (
                        <Link href={doc.url} target="_blank" rel="noreferrer">
                          Ouvrir le fichier
                        </Link>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Interprétation médecin
          </Typography>
          <TextField
            fullWidth
            label="Interprétation"
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value)}
            multiline
            minRows={4}
            disabled={isReviewed}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Recommandations"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            multiline
            minRows={3}
            disabled={isReviewed}
            sx={{ mt: 2 }}
          />
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleReview}
              disabled={!canReview || saving || isReviewed}
            >
              {saving ? 'Validation...' : 'Valider les résultats'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
