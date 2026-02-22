import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    await requireAdmin()

    const now = new Date()

    const stakes = await prisma.stake.findMany({
      where: { status: 'ACTIVE', nextProcessAt: { lte: now } },
      include: { plan: true },
    })

    let processed = 0
    let completed = 0
    const errors: string[] = []

    for (const stake of stakes) {
      try {
        const dailyProfit = parseFloat(((stake.amount * stake.dailyRoi) / 100).toFixed(2))
        const isLastPayment = stake.endDate <= now
        const newTotalEarned = parseFloat((stake.totalEarned + dailyProfit).toFixed(2))

        await prisma.$transaction(async (tx) => {
          await tx.stakePayment.create({ data: { stakeId: stake.id, amount: dailyProfit, date: now } })

          if (isLastPayment) {
            await tx.stake.update({
              where: { id: stake.id },
              data: { totalEarned: newTotalEarned, status: 'COMPLETED', lastProcessed: now, nextProcessAt: null },
            })
            completed++
          } else {
            const nextProcessAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            await tx.stake.update({
              where: { id: stake.id },
              data: { totalEarned: newTotalEarned, lastProcessed: now, nextProcessAt },
            })
          }

          await tx.user.update({ where: { id: stake.userId }, data: { balance: { increment: dailyProfit } } })

          await tx.transaction.create({
            data: {
              userId: stake.userId,
              type: 'STAKING_RETURN',
              amount: dailyProfit,
              status: 'COMPLETED',
              description: `Staking return for stake #${stake.id.slice(-8)}`,
              referenceId: stake.id,
            },
          })
        })
        processed++
      } catch (err) {
        errors.push(`Stake ${stake.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ processed, completed, errors, total: stakes.length })
  } catch {
    return NextResponse.json({ error: 'Unauthorized or server error.' }, { status: 500 })
  }
}
