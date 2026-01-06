import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import { usersService, CreateUserData, UpdateUserData } from '../../../services/usersService';
import { User, Role } from '../../../types/User';

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  user: User | null;
  onShowSnackbar: (message: string, severity: 'success' | 'error') => void;
}

export const UserDialog = ({ open, onClose, onSave, user, onShowSnackbar }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.DOCTOR as Role,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      // Edit mode - pre-fill data
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't pre-fill password
        role: user.role,
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: Role.DOCTOR,
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!user && !formData.password) {
      // Password required for create mode
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (user) {
        // Update mode
        const updateData: UpdateUserData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        await usersService.update(user.id, updateData);
        onShowSnackbar('Utilisateur modifié avec succès', 'success');
      } else {
        // Create mode
        const createData: CreateUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        await usersService.create(createData);
        onShowSnackbar('Utilisateur créé avec succès', 'success');
      }

      onSave();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la sauvegarde';
      onShowSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<Role>) => {
    setFormData({
      ...formData,
      role: event.target.value as Role,
    });
    if (errors.role) {
      setErrors({
        ...errors,
        role: '',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nom"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
            required
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            required
          />

          <TextField
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            error={!!errors.password}
            helperText={
              errors.password ||
              (user ? 'Laisser vide pour ne pas modifier le mot de passe' : '')
            }
            fullWidth
            required={!user}
          />

          <FormControl fullWidth required error={!!errors.role}>
            <InputLabel>Rôle</InputLabel>
            <Select value={formData.role} onChange={handleRoleChange} label="Rôle">
              <MenuItem value={Role.ADMIN}>Administrateur</MenuItem>
              <MenuItem value={Role.DOCTOR}>Médecin</MenuItem>
              <MenuItem value={Role.BIOLOGIST}>Biologiste</MenuItem>
              <MenuItem value={Role.NURSE}>Infirmier</MenuItem>
              <MenuItem value={Role.SECRETARY}>Secrétaire</MenuItem>
            </Select>
            {errors.role && (
              <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                {errors.role}
              </Box>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : user ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
