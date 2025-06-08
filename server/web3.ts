import { ethers } from "ethers";

// Polygon testnet configuration
export const POLYGON_TESTNET = {
  chainId: 80001,
  name: "Polygon Mumbai",
  rpcUrl: "https://rpc-mumbai.maticvigil.com/",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  blockExplorer: "https://mumbai.polygonscan.com/",
};

// ETH is the native currency, no contract address needed for testnet

// Platform wallet address (should be set in environment variables)
export const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";

// ETH ABI not needed for native transfers

export interface VouchTransaction {
  from: string;
  to: string;
  amount: string;
  platformFee: string;
  transactionHash: string;
  auraPoints: number;
}

export class Web3Service {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize provider as null to avoid connection errors on startup
    this.provider = null as any;
  }

  private initProvider() {
    if (!this.provider) {
      // Use a more reliable RPC endpoint
      this.provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/polygon_mumbai");
    }
    return this.provider;
  }

  /**
   * Validate wallet address format
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get ETH balance for an address
   */
  async getETHBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting ETH balance:", error);
      return "0";
    }
  }

  /**
   * Verify a transaction hash on Polygon
   */
  async verifyTransaction(transactionHash: string): Promise<{
    isValid: boolean;
    from?: string;
    to?: string;
    amount?: string;
    blockNumber?: number;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return { isValid: false };
      }

      // Check if transaction was successful
      if (receipt.status !== 1) {
        return { isValid: false };
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(transactionHash);
      
      if (!tx) {
        return { isValid: false };
      }

      // For ETH transfers, we can get the amount directly from the transaction
      return {
        isValid: true,
        from: tx.from,
        to: tx.to,
        amount: ethers.formatEther(tx.value),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Error verifying transaction:", error);
      return { isValid: false };
    }
  }

  /**
   * Calculate vouch distribution (60% to KOL, 40% to platform)
   */
  calculateVouchDistribution(ethAmount: number): {
    kolAmount: number;
    platformAmount: number;
    auraPoints: number;
  } {
    const kolAmount = ethAmount * 0.6;
    const platformAmount = ethAmount * 0.4;
    const auraPoints = Math.floor(ethAmount * 1000); // 1 ETH = 1000 Aura Points

    return {
      kolAmount,
      platformAmount,
      auraPoints
    };
  }

  /**
   * Apply streak multiplier to aura points
   */
  applyStreakMultiplier(baseAuraPoints: number, streakDays: number): {
    finalAuraPoints: number;
    multiplier: number;
    level: string;
  } {
    let multiplier = 1.0; // Levels don't affect aura multiplier
    let level = "Clout Chaser";

    if (streakDays >= 30) {
      multiplier = 2.0;
      level = "Aura Vader";
    } else if (streakDays >= 15) {
      multiplier = 1.5;
      level = "Grinder";
    } else if (streakDays >= 5) {
      multiplier = 1.25;
      level = "Attention Seeker";
    }

    return {
      finalAuraPoints: Math.floor(baseAuraPoints * multiplier),
      multiplier,
      level
    };
  }

  /**
   * Get wallet age in days (estimate based on first transaction)
   */
  async getWalletAge(address: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you'd want to use a service like Moralis or Alchemy
      // to get the first transaction timestamp
      const currentBlock = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(currentBlock);
      
      // For now, return a random age between 100-1000 days
      // This should be replaced with actual wallet analysis
      return Math.floor(Math.random() * 900) + 100;
    } catch (error) {
      console.error("Error getting wallet age:", error);
      return 0;
    }
  }

  /**
   * Portfolio growth feature removed - returns 0
   */
  async getPortfolioGrowth(address: string): Promise<number> {
    return 0;
  }

  /**
   * Generate wallet connect configuration
   */
  getWalletConnectConfig() {
    return {
      chains: [POLYGON_TESTNET],
      defaultChain: POLYGON_TESTNET,
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || "",
      appName: "Aura Battle Platform",
      appDescription: "Web3 Aura Battle Platform for Web3 Users",
    };
  }
}

export const web3Service = new Web3Service();
