import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { usersService } from '../../../services/usersService';
import { User } from '../../../types/User';

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  user: User | null;
  onShowSnackbar: (message: string, severity: 'success' | 'error') => void;
}

export const DeleteUserDialog = ({
  open,
  onClose,
  onDelete,
  user,
  onShowSnackbar,
}: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await usersService.delete(user.id);
      onShowSnackbar('Utilisateur supprimé avec succès', 'success');
      onDelete();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression';
      onShowSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmer la suppression</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
          <strong>{user?.name}</strong> ?
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Cette action est irréversible. L'utilisateur sera définitivement supprimé.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
