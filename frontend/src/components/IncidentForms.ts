
import * as React from 'react'
import {
  Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Snackbar, Alert,
} from '@mui/material'
import { Incident, IncidentType } from '../types/incident'
import { createIncident, listIncidents } from '../api/incidents'

type Props = {
  onCreated?: (incident: Incident) => void
  onRefreshList?: () => void
}

const INCIDENT_TYPES: IncidentType[] = ['fire', 'flood', 'earthquake']

export default function IncidentForm({ onCreated, onRefreshList }: Props) {
  const [form, setForm] = React.useState<Incident>({
    title: '',
    incident_type: 'fire',
    description: '',
    location: '',
    image: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [snack, setSnack] = React.useState<{open: boolean, msg: string, sev: 'success' | 'error'}>({open:false,msg:'',sev:'success'})

  const handleChange = (k: keyof Incident) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setSnack({open:true,msg:'Title is required',sev:'error'})
      return
    }
    setSaving(true)
    try {
      const { incident } = await createIncident(form)
      setSnack({open:true,msg:'Incident created',sev:'success'})
      onCreated?.(incident)
      // refresh list after create
      onRefreshList?.()
      // optional: clear form
      setForm((f) => ({ ...f, title: '' }))
    } catch (err: any) {
      setSnack({open:true,msg: err?.message || 'Failed to create incident', sev:'error'})
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Create Incident</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Title"
                value={form.title}
                onChange={handleChange('title')}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Incident Type"
                value={form.incident_type}
                onChange={(e) => setForm((f) => ({ ...f, incident_type: e.target.value as IncidentType }))}
                required
                fullWidth
              >
                {INCIDENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                value={form.description ?? ''}
                onChange={handleChange('description')}
                multiline minRows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                value={form.location ?? ''}
                onChange={handleChange('location')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Image URL"
                value={form.image ?? ''}
                onChange={handleChange('image')}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({...s, open:false}))}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({...s, open:false}))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Card>
  )
}
