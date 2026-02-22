import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/mail'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    await sendContactEmail(parsed.data)

    return NextResponse.json({ message: 'Message sent. We will get back to you soon.' })
  } catch (error) {
    console.error('[CONTACT]', error)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
