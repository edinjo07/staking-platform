'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: 'Email',
    value: 'support@stakeplatform.com',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Live Chat',
    value: 'Available 24/7 via our platform',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    label: 'Response Time',
    value: 'Within 2 hours',
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: 'Headquarters',
    value: 'London, United Kingdom',
  },
]

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Your message has been sent! We will get back to you soon.')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Have a question or need help? We&#39;re here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((info) => (
              <div key={info.label} className="glass-card p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {info.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-medium">{info.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help?"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more about your question..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={loading}>
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
