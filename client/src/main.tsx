import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error boundary and console logging for debugging deployment issues
console.log("🚀 Aura app starting...");

// Global error handler for unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the white screen
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = '<div style="color: white; background: black; padding: 20px; font-family: Arial;">Error: Root element not found. Please check the HTML file.</div>';
} else {
  try {
    console.log("✅ Root element found, rendering app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    rootElement.innerHTML = '<div style="color: white; background: black; padding: 20px; font-family: Arial;">Error rendering app. Check console for details.</div>';
  }
}
