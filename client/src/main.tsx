import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./polyfills";

createRoot(document.getElementById("root")!).render(<App />);
