import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from 'buffer';

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
  const instructionData = Buffer.alloc(9);
  instructionData.writeUInt8(0, 0); // Instruction index for "buy"
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 1);
  return {
    data: Array.from(instructionData),
    amountLamports
  };
}

// Create instruction data for sell transaction (uses Buffer - backend only)
export function createSellInstructionData(slpAmount: number): { data: number[], slpAmountRaw: number } {
  const slpAmountRaw = Math.floor(slpAmount);
  const instructionData = Buffer.alloc(9);
  instructionData.writeUInt8(1, 0); // Instruction index for "sell"
  instructionData.writeBigUInt64LE(BigInt(slpAmountRaw), 1);
  return {
    data: Array.from(instructionData),
    slpAmountRaw
  };
}

// Get token account addresses for buy transaction
export async function getBuyTransactionAccounts(userWalletAddress: string) {
  const connection = getCarvConnection();
  const userPubkey = new PublicKey(userWalletAddress);
  const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
  const programId = new PublicKey(CARV_SVM_CONFIG.contractAddress);
  const platformWallet = new PublicKey(CARV_SVM_CONFIG.platformWallet);

  const userTokenAccount = await getAssociatedTokenAddress(usdtMint, userPubkey);
  const poolTokenAccount = await getAssociatedTokenAddress(usdtMint, programId);
  const platformTokenAccount = await getAssociatedTokenAddress(usdtMint, platformWallet);

  return {
    userTokenAccount: userTokenAccount.toBase58(),
    poolTokenAccount: poolTokenAccount.toBase58(),
    platformTokenAccount: platformTokenAccount.toBase58(),
    programId: CARV_SVM_CONFIG.contractAddress,
  };
}

// Get token account addresses for sell transaction
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

  return {
    userTokenAccount: userTokenAccount.toBase58(),
    poolTokenAccount: poolTokenAccount.toBase58(),
    poolAuthority: poolAuthority.toBase58(),
    programId: CARV_SVM_CONFIG.contractAddress,
  };
}

export function calculateSlpFromUsdt(usdtAmount: number): number {
  return usdtAmount * SLP_EXCHANGE_RATES.buyRate;
}

export function calculateUsdtFromSlp(slpAmount: number): number {
  return slpAmount * SLP_EXCHANGE_RATES.sellRate;
}
