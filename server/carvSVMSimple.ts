/**
 * CARV SVM Server-side Module
 * Handles transactions that require pool keypair signing
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  Keypair,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export const CONFIG = {
  programId: new PublicKey('Bjj32BCTb6jvuNh4PF3dCP81cSqBVEts9K5pdxJw9RcA'),
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  usdtMint: new PublicKey('7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF'),
  platformWallet: new PublicKey('HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat'),
  usdtDecimals: 9, // CARV SVM USDT uses 9 decimals, not 6!
};

export function getConnection(): Connection {
  return new Connection(CONFIG.rpcUrl, 'confirmed');
}

/**
 * Load pool keypair from environment variable
 * CRITICAL: This keypair is NEVER sent to the frontend
 */
function getPoolKeypair(): Keypair {
  const secret = process.env.POOL_TOKEN_ACCOUNT_KEYPAIR;
  if (!secret) {
    throw new Error('POOL_TOKEN_ACCOUNT_KEYPAIR environment variable not set');
  }
  
  try {
    // Decode from base64
    const secretKey = Buffer.from(secret, 'base64');
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error('Invalid POOL_TOKEN_ACCOUNT_KEYPAIR format');
  }
}

/**
 * Get USDT balance for a wallet
 */
export async function getUSDTBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      walletPubkey
    );
    
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return balance.value.uiAmount || 0;
  } catch (error) {
    console.error('[Get Balance] Error:', error);
    return 0;
  }
}

/**
 * Check if pool is initialized
 */
export async function checkPoolStatus(): Promise<{ initialized: boolean; poolTokenAccount?: string; poolBalance?: number }> {
  try {
    const connection = getConnection();
    const poolKeypair = getPoolKeypair();
    
    const poolTokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      poolKeypair.publicKey
    );
    
    const accountInfo = await connection.getAccountInfo(poolTokenAccount);
    
    let poolBalance = 0;
    if (accountInfo) {
      try {
        const balance = await connection.getTokenAccountBalance(poolTokenAccount);
        poolBalance = balance.value.uiAmount || 0;
      } catch (e) {
        console.error('[Check Pool] Error getting balance:', e);
      }
    }
    
    return {
      initialized: accountInfo !== null,
      poolTokenAccount: poolTokenAccount.toBase58(),
      poolBalance,
    };
  } catch (error) {
    console.error('[Check Pool] Error:', error);
    return { initialized: false };
  }
}

/**
 * Prepare sell transaction
 * Creates and signs a transaction that transfers USDT from pool to user
 * Returns a partially-signed transaction for the user to complete
 * 
 * IMPORTANT: This function MUST be called only after:
 * 1. Validating user has sufficient SLP balance off-chain
 * 2. Calculating USDT amount server-side using fixed rate
 * 3. Deducting SLP from user's off-chain balance
 */
export async function prepareSellTransaction(
  userWalletAddress: string,
  slpAmount: number
): Promise<{ transaction: number[]; usdtAmount: number }> {
  try {
    const connection = getConnection();
    const poolKeypair = getPoolKeypair();
    const userPubkey = new PublicKey(userWalletAddress);
    
    // SECURITY: Calculate USDT amount server-side using hardcoded rate
    // Never trust client-provided amounts!
    const SELL_RATE = 0.007; // 1 SLP = 0.007 USDT
    const usdtAmount = slpAmount * SELL_RATE;
    const decimalsMultiplier = Math.pow(10, CONFIG.usdtDecimals);
    const usdtLamports = Math.floor(usdtAmount * decimalsMultiplier);
    
    if (slpAmount <= 0) {
      throw new Error('Invalid SLP amount');
    }
    
    if (usdtLamports <= 0) {
      throw new Error('USDT amount too small');
    }
    
    console.log('[Prepare Sell] User:', userWalletAddress);
    console.log('[Prepare Sell] SLP Amount:', slpAmount);
    console.log('[Prepare Sell] USDT Amount (server-calculated):', usdtAmount);
    console.log('[Prepare Sell] Decimals:', CONFIG.usdtDecimals);
    console.log('[Prepare Sell] USDT Lamports:', usdtLamports);
    console.log('[Prepare Sell] Pool:', poolKeypair.publicKey.toBase58());
    
    // Get token accounts
    const poolTokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      poolKeypair.publicKey
    );
    
    const userTokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      userPubkey
    );
    
    // Check pool balance
    const poolBalance = await connection.getTokenAccountBalance(poolTokenAccount);
    const poolLamports = poolBalance.value.amount;
    
    console.log('[Prepare Sell] Pool Balance:', poolBalance.value.uiAmount, 'USDT');
    
    if (BigInt(poolLamports) < BigInt(usdtLamports)) {
      throw new Error(`Insufficient pool balance. Pool has ${poolBalance.value.uiAmount} USDT, need ${usdtAmount} USDT`);
    }
    
    // Check if user's token account exists
    const userAccountInfo = await connection.getAccountInfo(userTokenAccount);
    
    const transaction = new Transaction();
    
    // Create user's ATA if it doesn't exist
    if (!userAccountInfo) {
      console.log('[Prepare Sell] Creating user ATA');
      const createATAIx = createAssociatedTokenAccountInstruction(
        userPubkey, // Payer (user pays for account creation)
        userTokenAccount,
        userPubkey, // Owner
        CONFIG.usdtMint
      );
      transaction.add(createATAIx);
    }
    
    // Transfer USDT from pool to user
    const transferIx = createTransferInstruction(
      poolTokenAccount, // Source (pool)
      userTokenAccount, // Destination (user)
      poolKeypair.publicKey, // Owner of source (pool keypair)
      usdtLamports
    );
    transaction.add(transferIx);
    
    // Get recent blockhash and set fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey; // User pays the transaction fee
    
    // CRITICAL: Pool keypair signs the transaction server-side
    // This allows the transfer from pool to user
    transaction.partialSign(poolKeypair);
    
    console.log('[Prepare Sell] Transaction partially signed by pool');
    
    // Serialize and return to frontend for user signature
    const serialized = transaction.serialize({
      requireAllSignatures: false, // Allow partial signatures
      verifySignatures: false,
    });
    
    return {
      transaction: Array.from(serialized),
      usdtAmount, // Return server-calculated amount for verification
    };
  } catch (error: any) {
    console.error('[Prepare Sell] Error:', error);
    throw error;
  }
}
