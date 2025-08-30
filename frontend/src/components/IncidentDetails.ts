
import * as React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Box,
} from '@mui/material'
import { getIncident } from '../api/incidents'
import { Incident } from '../types/incident'

type Props = {
  open: boolean
  keyId: string | null
  onClose: () => void
}

export default function IncidentDetails({ open, keyId, onClose }: Props) {
  const [data, setData] = React.useState<Incident | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!keyId) return
      setLoading(true)
      try {
        const inc = await getIncident(keyId)
        if (mounted) setData(inc)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [keyId])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Incident details</DialogTitle>
      <DialogContent dividers>
        {loading && <Typography>Loading…</Typography>}
        {!loading && data && (
          <>
            <Typography variant="h6" gutterBottom>{data.title}</Typography>
            <Chip size="small" label={data.incident_type} />
            {data.location && (
              <Typography variant="body2" sx={{ mt: 1 }}>📍 {data.location}</Typography>
            )}
            {data.image && (
              <Box mt={2}>
                <img src={data.image} alt={data.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
              </Box>
            )}
            {data.description && (
              <Typography sx={{ mt: 2 }}>{data.description}</Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
