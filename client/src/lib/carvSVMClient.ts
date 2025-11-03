import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

// TOKEN_PROGRAM_ID constant (avoiding @solana/spl-token import which has Buffer dependency)
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

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

// Get USDT balance from backend API
export async function getUSDTBalance(walletAddress: string): Promise<number> {
  try {
    const response = await fetch(`/api/slp/balance/${walletAddress}`);
    if (!response.ok) {
      throw new Error('Failed to fetch USDT balance');
    }
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    return 0;
  }
}

interface BuySlpParams {
  userWallet: any;
  walletAddress: string;
  usdtAmount: number;
}

// Helper to deserialize instruction from backend
function deserializeInstruction(serialized: any): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(serialized.programId),
    keys: serialized.keys.map((k: any) => ({
      pubkey: new PublicKey(k.pubkey),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: Uint8Array.from(serialized.data),
  });
}

// Buy SLP using backend API to prepare transaction (avoids Buffer dependency)
export async function buySlp({ userWallet, walletAddress, usdtAmount }: BuySlpParams): Promise<string> {
  try {
    if (!userWallet) {
      throw new Error('Wallet not connected');
    }

    if (!walletAddress) {
      throw new Error('Wallet address not found');
    }
    
    // Get transaction data from backend (backend uses Buffer)
    const response = await fetch('/api/slp/prepare-buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, usdtAmount }),
    });

    if (!response.ok) {
      throw new Error('Failed to prepare buy transaction');
    }

    const { instructionData, accounts, createInstructions } = await response.json();
    
    const connection = getCarvConnection();
    const userPubkey = new PublicKey(walletAddress);
    const programId = new PublicKey(accounts.programId);
    
    const transaction = new Transaction();
    
    // Add ATA creation instructions first (if any)
    if (createInstructions && createInstructions.length > 0) {
      for (const createIx of createInstructions) {
        transaction.add(deserializeInstruction(createIx));
      }
    }
    
    // Build main buy instruction using data from backend
    const keys = [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.userTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.poolTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.platformTokenAccount), isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    
    const instruction = new TransactionInstruction({
      keys,
      programId,
      data: Uint8Array.from(instructionData),
    });
    
    transaction.add(instruction);
    
    console.log('Getting latest blockhash...');
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    console.log('Blockhash set:', blockhash);
    
    console.log('Requesting wallet signature...');
    
    // Use signAndSendTransaction if available (Backpack), otherwise use signTransaction
    let signature: string;
    if (userWallet.signAndSendTransaction) {
      console.log('Using signAndSendTransaction (Backpack method)');
      const result = await userWallet.signAndSendTransaction(transaction);
      signature = result.signature || result;
      console.log('Transaction signed and sent, signature:', signature);
    } else {
      console.log('Using signTransaction + sendRawTransaction (Phantom method)');
      const signedTx = await userWallet.signTransaction(transaction);
      console.log('Transaction signed successfully');
      
      console.log('Sending transaction...');
      signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('Transaction sent, signature:', signature);
    }
    
    console.log('Confirming transaction...');
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('Transaction confirmed');
    
    return signature;
  } catch (error: any) {
    console.error('Error buying SLP - Full error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    throw new Error(error.message || 'Failed to buy SLP');
  }
}

interface SellSlpParams {
  userWallet: any;
  walletAddress: string;
  slpAmount: number;
}

// Sell SLP using backend API to prepare transaction (avoids Buffer dependency)
export async function sellSlp({ userWallet, walletAddress, slpAmount }: SellSlpParams): Promise<string> {
  try {
    if (!userWallet) {
      throw new Error('Wallet not connected');
    }

    if (!walletAddress) {
      throw new Error('Wallet address not found');
    }
    
    // Get transaction data from backend (backend uses Buffer)
    const response = await fetch('/api/slp/prepare-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, slpAmount }),
    });

    if (!response.ok) {
      throw new Error('Failed to prepare sell transaction');
    }

    const { instructionData, accounts, createInstructions } = await response.json();
    
    const connection = getCarvConnection();
    const userPubkey = new PublicKey(walletAddress);
    const programId = new PublicKey(accounts.programId);
    
    const transaction = new Transaction();
    
    // Add ATA creation instructions first (if any)
    if (createInstructions && createInstructions.length > 0) {
      for (const createIx of createInstructions) {
        transaction.add(deserializeInstruction(createIx));
      }
    }
    
    // Build main sell instruction using data from backend
    const keys = [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(accounts.userTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.poolTokenAccount), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(accounts.poolAuthority), isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    
    const instruction = new TransactionInstruction({
      keys,
      programId,
      data: Uint8Array.from(instructionData),
    });
    
    transaction.add(instruction);
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    
    // Use signAndSendTransaction if available (Backpack), otherwise use signTransaction
    let signature: string;
    if (userWallet.signAndSendTransaction) {
      const result = await userWallet.signAndSendTransaction(transaction);
      signature = result.signature || result;
    } else {
      const signedTx = await userWallet.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signedTx.serialize());
    }
    
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
