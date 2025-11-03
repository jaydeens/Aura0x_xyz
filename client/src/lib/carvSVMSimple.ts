/**
 * CARV SVM Integration Module
 * 
 * Simple SPL Token transfer-based integration for SLP trading
 * Uses raw @solana/web3.js without Anchor
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  createInitializeAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Configuration
export const CONFIG = {
  programId: new PublicKey('Bjj32BCTb6jvuNh4PF3dCP81cSqBVEts9K5pdxJw9RcA'),
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  usdtMint: new PublicKey('7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF'),
  platformWallet: new PublicKey('HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat'),
  poolAuthoritySeed: 'pool-authority',
};

export const RATES = {
  buyRate: 100, // 1 USDT = 100 SLP
  sellRate: 0.007, // 1 SLP = 0.007 USDT
  platformFee: 0.3, // 30% to platform
  poolRetention: 0.7, // 70% to pool
};

/**
 * Get connection to CARV SVM testnet
 */
export function getConnection(): Connection {
  return new Connection(CONFIG.rpcUrl, 'confirmed');
}

/**
 * Get pool public key from backend
 * The pool is controlled by a backend keypair for security
 */
async function getPoolPublicKey(): Promise<PublicKey> {
  const response = await fetch('/api/slp/pool-status');
  if (!response.ok) {
    throw new Error('Failed to get pool status');
  }
  const data = await response.json();
  if (!data.poolPublicKey) {
    throw new Error('Pool public key not available');
  }
  return new PublicKey(data.poolPublicKey);
}

/**
 * Get or create an associated token account
 */
async function getOrCreateATA(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  transaction: Transaction
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(mint, owner);
  
  // Check if account exists
  const accountInfo = await connection.getAccountInfo(ata);
  
  if (!accountInfo) {
    // Create ATA instruction
    const createATAIx = createAssociatedTokenAccountInstruction(
      payer,
      ata,
      owner,
      mint
    );
    transaction.add(createATAIx);
  }
  
  return ata;
}

/**
 * Initialize the pool token account
 * This only needs to be called once to set up the liquidity pool
 * The pool is owned by a backend-controlled keypair
 */
export async function initializePool(
  userWallet: any,
  userPublicKey: PublicKey
): Promise<string> {
  try {
    const connection = getConnection();
    const poolPubkey = await getPoolPublicKey();
    
    console.log('[Init Pool] User:', userPublicKey.toBase58());
    console.log('[Init Pool] Pool:', poolPubkey.toBase58());
    
    // Get the pool's associated token account address
    const poolTokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      poolPubkey
    );
    
    console.log('[Init Pool] Pool Token Account:', poolTokenAccount.toBase58());
    
    // Check if pool token account already exists
    const accountInfo = await connection.getAccountInfo(poolTokenAccount);
    if (accountInfo) {
      throw new Error('Pool already initialized');
    }
    
    // Create transaction
    const transaction = new Transaction();
    
    // Add instruction to create the pool's ATA
    const createPoolATAIx = createAssociatedTokenAccountInstruction(
      userPublicKey, // Payer
      poolTokenAccount, // ATA address
      poolPubkey, // Owner (backend keypair)
      CONFIG.usdtMint // Mint
    );
    
    transaction.add(createPoolATAIx);
    
    // Get recent blockhash and set fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
    // Sign and send
    const signed = await userWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('[Init Pool] Success! Signature:', signature);
    return signature;
  } catch (error: any) {
    console.error('[Init Pool] Error:', error);
    throw new Error(error.message || 'Failed to initialize pool');
  }
}

/**
 * Buy SLP by depositing USDT
 * Transfers 70% to pool, 30% to platform
 */
export async function buySLP(
  userWallet: any,
  userPublicKey: PublicKey,
  usdtAmount: number
): Promise<string> {
  try {
    if (usdtAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    const connection = getConnection();
    const poolPubkey = await getPoolPublicKey();
    
    // Calculate amounts (USDT has 6 decimals)
    const totalLamports = Math.floor(usdtAmount * 1_000_000);
    const poolAmount = Math.floor(totalLamports * RATES.poolRetention);
    const platformAmount = Math.floor(totalLamports * RATES.platformFee);
    
    console.log('[Buy SLP] Total USDT:', usdtAmount);
    console.log('[Buy SLP] Pool amount:', poolAmount / 1_000_000, 'USDT');
    console.log('[Buy SLP] Platform amount:', platformAmount / 1_000_000, 'USDT');
    
    // Create transaction
    const transaction = new Transaction();
    
    // Get all token accounts
    const userTokenAccount = await getOrCreateATA(
      connection,
      userPublicKey,
      CONFIG.usdtMint,
      userPublicKey,
      transaction
    );
    
    const poolTokenAccount = await getAssociatedTokenAddress(
      CONFIG.usdtMint,
      poolPubkey
    );
    
    const platformTokenAccount = await getOrCreateATA(
      connection,
      userPublicKey,
      CONFIG.usdtMint,
      CONFIG.platformWallet,
      transaction
    );
    
    // Transfer to pool (70%)
    const transferToPoolIx = createTransferInstruction(
      userTokenAccount,
      poolTokenAccount,
      userPublicKey,
      poolAmount
    );
    transaction.add(transferToPoolIx);
    
    // Transfer to platform (30%)
    const transferToPlatformIx = createTransferInstruction(
      userTokenAccount,
      platformTokenAccount,
      userPublicKey,
      platformAmount
    );
    transaction.add(transferToPlatformIx);
    
    // Get recent blockhash and set fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
    // Sign and send
    const signed = await userWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('[Buy SLP] Success! Signature:', signature);
    return signature;
  } catch (error: any) {
    console.error('[Buy SLP] Error:', error);
    throw new Error(error.message || 'Failed to buy SLP');
  }
}

/**
 * Sell SLP to receive USDT
 * Transfers USDT from pool to user
 * Note: Backend validates SLP balance and calculates USDT amount server-side for security
 */
export async function sellSLP(
  userWallet: any,
  userPublicKey: PublicKey,
  slpAmount: number
): Promise<string> {
  try {
    if (slpAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    console.log('[Sell SLP] SLP amount:', slpAmount);
    console.log('[Sell SLP] Wallet:', userPublicKey.toBase58());
    
    // Backend will:
    // 1. Validate user has sufficient SLP balance
    // 2. Calculate USDT amount server-side using fixed rate
    // 3. Deduct SLP from user's balance
    // 4. Sign transaction with pool keypair
    const response = await fetch('/api/slp/prepare-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: userPublicKey.toBase58(),
        slpAmount,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to prepare sell transaction');
    }
    
    const { transaction: txBytes, usdtAmount } = await response.json();
    
    console.log('[Sell SLP] Server-calculated USDT amount:', usdtAmount);
    
    const connection = getConnection();
    
    // Deserialize the partially signed transaction from backend
    const transaction = Transaction.from(Uint8Array.from(txBytes));
    
    // User signs the transaction
    const signed = await userWallet.signTransaction(transaction);
    
    // Send the fully signed transaction
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('[Sell SLP] Success! Signature:', signature);
    console.log('[Sell SLP] Received', usdtAmount, 'USDT');
    return signature;
  } catch (error: any) {
    console.error('[Sell SLP] Error:', error);
    throw new Error(error.message || 'Failed to sell SLP');
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
    const response = await fetch('/api/slp/pool-status');
    if (!response.ok) {
      throw new Error('Failed to check pool status');
    }
    return await response.json();
  } catch (error) {
    console.error('[Check Pool] Error:', error);
    return { initialized: false };
  }
}
