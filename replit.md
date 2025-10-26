# Dreamz - AI-Powered Web3 Social Platform

## Overview

Dreamz is an AI-powered Web3 social platform focused on learning, reputation building, and community engagement with an AI-crypto aesthetic. Users earn "Dreamz Points" through daily crypto lessons, 1v1 protocol battles, and a vouching system where community members stake USDC to vouch for others. The platform integrates Twitter/X authentication and multi-chain wallet connectivity (Solana + Ethereum), with future plans for CARV SVM Chain integration. Dreamz aims to foster a vibrant community while enabling users to learn about and participate in the Web3 space.

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
- **Authentication**: Twitter OAuth 2.0 and multi-chain wallet (MetaMask, WalletConnect, Phantom, Backpack).
- **AI Integration**: OpenAI API for generating daily Web3 lessons and quizzes.
- **Smart Contracts**: Currently on Base Mainnet, migrating to CARV SVM Chain.
- **Security**: Steeze Security System for backend-controlled transactions, off-chain balance management, blockchain event monitoring, and access control.

### Feature Specifications
- **Learning Platform**: AI-generated lessons, interactive quizzes, progress tracking, and streak system.
- **Battle System**: 1v1 knowledge battles with community voting and real-time updates.
- **Vouching Mechanism**: On-chain vouching with variable USDC amounts (1-100 USDC), reputation-based Dreamz Points distribution (1 USDC = 10 APs), and platform fees.
- **Web3 Integration**: Supports various Solana and Ethereum wallets, Ethers.js for Ethereum interactions, and Solana Web3.js for SVM.

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