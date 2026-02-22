import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { calculateStakingReturns } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  planId: z.string(),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { planId, amount } = parsed.data

    const plan = await prisma.stakingPlan.findUnique({ where: { id: planId, isActive: true } })
    if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })

    if (amount < plan.minAmount) {
      return NextResponse.json({ error: `Minimum investment is $${plan.minAmount}.` }, { status: 400 })
    }
    if (plan.maxAmount && amount > plan.maxAmount) {
      return NextResponse.json({ error: `Maximum investment is $${plan.maxAmount}.` }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Fetch referral bonus % outside transaction
    const referralSetting = await prisma.siteSetting.findUnique({ where: { key: 'referral_bonus_percent' } })
    // Use ?? (not ||) so 0 is a valid configured value; fall back only when absent/non-numeric
    const parsed_pct = referralSetting ? parseFloat(referralSetting.value) : NaN
    const referralBonusPct = isNaN(parsed_pct) ? 5 : parsed_pct

    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
    const nextProcessAt = new Date(startedAt.getTime() + 24 * 60 * 60 * 1000) // first payout in 24h
    const { totalReturn: expectedReturn } = calculateStakingReturns(amount, plan.dailyRoi, plan.durationDays)

    const stake = await prisma.$transaction(async (tx) => {
      // Re-read balance inside the transaction to prevent race-condition double-spend
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      })
      if (!freshUser || freshUser.balance < amount) {
        throw Object.assign(new Error('Insufficient balance.'), { code: 'INSUFFICIENT_BALANCE' })
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      })

      const s = await tx.stake.create({
        data: {
          userId: user.id,
          planId,
          amount,
          dailyRoi: plan.dailyRoi,
          totalRoi: plan.totalRoi,
          expectedReturn,
          status: 'ACTIVE',
          startDate: startedAt,
          endDate: endsAt,
          nextProcessAt,
        },
      })

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'STAKING',
          amount,
          status: 'COMPLETED',
          description: `Staked $${amount} in ${plan.name}`,
          referenceId: s.id,
        },
      })

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'STAKING',
          title: 'Stake Created',
          message: `You have staked $${amount} in ${plan.name}. Expected return: $${expectedReturn.toFixed(2)}.`,
        },
      })

      // Credit referral bonus if user was referred
      if (user.referredById) {
        const bonusAmount = parseFloat(((amount * referralBonusPct) / 100).toFixed(2))

        await tx.referralEarning.create({
          data: {
            userId: user.referredById,
            fromUserId: user.id,
            stakeId: s.id,
            amount: bonusAmount,
            percentage: referralBonusPct,
            type: 'STAKE',
          },
        })

        await tx.user.update({
          where: { id: user.referredById },
          data: { balance: { increment: bonusAmount } },
        })

        await tx.transaction.create({
          data: {
            userId: user.referredById,
            type: 'REFERRAL_BONUS',
            amount: bonusAmount,
            status: 'COMPLETED',
            description: `Referral bonus from ${user.username || user.email} staking in ${plan.name}`,
            referenceId: s.id,
          },
        })

        await tx.notification.create({
          data: {
            userId: user.referredById,
            type: 'REFERRAL',
            title: 'Referral Bonus Earned',
            message: `You earned a $${bonusAmount} referral bonus from a referred user's stake.`,
          },
        })
      }

      return s
    })

    return NextResponse.json({ data: { stakeId: stake.id } }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 })
    }
    console.error('[STAKING_CREATE]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
