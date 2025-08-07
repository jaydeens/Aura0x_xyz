// Data migration script to transfer all PostgreSQL data to in-memory storage
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

// Connect to PostgreSQL database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateAllData() {
  console.log('Starting complete data migration from PostgreSQL...');
  
  try {
    // Get all users
    const usersResult = await pool.query('SELECT * FROM users ORDER BY aura_points DESC');
    console.log(`Found ${usersResult.rows.length} users to migrate`);
    
    // Get all vouches  
    const vouchesResult = await pool.query('SELECT * FROM vouches ORDER BY created_at DESC');
    console.log(`Found ${vouchesResult.rows.length} vouches to migrate`);
    
    // Get all steeze transactions
    const steezeResult = await pool.query('SELECT * FROM steeze_transactions ORDER BY created_at DESC');
    console.log(`Found ${steezeResult.rows.length} steeze transactions to migrate`);
    
    // Calculate total aura
    const statsResult = await pool.query('SELECT COUNT(*) as total_users, SUM(aura_points) as total_aura FROM users');
    console.log(`Total stats: ${statsResult.rows[0].total_users} users, ${statsResult.rows[0].total_aura} total aura`);
    
    // Format users data for JavaScript
    const formattedUsers = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      profileImageUrl: user.profile_image_url,
      username: user.username,
      walletAddress: user.wallet_address,
      twitterId: user.twitter_id,
      twitterUsername: user.twitter_username,
      auraPoints: user.aura_points || 0,
      currentStreak: user.current_streak || 0,
      lastLessonDate: user.last_lesson_date,
      totalVouchesReceived: user.total_vouches_received || 0,
      totalBattlesWon: user.total_battles_won || 0,
      totalBattlesLost: user.total_battles_lost || 0,
      portfolioGrowth: user.portfolio_growth || 0,
      walletAge: user.wallet_age || 0,
      isVerified: user.is_verified || false,
      auraFromLessons: user.aura_from_lessons || 0,
      auraFromVouching: user.aura_from_vouching || 0,
      auraFromBattles: user.aura_from_battles || 0,
      totalUsdtEarned: user.total_usdt_earned || 0,
      steezeBalance: user.steeze_balance || 0,
      battleEarnedSteeze: user.battle_earned_steeze || 0,
      purchasedSteeze: user.purchased_steeze || 0,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    // Format vouches data
    const formattedVouches = vouchesResult.rows.map(vouch => ({
      id: vouch.id.toString(),
      voucherUserId: vouch.from_user_id,
      vouchedUserId: vouch.to_user_id,
      usdcAmount: vouch.usdt_amount || 0,
      auraAwarded: vouch.aura_points || 0,
      multiplier: vouch.multiplier || 1.0,
      transactionHash: vouch.transaction_hash,
      battleId: vouch.battle_id,
      status: 'completed',
      createdAt: vouch.created_at,
      updatedAt: vouch.created_at
    }));
    
    // Format steeze transactions
    const formattedSteeze = steezeResult.rows.map(tx => ({
      id: tx.id,
      userId: tx.user_id,
      type: tx.type,
      amount: tx.amount || 0,
      usdcAmount: tx.usdt_amount || 0,
      rate: tx.rate || 10,
      status: tx.status || 'completed',
      transactionHash: tx.transaction_hash,
      recipientId: tx.recipient_id,
      battleId: tx.battle_id,
      createdAt: tx.created_at,
      updatedAt: tx.created_at
    }));
    
    // Output migration data
    console.log('\n=== MIGRATION DATA ===');
    console.log(`Users: ${formattedUsers.length}`);
    console.log(`Vouches: ${formattedVouches.length}`);
    console.log(`Steeze Transactions: ${formattedSteeze.length}`);
    console.log(`Total Aura: ${statsResult.rows[0].total_aura}`);
    
    // Save to file
    const migrationData = {
      users: formattedUsers,
      vouches: formattedVouches,
      steezeTransactions: formattedSteeze,
      stats: statsResult.rows[0]
    };
    
    fs.writeFileSync('migration-data.json', JSON.stringify(migrationData, null, 2));
    console.log('\n✓ Migration data saved to migration-data.json');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateAllData();