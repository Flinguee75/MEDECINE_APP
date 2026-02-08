import { useState, FormEvent } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  alpha,
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

  const testAccounts = [
    { role: 'Admin', email: 'admin@hospital.com', password: 'admin123' },
    { role: 'Secrétaire', email: 'secretary@hospital.com', password: 'secretary123' },
    { role: 'Médecin', email: 'doctor@hospital.com', password: 'doctor123' },
    { role: 'Biologiste', email: 'biologist@hospital.com', password: 'biologist123' },
    { role: 'Infirmier', email: 'nurse@hospital.com', password: 'nurse123' },
    { role: 'Radiologue', email: 'radiologist@hospital.com', password: 'radiologist123' },
  ];

  const handleTestAccountClick = (account: { email: string; password: string }) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3e7d3',
        p: 3,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 0,
          backgroundColor: '#fff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${alpha('#000', 0.3)}`,
        }}
      >
        {/* Section gauche - Branding */}
        <Box
          sx={{
            background: `linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)`,
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <Box
            component="img"
            src="/logo_edlona.jpg"
            alt="Logo EDLONA"
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              backgroundColor: '#fff',
              p: 1,
              mb: 3,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            EDLONA
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
            Centre de Cardiologie
          </Typography>
          <Box sx={{ mt: 4, opacity: 0.8 }}>
            <Typography variant="body2">Système de Gestion Médical</Typography>
          </Box>
        </Box>

        {/* Section droite - Formulaire */}
        <Box sx={{ p: { xs: 4, md: 6 } }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Connexion
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Accédez à votre espace de travail
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Stack>
          </form>

          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: alpha('#1976D2', 0.05),
              borderRadius: 2,
              borderLeft: `3px solid #1976D2`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                color: 'primary.main',
                mb: 1,
              }}
            >
              COMPTES DE TEST
            </Typography>
            <Stack spacing={0.5}>
              {testAccounts.map((account) => (
                <Typography
                  key={account.role}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  }}
                  onClick={() => handleTestAccountClick(account)}
                >
                  {account.role}: {account.email} / {account.password}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
