import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Admin user ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
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
  const workerPassword = await bcrypt.hash('Worker@123456', 12)
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
  const supportPassword = await bcrypt.hash('Support@123456', 12)
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
    { name: 'Starter', description: 'Low-risk starter plan with steady daily returns.', minAmount: 50, maxAmount: 999, durationDays: 7, dailyRoi: 1.5, totalRoi: 10.5, isActive: true, isFeatured: false, sortOrder: 1 },
    { name: 'Silver', description: 'Medium-risk plan with enhanced weekly profits.', minAmount: 1000, maxAmount: 4999, durationDays: 14, dailyRoi: 2.0, totalRoi: 28.0, isActive: true, isFeatured: false, sortOrder: 2 },
    { name: 'Gold', description: 'Popular high-yield plan for serious investors.', minAmount: 5000, maxAmount: 24999, durationDays: 30, dailyRoi: 2.5, totalRoi: 75.0, isActive: true, isFeatured: true, sortOrder: 3 },
    { name: 'Diamond', description: 'Premium plan with maximum returns and priority support.', minAmount: 25000, maxAmount: 999999, durationDays: 60, dailyRoi: 3.0, totalRoi: 180.0, isActive: true, isFeatured: true, sortOrder: 4 },
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
