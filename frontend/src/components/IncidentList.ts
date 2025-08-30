
import * as React from 'react'
import {
  Box, Card, CardContent, Chip, Grid, IconButton, InputAdornment, TextField, Typography, Tooltip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { listIncidents } from '../api/incidents'
import { ListItem } from '../types/incident'

type Props = {
  onSelect?: (key: string) => void
}

export default function IncidentList({ onSelect }: Props) {
  const [items, setItems] = React.useState<ListItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [prefix, setPrefix] = React.useState('')
  const [limit, setLimit] = React.useState(50)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await listIncidents(prefix, limit)
      setItems(data.items || [])
    } finally {
      setLoading(false)
    }
  }, [prefix, limit])

  React.useEffect(() => {
    load()
  }, []) // initial

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TextField
            size="small"
            placeholder="Filter by key prefix…"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            label="Limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Number(e.target.value || 1)))}
            sx={{ width: 100 }}
          />
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={load} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {items.map(({ key, incident }) => (
            <Grid item xs={12} md={6} lg={4} key={key}>
              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', ':hover': { boxShadow: 3 } }}
                onClick={() => onSelect?.(key)}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {incident.title}
                  </Typography>
                  <Chip size="small" label={incident.incident_type} sx={{ mb: 1 }} />
                  {incident.location && (
                    <Typography variant="body2" color="text.secondary">
                      📍 {incident.location}
                    </Typography>
                  )}
                  {incident.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {incident.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!items.length && !loading && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No incidents found.</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}
