import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import path from 'path'
import { writeFile, mkdir, unlink } from 'fs/promises'

// Map validated MIME types to safe extensions — never trust the client filename
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file.' }, { status: 400 })

    const ext = MIME_EXT[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    // Extension is derived from server-validated MIME — no filename involvement
    const fileName = `${session.user.id}-${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    const url = `/uploads/avatars/${fileName}`

    // Fetch old avatar URL before overwriting, then delete the old file
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    })

    await prisma.user.update({ where: { id: session.user.id }, data: { avatar: url } })

    // Delete old avatar file if it was a local upload — non-blocking
    if (existing?.avatar?.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), 'public', existing.avatar)
      unlink(oldPath).catch(() => {})
    }

    return NextResponse.json({ data: { url } })
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
