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

// Find the pool token account by searching program accounts OR derive from PDA
async function findPoolTokenAccount(
  connection: Connection,
  programId: PublicKey,
  mint: PublicKey,
  poolAuthority: PublicKey
): Promise<PublicKey> {
  try {
    // First, try to find by owner (pool_authority)
    const accountsByOwner = await connection.getTokenAccountsByOwner(poolAuthority, {
      mint,
    });
    
    if (accountsByOwner.value.length > 0) {
      console.log('[Pool] Found pool token account by owner:', accountsByOwner.value[0].pubkey.toBase58());
      return accountsByOwner.value[0].pubkey;
    }
    
    // If not found by owner, try searching all program accounts
    console.log('[Pool] Searching for pool token account in program accounts...');
    const programAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 }, // Token account size
        {
          memcmp: {
            offset: 0,
            bytes: mint.toBase58(), // Filter by mint
          },
        },
      ],
    });
    
    console.log('[Pool] Found', programAccounts.length, 'token accounts for USDT mint');
    
    // Check each account to find one with pool_authority
    for (const account of programAccounts) {
      const data = account.account.data;
      // Parse token account: first 32 bytes is mint, next 32 is owner, next 8 is amount, next 4 is delegateOption, next 32 is delegate, etc.
      // Authority is at offset 32
      const ownerPubkey = new PublicKey(data.slice(32, 64));
      
      if (ownerPubkey.equals(poolAuthority)) {
        console.log('[Pool] Found pool token account in program accounts:', account.pubkey.toBase58());
        return account.pubkey;
      }
    }
    
    throw new Error('Pool token account not found. Pool may need to be initialized.');
  } catch (error: any) {
    console.error('[Pool] Error finding pool token account:', error.message);
    throw new Error('Pool not initialized. Please contact the contract deployer to initialize the liquidity pool.');
  }
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
  
  // Calculate Anchor instruction discriminator for "buy_slp" (snake_case)
  const discriminator = createHash('sha256')
    .update('global:buy_slp')
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
  
  // Calculate Anchor instruction discriminator for "sell_slp" (snake_case)
  const discriminator = createHash('sha256')
    .update('global:sell_slp')
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

  // Derive pool authority PDA using correct seed from contract
  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool-authority')],
    programId
  );

  const userTokenAccount = await getAssociatedTokenAddress(usdtMint, userPubkey);
  const platformTokenAccount = await getAssociatedTokenAddress(usdtMint, platformWallet);
  
  // Find pool token account by searching for token accounts owned by the program
  // that have the pool_authority as authority and USDT as mint
  const poolTokenAccount = await findPoolTokenAccount(connection, programId, usdtMint, poolAuthority);

  // Check which ATAs exist (pool is not an ATA, so we only check user and platform)
  const [userAccountInfo, platformAccountInfo] = await Promise.all([
    connection.getAccountInfo(userTokenAccount),
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

  // Derive pool authority PDA using correct seed from contract
  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool-authority')],
    programId
  );

  const userTokenAccount = await getAssociatedTokenAddress(usdtMint, userPubkey);
  
  // Find pool token account by searching for token accounts owned by pool_authority
  const poolTokenAccount = await findPoolTokenAccount(connection, programId, usdtMint, poolAuthority);

  // Check which ATAs exist (pool is not an ATA)
  const userAccountInfo = await connection.getAccountInfo(userTokenAccount);

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
