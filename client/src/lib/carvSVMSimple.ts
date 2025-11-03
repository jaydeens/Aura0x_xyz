/**
 * CARV SVM Integration Module
 * 
 * Simple SPL Token transfer-based integration for SLP trading
 * Uses raw @solana/web3.js without @solana/spl-token to avoid Buffer dependency
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Configuration
export const CONFIG = {
  programId: new PublicKey('Bjj32BCTb6jvuNh4PF3dCP81cSqBVEts9K5pdxJw9RcA'),
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  usdtMint: new PublicKey('7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF'),
  platformWallet: new PublicKey('HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat'),
  usdtDecimals: 9, // CARV SVM USDT uses 9 decimals, not 6!
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
 * Find associated token address for an owner
 */
export async function findAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [
      owner.toBytes(),
      TOKEN_PROGRAM_ID.toBytes(),
      mint.toBytes(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

/**
 * Create instruction to create associated token account
 */
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: new Uint8Array(0) as any,
  });
}

/**
 * Create instruction to transfer SPL tokens
 */
function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number
): TransactionInstruction {
  const data = new Uint8Array(9);
  data[0] = 3; // Transfer instruction
  
  // Write amount as little-endian 64-bit unsigned integer
  const amountBigInt = BigInt(amount);
  for (let i = 0; i < 8; i++) {
    data[1 + i] = Number((amountBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }
  
  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: data as any,
  });
}

/**
 * Get pool public key from backend
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
 * Initialize the pool token account
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
    
    const poolTokenAccount = await findAssociatedTokenAddress(poolPubkey, CONFIG.usdtMint);
    
    console.log('[Init Pool] Pool Token Account:', poolTokenAccount.toBase58());
    
    const accountInfo = await connection.getAccountInfo(poolTokenAccount);
    if (accountInfo) {
      throw new Error('Pool already initialized');
    }
    
    const transaction = new Transaction();
    
    const createPoolATAIx = createAssociatedTokenAccountInstruction(
      userPublicKey,
      poolTokenAccount,
      poolPubkey,
      CONFIG.usdtMint
    );
    
    transaction.add(createPoolATAIx);
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
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
    
    const decimalsMultiplier = Math.pow(10, CONFIG.usdtDecimals);
    const totalLamports = Math.floor(usdtAmount * decimalsMultiplier);
    const poolAmount = Math.floor(totalLamports * RATES.poolRetention);
    const platformAmount = Math.floor(totalLamports * RATES.platformFee);
    
    console.log('[Buy SLP] Total USDT:', usdtAmount);
    console.log('[Buy SLP] Decimals:', CONFIG.usdtDecimals);
    console.log('[Buy SLP] Total lamports:', totalLamports);
    console.log('[Buy SLP] Pool amount:', poolAmount / decimalsMultiplier, 'USDT');
    console.log('[Buy SLP] Platform amount:', platformAmount / decimalsMultiplier, 'USDT');
    
    const transaction = new Transaction();
    
    const userTokenAccount = await findAssociatedTokenAddress(userPublicKey, CONFIG.usdtMint);
    const poolTokenAccount = await findAssociatedTokenAddress(poolPubkey, CONFIG.usdtMint);
    const platformTokenAccount = await findAssociatedTokenAddress(CONFIG.platformWallet, CONFIG.usdtMint);
    
    // Check if user's token account exists
    const userAccountInfo = await connection.getAccountInfo(userTokenAccount);
    if (!userAccountInfo) {
      const createUserATAIx = createAssociatedTokenAccountInstruction(
        userPublicKey,
        userTokenAccount,
        userPublicKey,
        CONFIG.usdtMint
      );
      transaction.add(createUserATAIx);
    }
    
    // Check if platform's token account exists
    const platformAccountInfo = await connection.getAccountInfo(platformTokenAccount);
    if (!platformAccountInfo) {
      const createPlatformATAIx = createAssociatedTokenAccountInstruction(
        userPublicKey,
        platformTokenAccount,
        CONFIG.platformWallet,
        CONFIG.usdtMint
      );
      transaction.add(createPlatformATAIx);
    }
    
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
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
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
    
    const transaction = Transaction.from(Uint8Array.from(txBytes));
    
    const signed = await userWallet.signTransaction(transaction);
    
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
    const tokenAccount = await findAssociatedTokenAddress(walletPubkey, CONFIG.usdtMint);
    
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
