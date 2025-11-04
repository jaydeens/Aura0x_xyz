/**
 * CARV SVM Chain Constants
 * Shared configuration for CARV SVM testnet vouching and SLP trading
 */

export const CARV_SVM = {
  RPC_URL: 'https://rpc.testnet.carv.io/rpc',
  USDT_MINT: '7J6YALZGY2MhAYF9veEapTRbszWVTVPYHSfWeK2LuaQF',
  USDT_DECIMALS: 9, // CARV SVM USDT uses 9 decimals, not 6!
  PLATFORM_WALLET: 'HiyDHAyvc9TDNm1M8rbAsY7yeyRvJXN5TpBFT6nKZSat',
  VOUCHING_PROGRAM_ID: 'Afn4YEKXFismTcsRt4dJkdXZHrreXm42Fqi1HDg99ocV',
  VOUCH_SPLIT: {
    RECIPIENT_PERCENT: 0.7, // 70% to recipient
    PLATFORM_PERCENT: 0.3, // 30% to platform
  },
  SLP_RATES: {
    BUY: 100, // 100 SLP per 1 USDT
    SELL: 0.007, // 0.007 USDT per 1 SLP
  },
} as const;
