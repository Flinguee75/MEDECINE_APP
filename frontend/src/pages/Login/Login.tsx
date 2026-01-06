import { useState, FormEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              align="center"
              gutterBottom
              sx={{ mb: 1 }}
            >
              HÔPITAL MVP
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Système de Gestion
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                autoFocus
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>Comptes de test :</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Admin: admin@hospital.com / admin123
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Médecin: doctor@hospital.com / doctor123
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Biologiste: biologist@hospital.com / biologist123
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Secrétaire: secretary@hospital.com / secretary123
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Infirmier: nurse@hospital.com / nurse123
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
