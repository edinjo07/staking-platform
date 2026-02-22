import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Protect with a secret so only authorized callers (Vercel Cron, server job, etc.) can trigger this
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return auth === `Bearer ${cronSecret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const now = new Date()

  try {
    // Find all ACTIVE stakes whose nextProcessAt is due
    const stakes = await prisma.stake.findMany({
      where: {
        status: 'ACTIVE',
        nextProcessAt: { lte: now },
      },
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
        // Record the payment
        await tx.stakePayment.create({
          data: {
            stakeId: stake.id,
            amount: dailyProfit,
            date: now,
          },
        })

        // Update stake
        if (isLastPayment) {
          await tx.stake.update({
            where: { id: stake.id },
            data: {
              totalEarned: newTotalEarned,
              status: 'COMPLETED',
              lastProcessed: now,
              nextProcessAt: null,
            },
          })
          completed++
        } else {
          const nextProcessAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          await tx.stake.update({
            where: { id: stake.id },
            data: {
              totalEarned: newTotalEarned,
              lastProcessed: now,
              nextProcessAt,
            },
          })
        }

        // Credit user balance with daily profit
        await tx.user.update({
          where: { id: stake.userId },
          data: { balance: { increment: dailyProfit } },
        })

        // Transaction ledger entry
        await tx.transaction.create({
          data: {
            userId: stake.userId,
            type: 'STAKING_RETURN',
            amount: dailyProfit,
            status: 'COMPLETED',
            description: `Daily ROI from ${stake.plan.name}`,
            referenceId: stake.id,
          },
        })

        // Notify on completion only
        if (isLastPayment) {
          await tx.notification.create({
            data: {
              userId: stake.userId,
              type: 'STAKING',
              title: 'Stake Completed',
              message: `Your stake in ${stake.plan.name} has matured. Total earned: $${newTotalEarned.toFixed(2)}.`,
            },
          })
        }
      })

      processed++
      } catch (stakeError) {
        console.error(`[CRON_PROCESS_STAKES] Failed to process stake ${stake.id}:`, stakeError)
        errors.push(stake.id)
      }
    }

    return NextResponse.json({ processed, completed, errors, timestamp: now.toISOString() })
  } catch (error) {
    console.error('[CRON_PROCESS_STAKES]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// Also support GET for Vercel Cron (which sends GET by default)
export async function GET(req: NextRequest) {
  return POST(req)
}
