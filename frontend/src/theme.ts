import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    shape: { borderRadius: 12 },
    components: {
        MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
    },
});

export default theme;
