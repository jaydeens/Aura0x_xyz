// Buffer polyfill for Solana libraries
// This avoids Vite's externalization by loading via CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.js';
script.onload = () => {
  // @ts-ignore
  window.Buffer = window.buffer.Buffer;
};
document.head.appendChild(script);

export {};
