import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: {
      key: fs.readFileSync("C:\\Users\\adeni\\Documents\\Cert\\key.pem"),
      cert: fs.readFileSync("C:\\Users\\adeni\\Documents\\Cert\\cert.pem"),
    },
  },
});
