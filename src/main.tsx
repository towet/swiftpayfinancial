import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/api"; // Initialize API configuration with hardcoded Render backend URL

createRoot(document.getElementById("root")!).render(<App />);
