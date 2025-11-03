import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';

export const CARV_SVM_CONFIG = {
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  contractAddress: 'Bjj32BCTb6jvuNh4PF3dCP81cSqBVEts9K5pdxJw9RcA',
  usdtTokenAddress: '7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF',
  platformWallet: 'HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat',
};

export const SLP_EXCHANGE_RATES = {
  buyRate: 100,
  sellRate: 0.007,
  platformFee: 0.3,
  liquidityRetention: 0.7,
};

export function getCarvConnection(): Connection {
  return new Connection(CARV_SVM_CONFIG.rpcUrl, 'confirmed');
}

export async function getUSDTBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getCarvConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
    
    const tokenAccount = await getAssociatedTokenAddress(
      usdtMint,
      walletPubkey
    );
    
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    if (!balance.value || !balance.value.uiAmount) {
      return 0;
    }
    
    return balance.value.uiAmount;
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    return 0;
  }
}

// Create instruction data for buy transaction (uses Buffer - backend only)
export function createBuyInstructionData(usdtAmount: number): { data: number[], amountLamports: number } {
  const amountLamports = Math.floor(usdtAmount * 1_000_000);
  
  // Calculate Anchor instruction discriminator for "buySlp"
  const discriminator = createHash('sha256')
    .update('global:buySlp')
    .digest()
    .slice(0, 8);
  
  const instructionData = Buffer.alloc(16); // 8 bytes discriminator + 8 bytes amount
  discriminator.copy(instructionData, 0);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 8);
  
  return {
    data: Array.from(instructionData),
    amountLamports
  };
}

// Create instruction data for sell transaction (uses Buffer - backend only)
export function createSellInstructionData(slpAmount: number): { data: number[], slpAmountRaw: number } {
  const slpAmountRaw = Math.floor(slpAmount);
  
  // Calculate Anchor instruction discriminator for "sellSlp"
  const discriminator = createHash('sha256')
    .update('global:sellSlp')
    .digest()
    .slice(0, 8);
  
  const instructionData = Buffer.alloc(16); // 8 bytes discriminator + 8 bytes amount
  discriminator.copy(instructionData, 0);
  instructionData.writeBigUInt64LE(BigInt(slpAmountRaw), 8);
  
  return {
    data: Array.from(instructionData),
    slpAmountRaw
  };
}

// Serialize instruction to array for client
function serializeInstruction(instruction: TransactionInstruction) {
  return {
    programId: instruction.programId.toBase58(),
    keys: instruction.keys.map(k => ({
      pubkey: k.pubkey.toBase58(),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: Array.from(instruction.data),
  };
}

// Get token account addresses for buy transaction + check if ATAs need creation
export async function getBuyTransactionAccounts(userWalletAddress: string) {
  const connection = getCarvConnection();
  const userPubkey = new PublicKey(userWalletAddress);
  const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
  const programId = new PublicKey(CARV_SVM_CONFIG.contractAddress);
  const platformWallet = new PublicKey(CARV_SVM_CONFIG.platformWallet);

  const userTokenAccount = await getAssociatedTokenAddress(usdtMint, userPubkey);
  const poolTokenAccount = await getAssociatedTokenAddress(usdtMint, programId);
  const platformTokenAccount = await getAssociatedTokenAddress(usdtMint, platformWallet);

  // Check which ATAs exist
  const [userAccountInfo, poolAccountInfo, platformAccountInfo] = await Promise.all([
    connection.getAccountInfo(userTokenAccount),
    connection.getAccountInfo(poolTokenAccount),
    connection.getAccountInfo(platformTokenAccount),
  ]);

  // Create instructions for missing ATAs
  const createInstructions: any[] = [];
  
  if (!userAccountInfo) {
    const createIx = createAssociatedTokenAccountInstruction(
      userPubkey,  // payer
      userTokenAccount,  // ata
      userPubkey,  // owner
      usdtMint,  // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    createInstructions.push(serializeInstruction(createIx));
  }
  
  if (!poolAccountInfo) {
    const createIx = createAssociatedTokenAccountInstruction(
      userPubkey,  // payer (user pays for pool ATA creation)
      poolTokenAccount,  // ata
      programId,  // owner
      usdtMint,  // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    createInstructions.push(serializeInstruction(createIx));
  }
  
  if (!platformAccountInfo) {
    const createIx = createAssociatedTokenAccountInstruction(
      userPubkey,  // payer
      platformTokenAccount,  // ata
      platformWallet,  // owner
      usdtMint,  // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    createInstructions.push(serializeInstruction(createIx));
  }

  return {
    userTokenAccount: userTokenAccount.toBase58(),
    poolTokenAccount: poolTokenAccount.toBase58(),
    platformTokenAccount: platformTokenAccount.toBase58(),
    programId: CARV_SVM_CONFIG.contractAddress,
    createInstructions,
  };
}

// Get token account addresses for sell transaction + check if ATAs need creation
export async function getSellTransactionAccounts(userWalletAddress: string) {
  const connection = getCarvConnection();
  const userPubkey = new PublicKey(userWalletAddress);
  const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
  const programId = new PublicKey(CARV_SVM_CONFIG.contractAddress);

  const userTokenAccount = await getAssociatedTokenAddress(usdtMint, userPubkey);
  const poolTokenAccount = await getAssociatedTokenAddress(usdtMint, programId);
  
  // Derive pool authority PDA
  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_authority')],
    programId
  );

  // Check which ATAs exist
  const [userAccountInfo, poolAccountInfo] = await Promise.all([
    connection.getAccountInfo(userTokenAccount),
    connection.getAccountInfo(poolTokenAccount),
  ]);

  // Create instructions for missing ATAs
  const createInstructions: any[] = [];
  
  if (!userAccountInfo) {
    const createIx = createAssociatedTokenAccountInstruction(
      userPubkey,  // payer
      userTokenAccount,  // ata
      userPubkey,  // owner
      usdtMint,  // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    createInstructions.push(serializeInstruction(createIx));
  }
  
  if (!poolAccountInfo) {
    const createIx = createAssociatedTokenAccountInstruction(
      userPubkey,  // payer (user pays for pool ATA creation)
      poolTokenAccount,  // ata
      programId,  // owner
      usdtMint,  // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    createInstructions.push(serializeInstruction(createIx));
  }

  return {
    userTokenAccount: userTokenAccount.toBase58(),
    poolTokenAccount: poolTokenAccount.toBase58(),
    poolAuthority: poolAuthority.toBase58(),
    programId: CARV_SVM_CONFIG.contractAddress,
    createInstructions,
  };
}

export function calculateSlpFromUsdt(usdtAmount: number): number {
  return usdtAmount * SLP_EXCHANGE_RATES.buyRate;
}

export function calculateUsdtFromSlp(slpAmount: number): number {
  return slpAmount * SLP_EXCHANGE_RATES.sellRate;
}
