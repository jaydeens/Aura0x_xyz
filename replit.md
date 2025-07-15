# Aura - Web3 Learning & Reputation Platform

## Overview

Aura is a comprehensive Web3 social platform that combines learning, reputation building, and community engagement. Users build their "aura" through daily crypto lessons, 1v1 battles, and a vouching system where community members can stake ETH to vouch for others. The platform integrates Twitter/X authentication, wallet connectivity, and smart contract interactions on Base Sepolia testnet.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom gradient themes
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Multi-modal approach supporting Twitter OAuth 2.0 and wallet-based auth
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with proper error handling and middleware

### Database Schema
Key entities include:
- **Users**: Core user profiles with aura points, streaks, and social connections
- **Lessons**: AI-generated daily learning content with quizzes
- **Battles**: 1v1 competition system with community voting
- **Vouches**: ETH staking system for reputation building
- **Notifications**: Real-time user engagement system

## Key Components

### Authentication System
- **Twitter/X Integration**: OAuth 2.0 flow with PKCE for secure authentication
- **Wallet Authentication**: MetaMask and WalletConnect support for Web3 users
- **Session Management**: Secure session handling with PostgreSQL backing

### Learning Platform
- **AI-Generated Content**: OpenAI integration for creating personalized Web3 lessons
- **Interactive Quizzes**: Knowledge validation with aura point rewards
- **Progress Tracking**: Streak maintenance and learning analytics

### Battle System
- **1v1 Competitions**: Users can challenge each other to knowledge battles
- **Community Voting**: Democratic voting system with reputation stakes
- **Real-time Updates**: Live battle status and voting updates

### Vouching Mechanism
- **Smart Contract Integration**: On-chain vouching with fixed ETH amounts (0.0001 ETH)
- **Reputation Economy**: Aura points distributed based on community vouching
- **Platform Economics**: 30% platform fee, 70% to vouched users

### Web3 Integration
- **Smart Contracts**: Deployed on Base Sepolia testnet
- **Wallet Support**: MetaMask, WalletConnect, and mobile wallet compatibility
- **Transaction Handling**: Ethers.js for blockchain interactions

## Data Flow

1. **User Onboarding**: Twitter OAuth or wallet connection → profile creation → beta access validation
2. **Daily Learning**: AI lesson generation → user completion → quiz validation → aura rewards
3. **Battle Flow**: Challenge creation → opponent acceptance → community voting → winner determination
4. **Vouching Process**: User selection → ETH transaction → smart contract execution → aura distribution
5. **Reputation System**: Activity tracking → aura calculation → leaderboard updates → level progression

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o for lesson and quiz generation
- **Twitter API v2**: OAuth authentication and social features
- **Neon Database**: Serverless PostgreSQL hosting
- **Base Sepolia**: Ethereum L2 testnet for smart contracts

### Development Tools
- **Replit**: Primary development and hosting environment
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling for server-side code

### Third-party Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Ethers.js**: Ethereum blockchain interactions
- **Passport.js**: Authentication strategies

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading via Vite
- **Production**: Autoscale deployment on Replit infrastructure
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Static Assets**: Served via Express with proper caching headers

### Build Process
1. Client-side assets built with Vite
2. Server bundled with ESBuild for Node.js runtime
3. Database migrations applied via Drizzle Kit
4. Environment variables validated at startup

### Security Considerations
- HTTPS enforcement for all production traffic
- Secure session management with HTTP-only cookies
- CORS protection and request validation
- Smart contract security with fixed transaction amounts

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```