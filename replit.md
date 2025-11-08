# Dreamz - AI-Powered Web3 Social Platform

## Overview

Dreamz is an AI-powered Web3 social platform focused on learning, reputation building, and community engagement with an AI-crypto aesthetic. Users earn "Dreamz Points" through daily crypto lessons, 1v1 protocol battles, and a vouching system where community members stake USDC to vouch for others. The platform integrates Twitter/X authentication and Solana wallet connectivity (Phantom and Backpack) for CARV SVM Chain interactions. Dreamz aims to foster a vibrant community while enabling users to learn about and participate in the Web3 space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design Aesthetic**: AI-crypto theme with blue/cyan color scheme and asymmetric layouts.
- **UI Components**: Radix UI primitives styled with shadcn/ui and Tailwind CSS.
- **Navigation**: Collapsible left sidebar with overlay behavior and smooth animations.
- **Loading Screens**: Hexagonal spinners with circuit board and neural network themes.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Wouter for routing, TanStack Query for server state.
- **Backend**: Express.js, TypeScript, PostgreSQL with Drizzle ORM.
- **Authentication**: Twitter OAuth 2.0 and Solana wallet authentication (Phantom and Backpack for CARV SVM Chain).
- **AI Integration**: OpenAI API for generating daily Web3 lessons and quizzes.
- **Smart Contracts**: Currently on Base Mainnet, migrating to CARV SVM Chain.
- **Security**: Steeze Security System for backend-controlled transactions, off-chain balance management, blockchain event monitoring, and access control.

### Feature Specifications
- **Learning Platform**: AI-generated lessons, interactive quizzes, progress tracking, and streak system.
- **Battle System**: 1v1 knowledge battles with community voting and real-time updates.
- **Vouching Mechanism**: On-chain vouching with variable USDC amounts (1-100 USDC), reputation-based Dreamz Points distribution (1 USDC = 10 APs), and platform fees.
- **Web3 Integration**: Supports Solana wallets (Phantom and Backpack) for CARV SVM Chain, using Solana Web3.js for blockchain interactions.

### System Design Choices
- **Database**: PostgreSQL with Drizzle ORM for user profiles, lessons, battles, vouches, and notifications.
- **Data Flow**: Structured processes for user onboarding, daily learning, battle initiation, vouching, and reputation management.
- **Deployment**: Vite for client-side, ESBuild for server-side, Neon for PostgreSQL, and Replit for hosting.

## External Dependencies

- **OpenAI API**: For AI-generated lesson and quiz content.
- **Twitter API v2**: For OAuth authentication and social features.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Base Mainnet**: Current blockchain for smart contract deployment.
- **CARV SVM Chain Testnet**: Target Solana-based blockchain (RPC: `https://rpc.testnet.carv.io/rpc`).
- **Radix UI**: For accessible UI components.
- **TanStack Query**: For server state management.
- **Ethers.js**: For Ethereum blockchain interactions.
- **Passport.js**: For authentication strategies.

## Recent Updates

### November 8, 2025 - Removed EVM/MetaMask Integration
- **Solana-Only Platform**: Removed all Ethereum/MetaMask wallet integration from authentication flow
- **WalletConnect Component Cleanup**: 
  - Removed MetaMask/Ethereum wallet buttons from desktop and mobile login UI
  - Removed all Ethereum-specific connection functions (connectWallet, connectMobileWallet, fetchBalance)
  - Removed window.ethereum auto-detection and auto-authentication logic
  - Updated explorer links from Polygonscan to CARV SVM Explorer
  - Removed Polygon balance fetching functionality
- **Settings Page Update**: 
  - Removed Ethereum wallet fallback from wallet connection handler
  - Updated to Solana-only wallet connection (Phantom and Backpack)
  - Updated error messages to specify CARV SVM wallet requirements
- **Platform Focus**: Platform now exclusively uses Solana wallets (Phantom and Backpack) for CARV SVM Chain
- **Consistent Messaging**: All wallet-related UI now clearly indicates Solana/CARV SVM Chain requirements

### October 30, 2025 - X (Twitter) API Integration Update
- **New X Developer App**: Migrated from old Aura configuration to new Dreamz X Developer App credentials
- **Dynamic Redirect URIs**: Updated OAuth 2.0 flow to use request-based host detection instead of hardcoded aura0x.xyz URLs
- **Secure Credentials**: All API keys stored in Replit Secrets (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET)
- **Improved Reliability**: Implemented smart fallback chain (request host → REPLIT_DOMAINS → localhost) with comprehensive logging
- **OAuth 2.0 Compliance**: Maintained PKCE flow security with consistent redirect URIs across initiation and callback flows

### November 3, 2025 - CARV SVM SLP Trading Integration
- **Simplified Architecture**: Replaced buggy Anchor contract with pure SPL Token transfers
- **Client Module** (`client/src/lib/carvSVMSimple.ts`): Raw @solana/web3.js implementation for buy/sell/init operations
  - **CRITICAL FIX**: CARV SVM USDT uses 9 decimals (not 6!) - amounts multiplied by 1e9 before on-chain transfer
  - Removed `@solana/spl-token` dependency to avoid Browser Buffer compatibility issues
  - Manual SPL Token instruction construction using Uint8Array (browser-safe)
- **Server Module** (`server/carvSVMSimple.ts`): Backend keypair signing for secure pool management
- **Security Model**: SLP is completely OFF-CHAIN (database-only), USDT transfers are ON-CHAIN
  - Buy: User sends USDT on-chain (70% pool, 30% platform) → receives off-chain SLP in database
  - Sell: User's off-chain SLP validated/deducted → backend signs USDT transfer from pool to user
  - Pool keypair stored in `POOL_TOKEN_ACCOUNT_KEYPAIR` secret, never exposed to frontend
  - Server calculates all amounts using hardcoded rates (buy: 100 SLP/USDT, sell: 0.007 USDT/SLP)
  - Authentication required, SLP balance checked before every sell operation
- **Transaction Flow**:
  1. initializePool(): Creates pool's associated token account (one-time)
  2. buySLP(): Pure client-side SPL transfers, no backend signing needed
  3. Backend records transaction and updates user's purchasedSteeze balance
  4. sellSLP(): Backend validates SLP, deducts from database, signs partial transaction, user completes
- **Database Integration**: 
  - Updated `/api/potions/purchase` endpoint to handle CARV SVM transactions (txHash, usdtAmount, potionsAmount)
  - Fixed `updateUserPotionsBalance()` to increment balance instead of replacing it
  - Transaction history recorded in `potionsTransactions` table with CARV SVM signatures

### October 26, 2025 - Database Setup & Dreamz Rebrand
- **Fresh PostgreSQL Database**: Created all 11 tables with proper schema (users, battles, vouches, potionsTransactions, dreamzLevels, lessons, userLessons, battleVotes, notifications, sessions, walletWhitelist)
- **Dreamz Levels**: Populated 5-tier progression system (Genesis Node → Neural Master) with multipliers
- **Complete Rebrand**: Updated entire codebase from "Aura" to "Dreamz" terminology (API endpoints, database columns, social media references, frontend components)
- **Browser Branding**: Updated page title, meta tags, theme colors, and favicon to Dreamz AI-crypto aesthetic