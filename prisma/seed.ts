import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Admin user ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456', 12)
  let admin = await db.user.findFirst({ where: { email: 'admin@stakeplatform.com' } })
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: 'admin@stakeplatform.com',
        username: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
        referralCode: 'ADMIN001',
      }
    })
  }
  console.log('✅ Admin user:', admin.email)

  // ─── Worker user ───────────────────────────────────────────────────────────
  const workerPassword = await bcrypt.hash(process.env.SEED_WORKER_PASSWORD ?? 'Worker@123456', 12)
  let worker = await db.user.findFirst({ where: { email: 'worker@stakeplatform.com' } })
  if (!worker) {
    worker = await db.user.create({
      data: {
        email: 'worker@stakeplatform.com',
        username: 'worker1',
        firstName: 'Worker',
        lastName: 'User',
        password: workerPassword,
        role: 'WORKER',
        isActive: true,
        emailVerified: new Date(),
        referralCode: 'WORKER01',
      }
    })
  }
  console.log('✅ Worker user:', worker.email)

  // ─── Support user ──────────────────────────────────────────────────────────
  const supportPassword = await bcrypt.hash(process.env.SEED_SUPPORT_PASSWORD ?? 'Support@123456', 12)
  let support = await db.user.findFirst({ where: { email: 'support@stakeplatform.com' } })
  if (!support) {
    support = await db.user.create({
      data: {
        email: 'support@stakeplatform.com',
        username: 'support1',
        firstName: 'Support',
        lastName: 'Agent',
        password: supportPassword,
        role: 'SUPPORT',
        isActive: true,
        emailVerified: new Date(),
        referralCode: 'SUPPORT1',
      }
    })
  }
  console.log('✅ Support user:', support.email)

  // ─── Staking plans ─────────────────────────────────────────────────────────
  const plans = [
    // ── Entry-level: low minimums, short locks ──────────────────────────────
    {
      name: 'USDT Flex Starter',
      description: 'Perfect entry point for newcomers. Stake USDT and earn instant daily rewards with a 7-day flexible lock - outperforming Binance and MEXC flexible plans.',
      minAmount: 50,
      maxAmount: 999,
      durationDays: 7,
      dailyRoi: 1.8,
      totalRoi: 12.6,
      isActive: true,
      isFeatured: false,
      sortOrder: 1,
    },
    {
      name: 'BTC Quick Yield',
      description: 'Short-term Bitcoin staking with daily payouts. 14-day lock delivering 2% per day - more than 3x the return of Coinbase BTC staking.',
      minAmount: 100,
      maxAmount: 2499,
      durationDays: 14,
      dailyRoi: 2.0,
      totalRoi: 28.0,
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
    },
    // ── Mid-tier: 21–30 day locks ────────────────────────────────────────────
    {
      name: 'AVAX Accelerator',
      description: 'Powered by Avalanche\'s ultra-fast consensus. 21-day sprint plan earning 2.2%/day - beating KuCoin and Kraken AVAX rates by 6x.',
      minAmount: 300,
      maxAmount: 4999,
      durationDays: 21,
      dailyRoi: 2.2,
      totalRoi: 46.2,
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
    },
    {
      name: 'SOL Boost',
      description: 'Harness Solana\'s blazing speed. 30-day plan at 2.3%/day delivering 69% total ROI - outperforms every SOL staking tier on Bybit and Nexo.',
      minAmount: 250,
      maxAmount: 4999,
      durationDays: 30,
      dailyRoi: 2.3,
      totalRoi: 69.0,
      isActive: true,
      isFeatured: false,
      sortOrder: 4,
    },
    {
      name: 'ETH Growth',
      description: 'Ethereum staking reimagined. 30-day plan at 2.5%/day yields 75% total - over 12x Coinbase ETH staking APY, with daily compounding-equivalent payouts.',
      minAmount: 500,
      maxAmount: 9999,
      durationDays: 30,
      dailyRoi: 2.5,
      totalRoi: 75.0,
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
    },
    {
      name: 'DOT Polkadot Pro',
      description: 'Capitalize on Polkadot\'s multi-chain ecosystem. 45-day lock at 2.7%/day for a total 121.5% ROI - far ahead of any DOT staking APY available on centralized platforms.',
      minAmount: 500,
      maxAmount: 9999,
      durationDays: 45,
      dailyRoi: 2.7,
      totalRoi: 121.5,
      isActive: true,
      isFeatured: false,
      sortOrder: 6,
    },
    // ── Professional: 60-day locks ───────────────────────────────────────────
    {
      name: 'Gold Reserve',
      description: 'Our most popular 30-day plan for growing portfolios. 2.8%/day - 84% total return, outclassing Stakely, Bybit, and Nexo best fixed plans.',
      minAmount: 1000,
      maxAmount: 9999,
      durationDays: 30,
      dailyRoi: 2.8,
      totalRoi: 84.0,
      isActive: true,
      isFeatured: true,
      sortOrder: 7,
    },
    {
      name: 'DeFi Maximizer',
      description: 'Built on DeFi principles. 60-day locked plan at 3.2%/day - 192% total ROI. Beats Lido, Stakely, and every DeFi staking aggregate by a wide margin.',
      minAmount: 2000,
      maxAmount: 24999,
      durationDays: 60,
      dailyRoi: 3.2,
      totalRoi: 192.0,
      isActive: true,
      isFeatured: true,
      sortOrder: 8,
    },
    {
      name: 'Diamond Vault',
      description: 'Our flagship 60-day vault. 3.0%/day with 180% total returns and priority customer support - delivering the kind of results top institutions demand.',
      minAmount: 5000,
      maxAmount: 49999,
      durationDays: 60,
      dailyRoi: 3.0,
      totalRoi: 180.0,
      isActive: true,
      isFeatured: true,
      sortOrder: 9,
    },
    // ── Elite: 90-day premium locks ──────────────────────────────────────────
    {
      name: 'Platinum Elite',
      description: 'For serious wealth builders. 60-day plan at 3.3%/day producing 198% total ROI - with dedicated account management and instant daily settlements.',
      minAmount: 10000,
      maxAmount: 49999,
      durationDays: 60,
      dailyRoi: 3.3,
      totalRoi: 198.0,
      isActive: true,
      isFeatured: false,
      sortOrder: 10,
    },
    {
      name: 'Black Card',
      description: 'The ultimate 90-day staking experience. 3.5%/day, 315% total ROI. Reserved for high-net-worth investors seeking unmatched passive income above any platform worldwide.',
      minAmount: 25000,
      maxAmount: 249999,
      durationDays: 90,
      dailyRoi: 3.5,
      totalRoi: 315.0,
      isActive: true,
      isFeatured: true,
      sortOrder: 11,
    },
    {
      name: 'Institutional VIP',
      description: 'Exclusive 90-day sovereign-level plan at 4.0%/day - 360% total ROI. White-glove service, dedicated liquidity desk, and returns no other platform can match.',
      minAmount: 50000,
      maxAmount: null,
      durationDays: 90,
      dailyRoi: 4.0,
      totalRoi: 360.0,
      isActive: true,
      isFeatured: true,
      sortOrder: 12,
    },
  ]

  for (const plan of plans) {
    const existing = await db.stakingPlan.findFirst({ where: { name: plan.name } })
    if (!existing) {
      await db.stakingPlan.create({ data: plan })
      console.log(`✅ Plan created: ${plan.name}`)
    } else {
      console.log(`⏭️  Plan exists: ${plan.name}`)
    }
  }

  // ─── Deposit currencies ────────────────────────────────────────────────────
  const depositCurrencies = [
    { symbol: 'BTC', name: 'Bitcoin', network: 'BTC', minDeposit: 0.0001, isActive: true },
    { symbol: 'ETH', name: 'Ethereum', network: 'ERC20', minDeposit: 0.005, isActive: true },
    { symbol: 'USDT', name: 'Tether', network: 'TRC20', minDeposit: 10, isActive: true },
    { symbol: 'USDC', name: 'USD Coin', network: 'ERC20', minDeposit: 10, isActive: true },
    { symbol: 'LTC', name: 'Litecoin', network: 'LTC', minDeposit: 0.01, isActive: true },
    { symbol: 'TRX', name: 'TRON', network: 'TRC20', minDeposit: 50, isActive: true },
  ]

  for (const c of depositCurrencies) {
    const existing = await db.depositCurrency.findFirst({ where: { symbol: c.symbol } })
    if (!existing) {
      await db.depositCurrency.create({ data: c })
      console.log(`✅ Deposit currency: ${c.symbol}`)
    }
  }

  // ─── Withdrawal currencies ─────────────────────────────────────────────────
  const withdrawCurrencies = [
    { symbol: 'BTC', name: 'Bitcoin', network: 'BTC', minWithdrawal: 0.001, fee: 0.0001, isActive: true },
    { symbol: 'ETH', name: 'Ethereum', network: 'ERC20', minWithdrawal: 0.01, fee: 0.003, isActive: true },
    { symbol: 'USDT', name: 'Tether', network: 'TRC20', minWithdrawal: 20, fee: 1, isActive: true },
    { symbol: 'USDC', name: 'USD Coin', network: 'ERC20', minWithdrawal: 20, fee: 2, isActive: true },
    { symbol: 'LTC', name: 'Litecoin', network: 'LTC', minWithdrawal: 0.05, fee: 0.005, isActive: true },
    { symbol: 'TRX', name: 'TRON', network: 'TRC20', minWithdrawal: 100, fee: 5, isActive: true },
  ]

  for (const c of withdrawCurrencies) {
    const existing = await db.withdrawalCurrency.findFirst({ where: { symbol: c.symbol } })
    if (!existing) {
      await db.withdrawalCurrency.create({ data: c })
      console.log(`✅ Withdrawal currency: ${c.symbol}`)
    }
  }

  // ─── Site settings ─────────────────────────────────────────────────────────
  const settings = [
    { key: 'site_name', value: 'Stake Platform' },
    { key: 'site_url', value: 'https://stakeplatform.com' },
    { key: 'site_description', value: 'World-class crypto staking platform' },
    { key: 'support_email', value: 'support@stakeplatform.com' },
    { key: 'support_phone', value: '' },
    { key: 'min_deposit', value: '10' },
    { key: 'min_withdrawal', value: '20' },
    { key: 'referral_bonus_percent', value: '5' },
    { key: 'withdrawal_fee_percent', value: '1' },
    { key: 'deposit_fee_percent', value: '0' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'maintenance_message', value: 'We are currently undergoing scheduled maintenance. Please check back soon.' },
    { key: 'registration_enabled', value: 'true' },
    { key: 'deposits_enabled', value: 'true' },
    { key: 'withdrawals_enabled', value: 'true' },
  ]

  for (const s of settings) {
    const existing = await db.siteSetting.findFirst({ where: { key: s.key } })
    if (!existing) await db.siteSetting.create({ data: s })
  }
  console.log(`✅ Site settings seeded (${settings.length})`)

  // ─── Sample domain ─────────────────────────────────────────────────────────
  const domain = await db.domain.findFirst({ where: { domain: 'stakeplatform.com' } })
  if (!domain) {
    await db.domain.create({ data: { domain: 'stakeplatform.com', isActive: true } })
    console.log('✅ Domain: stakeplatform.com')
  }

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Default credentials:')
  console.log('   Admin:   admin@stakeplatform.com / Admin@123456')
  console.log('   Worker:  worker@stakeplatform.com / Worker@123456')
  console.log('   Support: support@stakeplatform.com / Support@123456')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
