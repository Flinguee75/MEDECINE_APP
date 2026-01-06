---
story: "1.7"
epic: "1"
title: "Frontend - User Management Page (ADMIN)"
status: "ready-for-dev"
priority: "high"
assignee: ""
estimatedHours: 6
actualHours: 0
createdAt: "2026-01-06"
updatedAt: "2026-01-06"
tags: ["frontend", "admin", "user-management", "material-ui"]
dependencies: ["1.1", "1.2", "1.3", "1.4", "1.6"]
blockedBy: []
relatedStories: []
---

# Story 1.7: Frontend - User Management Page (ADMIN)

## User Story

As an **administrator**,
I want a user management interface to create, view, update, and delete users,
So that I can manage hospital staff accounts.

## Acceptance Criteria

**Given** I am logged in as ADMIN and on the /users page (ProtectedRoute)
**When** I view the page
**Then** I see a Material-UI Table with columns: Name, Email, Role, Actions
**And** I can filter users by role using a Select dropdown
**And** I can search users by name/email using a TextField with debounce
**And** I can click "Ajouter Utilisateur" button to open a Dialog for user creation
**And** the creation Dialog includes validated fields: name, email, password, role (Select)
**And** I can edit a user by clicking an Edit IconButton (opens Dialog with pre-filled data)
**And** I can delete a user by clicking a Delete IconButton (shows confirmation Dialog per UX8)
**And** all actions show Snackbar feedback: "Utilisateur créé avec succès", "Utilisateur supprimé", etc. (UX7)
**And** loading states are shown during API calls (CircularProgress per UX9)
**And** empty state message is shown when no users exist (UX10)
**And** all buttons follow placement rules: primary on right, secondary on left (UX11)

## Technical Requirements

### Backend Verification

Verify these endpoints exist (Story 1.4 - User Management CRUD):
- `GET /api/users` - List all users (ADMIN only)
- `POST /api/users` - Create new user (ADMIN only)
- `PATCH /api/users/:id` - Update user (ADMIN only)
- `DELETE /api/users/:id` - Delete user (ADMIN only)

### Frontend Implementation

**File Structure:**
```
frontend/src/pages/Users/
  ├── UsersList.tsx
  ├── components/
  │   ├── UserDialog.tsx
  │   └── DeleteUserDialog.tsx
  └── usersList.css (optional)
```

**Required Components:**
- UsersList.tsx (main page component)
- UserDialog.tsx (create/edit dialog)
- DeleteUserDialog.tsx (confirmation dialog)

**Material-UI Components:**
- Table, TableHead, TableBody, TableRow, TableCell
- TextField (search with debounce)
- Select, MenuItem (role filter)
- Button (Ajouter Utilisateur)
- IconButton (Edit, Delete icons)
- Dialog, DialogTitle, DialogContent, DialogActions
- CircularProgress (loading states)
- Snackbar (feedback notifications)
- Box, Typography, Paper

**API Service:**
```typescript
// frontend/src/services/users.ts
export const getUsers = async (filters?: { role?: string; search?: string }) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
};

export const createUser = async (data: CreateUserDto) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
```

**Route Configuration:**
```typescript
// Add to App.tsx Routes
<Route
  path="/users"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <UsersList />
    </ProtectedRoute>
  }
/>
```

**UX Requirements:**
- UX7: Snackbar feedback (<200ms response time)
- UX8: Confirmation dialogs for destructive actions
- UX9: Loading states with CircularProgress
- UX10: Empty state messages ("Aucun utilisateur trouvé")
- UX11: Button hierarchy (primary right, secondary left)

## Tasks

### Task 1: Verify Backend Endpoints
- [ ] Check if `backend/src/users/` module exists
- [ ] Verify GET /api/users endpoint (with optional filters)
- [ ] Verify POST /api/users endpoint
- [ ] Verify PATCH /api/users/:id endpoint
- [ ] Verify DELETE /api/users/:id endpoint
- [ ] Test endpoints with Postman/curl as ADMIN user
- [ ] If endpoints missing, implement Story 1.4 first

### Task 2: Create API Service Layer
- [ ] Create `frontend/src/services/users.ts`
- [ ] Implement getUsers(filters) function
- [ ] Implement createUser(data) function
- [ ] Implement updateUser(id, data) function
- [ ] Implement deleteUser(id) function
- [ ] Add TypeScript types for CreateUserDto, UpdateUserDto
- [ ] Ensure all API calls use `withCredentials: true`

### Task 3: Create UsersList Component
- [ ] Create `frontend/src/pages/Users/UsersList.tsx`
- [ ] Set up state: users, loading, filters (role, search), snackbar
- [ ] Implement useEffect to fetch users on mount
- [ ] Implement role filter dropdown (ALL, ADMIN, DOCTOR, BIOLOGIST, SECRETARY)
- [ ] Implement search TextField with debounce (500ms)
- [ ] Render Material-UI Table with columns: Name, Email, Role, Actions
- [ ] Add "Ajouter Utilisateur" button (opens create dialog)
- [ ] Add Edit IconButton for each user
- [ ] Add Delete IconButton for each user
- [ ] Implement loading state (CircularProgress)
- [ ] Implement empty state message
- [ ] Style with Material-UI theme colors and spacing

### Task 4: Create UserDialog Component
- [ ] Create `frontend/src/pages/Users/components/UserDialog.tsx`
- [ ] Accept props: open, onClose, onSave, initialData (for edit mode)
- [ ] Create form state: name, email, password, role
- [ ] Add TextField for name (required)
- [ ] Add TextField for email (required, email validation)
- [ ] Add TextField for password (required for create, optional for edit)
- [ ] Add Select for role (ADMIN, DOCTOR, BIOLOGIST, SECRETARY)
- [ ] Implement form validation
- [ ] Add autoFocus to first field (UX15)
- [ ] Implement save handler (create vs update logic)
- [ ] Show CircularProgress during save
- [ ] Close dialog on success
- [ ] Handle errors with Snackbar

### Task 5: Create DeleteUserDialog Component
- [ ] Create `frontend/src/pages/Users/components/DeleteUserDialog.tsx`
- [ ] Accept props: open, onClose, onConfirm, userName
- [ ] Display confirmation message: "Êtes-vous sûr de vouloir supprimer {userName}?"
- [ ] Add warning text about irreversible action
- [ ] Add Cancel button (secondary, left)
- [ ] Add Delete button (error color, right)
- [ ] Implement delete handler with loading state
- [ ] Close dialog on success/cancel
- [ ] Handle errors with Snackbar

### Task 6: Implement Snackbar Notifications
- [ ] Add Snackbar state (open, message, severity)
- [ ] Show success message: "Utilisateur créé avec succès"
- [ ] Show success message: "Utilisateur modifié avec succès"
- [ ] Show success message: "Utilisateur supprimé avec succès"
- [ ] Show error messages for API failures
- [ ] Auto-hide after 6000ms
- [ ] Style with theme colors

### Task 7: Add Route and Navigation
- [ ] Add /users route to App.tsx (ProtectedRoute with ADMIN role)
- [ ] Add "Gestion des utilisateurs" link to Sidebar (ADMIN only)
- [ ] Test route protection (redirect non-ADMIN users)

### Task 8: Test User Management Workflow
- [ ] Test as ADMIN: view users list
- [ ] Test role filter (select each role)
- [ ] Test search by name
- [ ] Test search by email
- [ ] Test create new user (all fields valid)
- [ ] Test create validation errors
- [ ] Test edit existing user
- [ ] Test delete user (with confirmation)
- [ ] Test delete cancellation
- [ ] Test loading states during API calls
- [ ] Test empty state when no users
- [ ] Test Snackbar notifications for all actions
- [ ] Test as non-ADMIN user (should be blocked)

## Definition of Done

- [ ] All backend endpoints verified or implemented
- [ ] Users list page displays all users in Material-UI Table
- [ ] Role filter dropdown works correctly
- [ ] Search TextField with debounce (500ms) filters users
- [ ] Create user dialog validates all fields
- [ ] Edit user dialog pre-fills existing data
- [ ] Delete confirmation dialog prevents accidental deletion
- [ ] All actions show appropriate Snackbar feedback
- [ ] Loading states shown during API calls
- [ ] Empty state message displayed when no users
- [ ] Button hierarchy follows UX11 (primary right, secondary left)
- [ ] AutoFocus on first field in dialogs (UX15)
- [ ] Route protected with ADMIN role requirement
- [ ] Navigation link visible only to ADMIN users
- [ ] All acceptance criteria met
- [ ] Code reviewed and merged

## Notes

- This story depends on Story 1.4 (Backend User Management CRUD). Verify backend endpoints exist before starting frontend work.
- Use the same Material-UI patterns as PatientsList and AppointmentsList for consistency
- Password field should be required for create, optional for edit (to allow updating other fields without changing password)
- Consider adding password strength indicator in future iterations
- ADMIN should not be able to delete themselves (add validation)
