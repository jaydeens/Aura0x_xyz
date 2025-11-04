import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

const CARV_SVM_RPC = 'https://rpc.testnet.carv.io/rpc';
const USDT_MINT = new PublicKey('BrZJPTML5PkYBDMGLZB4rvN9jbwKfmVLW6b9C9zBPZha');
const PLATFORM_WALLET = new PublicKey('HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat');
const VOUCH_PROGRAM = new PublicKey('Afn4YEKXFismTcsRt4dJkdXZHrreXm42Fqi1HDg99ocV');

interface VouchVerification {
  isValid: boolean;
  voucher?: string;
  vouchedUser?: string;
  usdtAmount?: number;
  dreamzPoints?: number;
  platformFee?: number;
}

export async function verifyVouchTransaction(txHash: string): Promise<VouchVerification> {
  try {
    const connection = new Connection(CARV_SVM_RPC, 'confirmed');
    
    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });

    if (!tx || !tx.meta || tx.meta.err) {
      console.error('Transaction not found or failed:', txHash);
      return { isValid: false };
    }

    const parsed = tx as ParsedTransactionWithMeta;
    const meta = parsed.meta;
    const accountKeys = parsed.transaction.message.accountKeys;
    
    let voucher: string | undefined;
    let vouchedUser: string | undefined;
    let totalUsdtAmount = 0;
    let platformFee = 0;
    let recipientAmount = 0;

    const preBalances = meta.preTokenBalances || [];
    const postBalances = meta.postTokenBalances || [];

    for (let i = 0; i < preBalances.length; i++) {
      const preBal = preBalances[i];
      const postBal = postBalances.find(p => p.accountIndex === preBal.accountIndex);
      
      if (!postBal || preBal.mint !== USDT_MINT.toBase58()) continue;

      const preAmount = Number(preBal.uiTokenAmount.uiAmount) || 0;
      const postAmount = Number(postBal.uiTokenAmount.uiAmount) || 0;
      const change = postAmount - preAmount;

      const accountPubkey = accountKeys[preBal.accountIndex].pubkey.toBase58();

      if (change < 0) {
        voucher = preBal.owner;
        totalUsdtAmount = Math.abs(change);
      }

      if (change > 0) {
        const owner = postBal.owner;
        
        if (owner === PLATFORM_WALLET.toBase58()) {
          platformFee = change;
        } else {
          vouchedUser = owner;
          recipientAmount = change;
        }
      }
    }

    if (!voucher || !vouchedUser || totalUsdtAmount === 0) {
      console.error('Invalid vouch transaction structure');
      return { isValid: false };
    }

    const expectedPlatformFee = totalUsdtAmount * 0.3;
    const expectedRecipientAmount = totalUsdtAmount * 0.7;
    
    const platformFeeMatches = Math.abs(platformFee - expectedPlatformFee) < 0.01;
    const recipientAmountMatches = Math.abs(recipientAmount - expectedRecipientAmount) < 0.01;

    if (!platformFeeMatches || !recipientAmountMatches) {
      console.error('Split amounts do not match expected 70/30 split');
      return { isValid: false };
    }

    const dreamzPoints = Math.floor(totalUsdtAmount * 10);

    return {
      isValid: true,
      voucher,
      vouchedUser,
      usdtAmount: totalUsdtAmount,
      dreamzPoints,
      platformFee
    };
  } catch (error) {
    console.error('Error verifying vouch transaction:', error);
    return { isValid: false };
  }
}
