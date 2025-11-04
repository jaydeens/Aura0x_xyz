/**
 * CARV SVM Vouching Integration Module
 * 
 * Handles vouching transactions on CARV SVM testnet
 * Uses raw @solana/web3.js for SPL token transfers
 * 
 * Program ID: Afn4YEKXFismTcsRt4dJkdXZHrreXm42Fqi1HDg99ocV
 * Platform: CARV SVM Testnet
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';

// SPL Token Program IDs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Vouching Program Configuration
export const VOUCHING_CONFIG = {
  programId: new PublicKey('Afn4YEKXFismTcsRt4dJkdXZHrreXm42Fqi1HDg99ocV'),
  rpcUrl: 'https://rpc.testnet.carv.io/rpc',
  usdtMint: new PublicKey('7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF'),
  platformWallet: new PublicKey('HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat'),
  usdtDecimals: 9, // CARV SVM USDT uses 9 decimals, not 6!
};

export const VOUCH_SPLIT = {
  recipientPercent: 0.7, // 70% to recipient
  platformPercent: 0.3, // 30% to platform
};

/**
 * Get connection to CARV SVM testnet
 */
export function getConnection(): Connection {
  return new Connection(VOUCHING_CONFIG.rpcUrl, 'confirmed');
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
 * Check if an account exists
 */
async function accountExists(
  connection: Connection,
  address: PublicKey
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(address);
    return accountInfo !== null;
  } catch {
    return false;
  }
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
 * Deposit vouch: Transfer USDT to recipient (70%) and platform (30%)
 * 
 * @param recipientAddress - Recipient's wallet address
 * @param usdtAmount - Amount in USDT (human-readable, e.g., 10 for 10 USDT)
 * @param voucherPublicKey - Voucher's public key from connected wallet
 * @param signTransaction - Function to sign transactions from wallet adapter
 * @returns Transaction signature
 */
export async function depositVouch(
  recipientAddress: string,
  usdtAmount: number,
  voucherPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
  try {
    console.log('[Vouching] Starting vouch transaction');
    console.log('[Vouching] Recipient:', recipientAddress);
    console.log('[Vouching] Amount:', usdtAmount, 'USDT');
    
    // Convert USDT amount to smallest unit (9 decimals)
    const amountInSmallestUnit = Math.floor(usdtAmount * Math.pow(10, VOUCHING_CONFIG.usdtDecimals));
    const recipientAmount = Math.floor(amountInSmallestUnit * VOUCH_SPLIT.recipientPercent);
    const platformAmount = Math.floor(amountInSmallestUnit * VOUCH_SPLIT.platformPercent);
    
    console.log('[Vouching] Total amount (smallest unit):', amountInSmallestUnit);
    console.log('[Vouching] Recipient gets:', recipientAmount, '(70%)');
    console.log('[Vouching] Platform gets:', platformAmount, '(30%)');
    
    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
    } catch (error) {
      throw new Error('Invalid recipient wallet address');
    }
    
    // Get connection
    const connection = getConnection();
    
    // Find all required associated token accounts
    console.log('[Vouching] Finding associated token accounts...');
    const voucherATA = await findAssociatedTokenAddress(voucherPublicKey, VOUCHING_CONFIG.usdtMint);
    const recipientATA = await findAssociatedTokenAddress(recipientPubkey, VOUCHING_CONFIG.usdtMint);
    const platformATA = await findAssociatedTokenAddress(VOUCHING_CONFIG.platformWallet, VOUCHING_CONFIG.usdtMint);
    
    console.log('[Vouching] Voucher ATA:', voucherATA.toBase58());
    console.log('[Vouching] Recipient ATA:', recipientATA.toBase58());
    console.log('[Vouching] Platform ATA:', platformATA.toBase58());
    
    // Check which ATAs exist
    const [voucherExists, recipientExists, platformExists] = await Promise.all([
      accountExists(connection, voucherATA),
      accountExists(connection, recipientATA),
      accountExists(connection, platformATA),
    ]);
    
    console.log('[Vouching] Account existence check:', {
      voucher: voucherExists,
      recipient: recipientExists,
      platform: platformExists
    });
    
    if (!voucherExists) {
      throw new Error('Voucher does not have a USDT token account. Please ensure you have USDT tokens.');
    }
    
    // Check voucher's USDT balance
    const voucherAccountInfo = await connection.getAccountInfo(voucherATA);
    if (!voucherAccountInfo) {
      throw new Error('Failed to get voucher account info');
    }
    
    // Parse token account data to get balance (amount is at offset 64, 8 bytes little-endian)
    // Use browser-compatible DataView instead of Buffer
    const dataView = new DataView(voucherAccountInfo.data.buffer, voucherAccountInfo.data.byteOffset, voucherAccountInfo.data.byteLength);
    const voucherBalance = dataView.getBigUint64(64, true); // true = little-endian
    console.log('[Vouching] Voucher USDT balance:', voucherBalance.toString());
    
    if (Number(voucherBalance) < amountInSmallestUnit) {
      const balanceInUsdt = Number(voucherBalance) / Math.pow(10, VOUCHING_CONFIG.usdtDecimals);
      throw new Error(`Insufficient USDT balance. You have ${balanceInUsdt.toFixed(4)} USDT but need ${usdtAmount} USDT.`);
    }
    
    // Build transaction
    const transaction = new Transaction();
    
    // Create recipient ATA if it doesn't exist
    if (!recipientExists) {
      console.log('[Vouching] Creating recipient ATA...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          voucherPublicKey,
          recipientATA,
          recipientPubkey,
          VOUCHING_CONFIG.usdtMint
        )
      );
    }
    
    // Create platform ATA if it doesn't exist
    if (!platformExists) {
      console.log('[Vouching] Creating platform ATA...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          voucherPublicKey,
          platformATA,
          VOUCHING_CONFIG.platformWallet,
          VOUCHING_CONFIG.usdtMint
        )
      );
    }
    
    // Add transfer to recipient (70%)
    console.log('[Vouching] Adding transfer to recipient...');
    transaction.add(
      createTransferInstruction(
        voucherATA,
        recipientATA,
        voucherPublicKey,
        recipientAmount
      )
    );
    
    // Add transfer to platform (30%)
    console.log('[Vouching] Adding transfer to platform...');
    transaction.add(
      createTransferInstruction(
        voucherATA,
        platformATA,
        voucherPublicKey,
        platformAmount
      )
    );
    
    // Get recent blockhash
    console.log('[Vouching] Getting recent blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = voucherPublicKey;
    
    // Sign transaction
    console.log('[Vouching] Signing transaction...');
    const signedTx = await signTransaction(transaction);
    
    // Send transaction
    console.log('[Vouching] Sending transaction...');
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log('[Vouching] Transaction sent:', signature);
    console.log('[Vouching] Confirming transaction...');
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
    }
    
    console.log('[Vouching] Transaction confirmed!');
    console.log('[Vouching] Solscan:', `https://solscan.io/tx/${signature}?cluster=custom&customUrl=${VOUCHING_CONFIG.rpcUrl}`);
    
    return signature;
    
  } catch (error: any) {
    console.error('[Vouching] Error:', error);
    throw error;
  }
}

/**
 * Get user's USDT balance
 */
export async function getUSDTBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const ata = await findAssociatedTokenAddress(walletPubkey, VOUCHING_CONFIG.usdtMint);
    
    const accountInfo = await connection.getAccountInfo(ata);
    if (!accountInfo) {
      return 0;
    }
    
    // Parse token account data to get balance (amount is at offset 64, 8 bytes little-endian)
    // Use browser-compatible DataView instead of Buffer
    const dataView = new DataView(accountInfo.data.buffer, accountInfo.data.byteOffset, accountInfo.data.byteLength);
    const balance = dataView.getBigUint64(64, true); // true = little-endian
    return Number(balance) / Math.pow(10, VOUCHING_CONFIG.usdtDecimals);
  } catch (error) {
    console.error('[Vouching] Error getting USDT balance:', error);
    return 0;
  }
}
