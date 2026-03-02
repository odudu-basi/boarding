import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: 'Noboarding Support <onboarding@resend.dev>',
      to: 'oduduabasiav@gmail.com',
      replyTo: user.email!,
      subject: `[Support] ${subject}`,
      text: `From: ${user.email}\n\nSubject: ${subject}\n\n${message}`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Support API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
