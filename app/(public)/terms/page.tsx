import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

        <div className="space-y-8">
          {[
            {
              title: '1. Acceptance of Terms',
              content: `By accessing and using StakePlatform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
            },
            {
              title: '2. Use of Service',
              content: `StakePlatform provides a cryptocurrency staking platform. You must be at least 18 years of age to use our services. You are responsible for maintaining the confidentiality of your account and password.`,
            },
            {
              title: '3. Investment Risk',
              content: `Cryptocurrency staking involves significant risk. The value of digital assets can fluctuate wildly, and you may lose some or all of your investment. Past performance is not indicative of future results. StakePlatform does not guarantee any specific returns.`,
            },
            {
              title: '4. Prohibited Activities',
              content: `You agree not to:
              • Use the service for any illegal purposes
              • Attempt to gain unauthorized access to our systems
              • Engage in market manipulation or fraudulent activities
              • Use multiple accounts to abuse referral programs
              • Violate any applicable laws or regulations`,
            },
            {
              title: '5. Deposits and Withdrawals',
              content: `All deposits and withdrawals are subject to our minimum/maximum limits and processing times. We reserve the right to pause or cancel transactions suspected of fraud or suspicious activity.`,
            },
            {
              title: '6. Account Suspension',
              content: `We reserve the right to suspend or terminate your account at any time for violations of these terms, suspicious activity, or legal compliance reasons.`,
            },
            {
              title: '7. Limitation of Liability',
              content: `StakePlatform shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.`,
            },
            {
              title: '8. Changes to Terms',
              content: `We reserve the right to modify these terms at any time. We will provide notice of significant changes via email or platform notification.`,
            },
            {
              title: '9. Contact',
              content: `Questions about the Terms of Service should be sent to: legal@stakeplatform.com`,
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
