# Base Mainnet Deployment Guide

## Contract Addresses (Base Mainnet) - DEPLOYED ✅

### Vouching Contract
- **Address**: `0x8e6e64396717F69271c7994f90AFeC621C237315`
- **Network**: Base Mainnet (Chain ID: 8453)
- **Token**: USDC (USD Coin)
- **Vouching Range**: 1-100 USDC (variable amounts)
- **Aura Points**: 1 USDC = 10 APs (max 1,000 APs per vouch)

### Steeze Purchase/Redeem Contract  
- **Address**: `0xf209E955Ad3711EE983627fb52A32615455d8cC3`
- **Network**: Base Mainnet (Chain ID: 8453)
- **Token**: USDC (USD Coin)
- **Purchase Rate**: 1 STEEZE = 0.1 USDC (10 STEEZE per USDC)
- **Redeem Rate**: 1 STEEZE = 0.07 USDC

## Overview
This guide covers the deployment of the Aura platform from Base Sepolia testnet to Base Mainnet for production use. 

**MAJOR UPDATE**: Platform has been migrated from ETH to USDC for all transactions to provide better price stability.

## Prerequisites
- Wallet with sufficient ETH for Base Mainnet contract deployment (~0.05-0.1 ETH)
- Base Mainnet RPC access (free via public RPCs)
- Updated environment variables for production

## Environment Configuration

The platform now automatically switches between networks based on `NODE_ENV`:
- **Development** (`NODE_ENV=development`): Uses Base Sepolia testnet
- **Production** (`NODE_ENV=production`): Uses Base Mainnet

### Required Environment Variables

Add these secrets using the Replit secrets manager:

```
# Base Mainnet Contract Addresses (deploy contracts first)
VOUCHING_CONTRACT_ADDRESS_MAINNET=<address_after_deployment>
STEEZE_CONTRACT_ADDRESS_MAINNET=<address_after_deployment>

# Platform wallet for receiving fees
PLATFORM_WALLET_ADDRESS=<your_platform_wallet_address>
```

## Smart Contract Deployment

### 1. Deploy Vouching Contract to Base Mainnet

```solidity
// VouchingContract.sol is ready for deployment
// Platform wallet: 0x1c11262B204EE2d0146315A05b4cf42CA61D33e4 (hardcoded)
// Fixed vouching amount: 0.0001 ETH
// Platform fee: 30%
```

**Deployment Steps:**
1. Use Remix IDE or Hardhat for deployment
2. Deploy to Base Mainnet (Chain ID: 8453)
3. RPC URL: https://mainnet.base.org
4. Verify contract on BaseScan: https://basescan.org

### 2. Deploy Steeze Contract to Base Mainnet

The Steeze contract handles token purchases with ETH. Deploy with appropriate buy/sell prices.

## Network Configuration Updates

### Backend Changes ✅
- Added `BASE_MAINNET` network configuration
- Environment-based network switching
- Updated RPC providers to use `CURRENT_NETWORK`
- Contract addresses now environment-aware

### Frontend Changes ✅
- Updated `WalletConnect.tsx` for Base Mainnet support
- Environment-based chain switching (0x2105 for mainnet)
- Auto-network switching for users

## Deployment Checklist

### Pre-Deployment
- [ ] Deploy VouchingContract to Base Mainnet
- [ ] Deploy SteezeContract to Base Mainnet  
- [ ] Update VOUCHING_CONTRACT_ADDRESS_MAINNET secret
- [ ] Update STEEZE_CONTRACT_ADDRESS_MAINNET secret
- [ ] Set PLATFORM_WALLET_ADDRESS secret
- [ ] Verify contracts on BaseScan

### Post-Deployment
- [ ] Test wallet connection on mainnet
- [ ] Test vouching functionality with small amounts
- [ ] Test Steeze purchases
- [ ] Verify transaction confirmations
- [ ] Monitor gas costs and optimization

### Production Validation
- [ ] Verify all transactions on BaseScan
- [ ] Test cross-component cache invalidation
- [ ] Validate aura point distribution
- [ ] Monitor platform fee collection
- [ ] Test profile image updates across all components

## Base Mainnet vs Sepolia

| Feature | Base Sepolia (Dev) | Base Mainnet (Prod) |
|---------|-------------------|---------------------|
| Chain ID | 84532 (0x14A34) | 8453 (0x2105) |
| RPC URL | https://sepolia.base.org | https://mainnet.base.org |
| Explorer | sepolia-explorer.base.org | basescan.org |
| ETH Cost | Free (testnet) | Real ETH required |
| Network Switching | Auto-development | Auto-production |

## Security Considerations

### Smart Contract Security
- Vouching amount fixed at 0.0001 ETH (prevents manipulation)
- Platform fee hardcoded at 30%
- Direct ETH transfers (70% to user, 30% to platform)
- No admin functions for fund withdrawal

### Platform Security
- Environment-based configuration prevents wrong network usage
- Contract addresses validated before transactions
- All transactions verified on-chain before crediting aura

## Monitoring & Maintenance

### Key Metrics to Monitor
- Total vouching volume
- Platform fee collection
- Transaction success rates
- Gas cost optimization opportunities
- User adoption on mainnet

### Error Handling
- Network switching failures gracefully handled
- Contract interaction errors logged
- Fallback for RPC issues
- Transaction verification with retries

## Rollback Plan

If issues arise on mainnet:
1. Environment variable can instantly switch back to testnet
2. User data preserved (database unchanged)
3. Contract interactions pause until resolved
4. Frontend gracefully handles network unavailability

## Support Resources

- **Base Documentation**: https://docs.base.org
- **BaseScan Explorer**: https://basescan.org
- **Base RPC Status**: https://status.base.org
- **Community Support**: Base Discord

## Notes

- The platform maintains backward compatibility with testnet for development
- Users will be automatically prompted to switch to Base Mainnet
- All existing features work identically on mainnet
- Aura points and user data carry over (not contract-dependent)