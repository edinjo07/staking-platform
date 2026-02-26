import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'StakePlatform <noreply@stakeplatform.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  })
}

export function getWelcomeEmailTemplate(name: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Welcome to StakePlatform</title></head>
    <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e; text-align: center;">Welcome to StakePlatform!</h1>
        <p>Hello ${name},</p>
        <p>Your account has been successfully created with email: <strong>${email}</strong></p>
        <p>Start staking today and earn passive income!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `
}

export function getPasswordResetEmailTemplate(name: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Password Reset</title></head>
    <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e; text-align: center;">Password Reset Request</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `
}

export function getDepositConfirmedEmailTemplate(name: string, amount: string, currency: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Deposit Confirmed</title></head>
    <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e; text-align: center;">Deposit Confirmed! ✅</h1>
        <p>Hello ${name},</p>
        <p>Your deposit of <strong style="color: #22c55e;">${amount} ${currency}</strong> has been confirmed and credited to your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to StakePlatform!',
    html: getWelcomeEmailTemplate(name, email),
  })
}

export function getVerificationEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Verify Your Email</title></head>
    <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e; text-align: center;">Verify Your Email</h1>
        <p>Hello ${name},</p>
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; color: #94a3b8; font-size: 13px;">${verifyUrl}</p>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/verify-email?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: getVerificationEmailTemplate(name, verifyUrl),
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, name?: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html: getPasswordResetEmailTemplate(name || email, resetUrl),
  })
}

export async function sendDepositConfirmedEmail(email: string, amount: number, currency: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Deposit Confirmed',
    html: getDepositConfirmedEmailTemplate(email, amount.toString(), currency),
  })
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<void> {
  const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER || ''
  await sendEmail({
    to: adminEmail,
    subject: `Contact Form: ${subject}`,
    html: `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  })
}

export function getWithdrawalStatusEmailTemplate(
  name: string,
  amount: string,
  currency: string,
  status: 'approved' | 'rejected',
  reason?: string
): string {
  const isApproved = status === 'approved'
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Withdrawal ${isApproved ? 'Approved' : 'Rejected'}</title></head>
    <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px;">
        <h1 style="color: ${isApproved ? '#22c55e' : '#ef4444'}; text-align: center;">
          Withdrawal ${isApproved ? 'Approved ✅' : 'Rejected ❌'}
        </h1>
        <p>Hello ${name},</p>
        <p>Your withdrawal request of <strong>${amount} ${currency}</strong> has been 
          <strong style="color: ${isApproved ? '#22c55e' : '#ef4444'};">${status}</strong>.
        </p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/withdraw" 
             style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Withdrawals
          </a>
        </div>
      </div>
    </body>
    </html>
  `
}
