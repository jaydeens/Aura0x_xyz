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

// USDT contract address on Polygon Mumbai testnet
export const USDT_CONTRACT_ADDRESS = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"; // This is a common testnet USDT address

// Platform wallet address (should be set in environment variables)
export const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";

// USDT ABI (minimal for transfers)
export const USDT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

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
    this.provider = new ethers.JsonRpcProvider(POLYGON_TESTNET.rpcUrl);
  }

  /**
   * Validate wallet address format
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get USDT balance for an address
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, this.provider);
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting USDT balance:", error);
      throw new Error("Failed to get USDT balance");
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

      // For USDT transfers, we need to parse the logs
      const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, this.provider);
      const logs = receipt.logs;
      
      for (const log of logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "Transfer") {
            const decimals = await contract.decimals();
            return {
              isValid: true,
              from: parsedLog.args[0],
              to: parsedLog.args[1],
              amount: ethers.formatUnits(parsedLog.args[2], decimals),
              blockNumber: receipt.blockNumber
            };
          }
        } catch (parseError) {
          // Continue to next log if this one can't be parsed
          continue;
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error("Error verifying transaction:", error);
      return { isValid: false };
    }
  }

  /**
   * Calculate vouch distribution (60% to KOL, 40% to platform)
   */
  calculateVouchDistribution(usdtAmount: number): {
    kolAmount: number;
    platformAmount: number;
    auraPoints: number;
  } {
    const kolAmount = usdtAmount * 0.6;
    const platformAmount = usdtAmount * 0.4;
    const auraPoints = Math.floor(usdtAmount * 10); // 1 USDT = 10 Aura Points

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
   * Estimate portfolio growth (placeholder implementation)
   */
  async getPortfolioGrowth(address: string): Promise<number> {
    try {
      // This would integrate with services like DeBank, Zapper, or Covalent
      // For now, return a random growth percentage
      const growth = (Math.random() - 0.3) * 500; // -30% to +470%
      return Math.round(growth * 100) / 100;
    } catch (error) {
      console.error("Error getting portfolio growth:", error);
      return 0;
    }
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
