import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, proxy /api/* -> http://localhost:3030/*
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:3030",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});
