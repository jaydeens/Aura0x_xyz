import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error boundary and console logging for debugging deployment issues - FORCE REBUILD
console.log("🚀 Aura app starting - DEPLOYMENT FIX...");

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
    
    // Add React error boundary to catch render errors
    root.render(
      <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
        <App />
      </div>
    );
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    rootElement.innerHTML = `
      <div style="color: white; background: #1a1a2e; padding: 20px; font-family: Arial; min-height: 100vh;">
        <h1 style="color: #8B5CF6;">Aura - Creators and Streamers Social Network</h1>
        <p>App loading error. Check console for details.</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
  }
}
