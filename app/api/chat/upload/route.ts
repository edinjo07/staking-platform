import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const form = await req.formData()
    const file = form.get('image') as File
    if (!file) return NextResponse.json({ error: 'No file.' }, { status: 400 })

    const mimeExtMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = mimeExtMap[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `chat-${session.user.id}-${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    return NextResponse.json({ data: { url: `/uploads/chat/${fileName}` } })
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
