import * as React from "react";
import {
    Container,
    CssBaseline,
    ThemeProvider,
    Typography,
    Box,
} from "@mui/material";
import theme from "./theme";
import IncidentForm from "./components/IncidentForm";
import IncidentList from "./components/IncidentList";
import IncidentDetails from "./components/IncidentDetails";

export default function App() {
    const [detailsKey, setDetailsKey] = React.useState<string | null>(null);
    const listRef = React.useRef<{ reload?: () => void }>(null);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Incidents
                </Typography>

                <IncidentForm
                    onRefreshList={() => {
                        // You can lift a reload handler via props/ref; for simplicity we let users refresh via button.
                        // This callback is here if you want to wire it later.
                    }}
                />

                <IncidentList onSelect={(k) => setDetailsKey(k)} />

                <IncidentDetails
                    open={!!detailsKey}
                    keyId={detailsKey}
                    onClose={() => setDetailsKey(null)}
                />

                <Box mt={4} textAlign="center" color="text.secondary">
                    <small>
                        Talking to {import.meta.env.VITE_API_BASE || "/api"}
                    </small>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
