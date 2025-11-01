import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import slpExchangeIdl from './slp_exchange_idl.json';

export const CARV_SVM_CONFIG = {
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  contractAddress: 'Bjj32BCTb6jvuNh4PF3dCP81cSqBVEts9K5pdxJw9RcA',
  usdtTokenAddress: '7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF',
  platformWallet: 'HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat',
  idlAccount: 'GFQ6F1Cmnmc7oybyxkxHPXjCFh1kNfKXgxb1asNbmdqm',
};

export const SLP_EXCHANGE_RATES = {
  buyRate: 100, // 1 USDT = 100 SLP (or 1 SLP = 0.01 USDT)
  sellRate: 0.007, // 1 SLP = 0.007 USDT
  platformFee: 0.3, // 30% platform fee
  liquidityRetention: 0.7, // 70% stays in contract
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

export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const associatedToken = await getAssociatedTokenAddress(mint, owner);
  
  try {
    const account = await connection.getAccountInfo(associatedToken);
    if (account) {
      return associatedToken;
    }
  } catch (error) {
    console.log('Token account does not exist, will create it');
  }
  
  // Add instruction to create the associated token account
  const createAccountInstruction = createAssociatedTokenAccountInstruction(
    payer,
    associatedToken,
    owner,
    mint
  );
  transaction.add(createAccountInstruction);
  
  return associatedToken;
}

interface BuySlpParams {
  userWallet: any;
  usdtAmount: number;
}

export async function buySlp({ userWallet, usdtAmount }: BuySlpParams): Promise<string> {
  try {
    if (!userWallet || !userWallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const connection = getCarvConnection();
    const userPubkey = userWallet.publicKey;
    
    const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
    const programId = new PublicKey(CARV_SVM_CONFIG.contractAddress);
    const platformWallet = new PublicKey(CARV_SVM_CONFIG.platformWallet);
    
    const transaction = new Transaction();
    
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      transaction,
      userPubkey,
      usdtMint,
      userPubkey
    );
    
    const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      transaction,
      userPubkey,
      usdtMint,
      programId
    );
    
    const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      transaction,
      userPubkey,
      usdtMint,
      platformWallet
    );
    
    const amountLamports = Math.floor(usdtAmount * 1_000_000);
    
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(0, 0);
    instructionData.writeBigUInt64LE(BigInt(amountLamports), 1);
    
    const keys = [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: platformTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    
    transaction.add({
      keys,
      programId,
      data: instructionData,
    });
    
    transaction.feePayer = userPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    const signedTx = await userWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error: any) {
    console.error('Error buying SLP:', error);
    throw new Error(error.message || 'Failed to buy SLP');
  }
}

interface SellSlpParams {
  userWallet: any;
  slpAmount: number;
}

export async function sellSlp({ userWallet, slpAmount }: SellSlpParams): Promise<string> {
  try {
    if (!userWallet || !userWallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const connection = getCarvConnection();
    const userPubkey = userWallet.publicKey;
    
    const usdtMint = new PublicKey(CARV_SVM_CONFIG.usdtTokenAddress);
    const programId = new PublicKey(CARV_SVM_CONFIG.contractAddress);
    
    const transaction = new Transaction();
    
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      transaction,
      userPubkey,
      usdtMint,
      userPubkey
    );
    
    const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      transaction,
      userPubkey,
      usdtMint,
      programId
    );
    
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority')],
      programId
    );
    
    const slpAmountRaw = Math.floor(slpAmount);
    
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(1, 0);
    instructionData.writeBigUInt64LE(BigInt(slpAmountRaw), 1);
    
    const keys = [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: poolAuthority, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    
    transaction.add({
      keys,
      programId,
      data: instructionData,
    });
    
    transaction.feePayer = userPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    const signedTx = await userWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error: any) {
    console.error('Error selling SLP:', error);
    throw new Error(error.message || 'Failed to sell SLP');
  }
}

export function calculateSlpFromUsdt(usdtAmount: number): number {
  return usdtAmount * SLP_EXCHANGE_RATES.buyRate;
}

export function calculateUsdtFromSlp(slpAmount: number): number {
  return slpAmount * SLP_EXCHANGE_RATES.sellRate;
}

export function calculatePlatformFee(usdtAmount: number): number {
  return usdtAmount * SLP_EXCHANGE_RATES.platformFee;
}

export function calculateLiquidityAmount(usdtAmount: number): number {
  return usdtAmount * SLP_EXCHANGE_RATES.liquidityRetention;
}
