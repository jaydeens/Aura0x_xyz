// Utility to suppress wallet extension errors that interfere with app loading
export function suppressWalletErrors() {
  // Override console.error to filter out wallet-related errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ').toLowerCase();
    
    // Skip wallet-related errors
    if (message.includes('metamask') || 
        message.includes('ethereum') || 
        message.includes('provider') ||
        message.includes('user rejected') ||
        message.includes('wallet')) {
      return; // Silently ignore
    }
    
    // Log other errors normally
    originalConsoleError(...args);
  };

  // Prevent wallet extension errors from propagating to window.onerror
  const originalOnerror = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = String(message).toLowerCase();
    
    if (msg.includes('metamask') || 
        msg.includes('ethereum') || 
        msg.includes('provider') ||
        msg.includes('wallet')) {
      return true; // Handled (suppressed)
    }
    
    return originalOnerror ? originalOnerror(message, source, lineno, colno, error) : false;
  };

  // Additional protection for unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    
    if (reason?.code === 4001 || 
        reason?.message?.toLowerCase().includes('user rejected') ||
        reason?.message?.toLowerCase().includes('metamask') ||
        reason?.message?.toLowerCase().includes('ethereum') ||
        reason?.message?.toLowerCase().includes('provider')) {
      event.preventDefault();
      return;
    }
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  });
}