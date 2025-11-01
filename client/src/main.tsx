import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Buffer } from "buffer";

// Polyfill Buffer for Solana libraries
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
