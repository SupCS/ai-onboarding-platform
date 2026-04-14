import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

export default function UploadMaterialDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Material</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" fullWidth />

          <TextField
            label="Material Type"
            select
            fullWidth
            defaultValue="document"
          >
            <MenuItem value="document">Document</MenuItem>
            <MenuItem value="video">Video</MenuItem>
          </TextField>

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
          />

          <TextField
            label="Source URL or file placeholder"
            fullWidth
            placeholder="For now we will keep this as a simple placeholder field"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained">
          Save Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}