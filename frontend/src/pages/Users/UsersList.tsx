import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { usersService } from '../../services/usersService';
import { User, Role } from '../../types/User';
import { UserDialog } from './components/UserDialog';
import { DeleteUserDialog } from './components/DeleteUserDialog';

export const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, roleFilter]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = users;

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleOpenDialog = (user?: User) => {
    setEditingUser(user || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
    setOpenDialog(false);
  };

  const handleSaveUser = async () => {
    await fetchUsers();
    handleCloseDialog();
  };

  const handleOpenDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeletingUser(null);
    setOpenDeleteDialog(false);
  };

  const handleDeleteUser = async () => {
    await fetchUsers();
    handleCloseDeleteDialog();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRoleFilterChange = (event: SelectChangeEvent<Role | ''>) => {
    setRoleFilter(event.target.value as Role | '');
  };

  const getRoleLabel = (role: Role) => {
    const labels = {
      [Role.ADMIN]: 'Administrateur',
      [Role.DOCTOR]: 'Médecin',
      [Role.BIOLOGIST]: 'Biologiste',
      [Role.NURSE]: 'Infirmier',
      [Role.SECRETARY]: 'Secrétaire',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Gestion des Utilisateurs
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Ajouter Utilisateur
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" gap={2} mb={3}>
            <TextField
              label="Rechercher par nom ou email"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrer par rôle</InputLabel>
              <Select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="Filtrer par rôle"
              >
                <MenuItem value="">Tous les rôles</MenuItem>
                <MenuItem value={Role.ADMIN}>Administrateur</MenuItem>
                <MenuItem value={Role.DOCTOR}>Médecin</MenuItem>
                <MenuItem value={Role.BIOLOGIST}>Biologiste</MenuItem>
                <MenuItem value={Role.NURSE}>Infirmier</MenuItem>
                <MenuItem value={Role.SECRETARY}>Secrétaire</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {filteredUsers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                Aucun utilisateur trouvé
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleLabel(user.role)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(user)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDeleteDialog(user)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveUser}
        user={editingUser}
        onShowSnackbar={showSnackbar}
      />

      <DeleteUserDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onDelete={handleDeleteUser}
        user={deletingUser}
        onShowSnackbar={showSnackbar}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
