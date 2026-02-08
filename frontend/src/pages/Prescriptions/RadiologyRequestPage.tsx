import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionsService } from '../../services/prescriptionsService';
import { Prescription } from '../../types/Prescription';

export function RadiologyRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<Prescription | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Demande introuvable');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await prescriptionsService.getOne(id);
        setRequest(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement de la demande');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="text.secondary">Chargement...</Typography>
      </Container>
    );
  }

  if (error || !request) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Demande introuvable'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
          Retour dashboard
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Demande d'imagerie
          </Typography>
          <Chip label={request.status} size="small" color="secondary" sx={{ mb: 2 }} />

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {request.patient?.firstName} {request.patient?.lastName}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">
            Médecin prescripteur
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {request.doctor?.name || 'N/A'}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">
            Date de demande
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {new Date(request.createdAt).toLocaleString('fr-FR')}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Détails de la demande
          </Typography>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {request.text}
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate(`/prescriptions/${request.id}/results`)}>
              Saisir resultat
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
