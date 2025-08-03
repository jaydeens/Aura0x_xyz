import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Emergency fallback - show content immediately if React fails
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const root = document.getElementById("root");
    if (root && root.innerHTML.trim() === '') {
      console.error("❌ React failed to render - showing emergency fallback");
      root.innerHTML = `
        <div style="min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); color: white; font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 800px; margin: 0 auto; text-align: center; padding-top: 100px;">
            <h1 style="font-size: 3rem; font-weight: bold; background: linear-gradient(45deg, #8B5CF6, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 30px;">
              BUILD YOUR AURA
            </h1>
            <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9;">
              The app that's breaking the internet. Complete challenges, flex your wins, and build legendary status that everyone talks about.
            </p>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
              <button onclick="window.location.reload()" style="background: linear-gradient(45deg, #8B5CF6, #EC4899); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; font-weight: bold;">
                GET AURA NOW
              </button>
              <button onclick="window.location='/leaderboard'" style="background: transparent; color: white; border: 2px solid #8B5CF6; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; font-weight: bold;">
                SEE THE HYPE
              </button>
            </div>
            <div style="margin-top: 60px; display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
              <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 15px; border: 1px solid rgba(139, 92, 246, 0.3); width: 120px;">
                <div style="font-size: 2rem; font-weight: bold; color: #8B5CF6;">60</div>
                <div style="font-size: 0.9rem; opacity: 0.7;">LEGENDS</div>
              </div>
              <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 15px; border: 1px solid rgba(139, 92, 246, 0.3); width: 120px;">
                <div style="font-size: 2rem; font-weight: bold; color: #EC4899;">AURA</div>
                <div style="font-size: 0.9rem; opacity: 0.7;">STATUS</div>
              </div>
              <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 15px; border: 1px solid rgba(139, 92, 246, 0.3); width: 120px;">
                <div style="font-size: 2rem; font-weight: bold; color: #10B981;">0</div>
                <div style="font-size: 0.9rem; opacity: 0.7;">LIVE NOW</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }, 2000);
});

// Add error boundary and console logging for debugging deployment issues
console.log("🚀 Aura app starting - EMERGENCY FIX...");

// Global error handler for unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  // Specifically handle wallet-related errors
  if (event.reason?.code === 4001 || event.reason?.message?.includes('User rejected')) {
    console.log('🔐 User rejected wallet connection - this is normal');
    event.preventDefault(); // Prevent the white screen
    return;
  }
  
  // Handle other Ethereum provider errors
  if (event.reason?.message?.includes('ethereum') || event.reason?.message?.includes('MetaMask')) {
    console.log('💼 Wallet provider error - continuing without wallet');
    event.preventDefault();
    return;
  }
  
  event.preventDefault(); // Prevent the white screen for any unhandled rejection
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
      <div style="min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); color: white; font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 800px; margin: 0 auto; text-align: center; padding-top: 100px;">
          <h1 style="font-size: 3rem; font-weight: bold; background: linear-gradient(45deg, #8B5CF6, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 30px;">
            BUILD YOUR AURA
          </h1>
          <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9;">
            The app that's breaking the internet. Complete challenges, flex your wins, and build legendary status that everyone talks about.
          </p>
          <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.location.reload()" style="background: linear-gradient(45deg, #8B5CF6, #EC4899); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; font-weight: bold;">
              GET AURA NOW
            </button>
            <button onclick="window.location='/leaderboard'" style="background: transparent; color: white; border: 2px solid #8B5CF6; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; font-weight: bold;">
              SEE THE HYPE
            </button>
          </div>
          <div style="margin-top: 40px; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 10px; border: 1px solid rgba(255,0,0,0.3);">
            <p style="color: #ff6b6b; font-weight: bold;">React Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p style="opacity: 0.7; font-size: 0.9rem;">Click "GET AURA NOW" to refresh</p>
          </div>
        </div>
      </div>
    `;
  }
}
