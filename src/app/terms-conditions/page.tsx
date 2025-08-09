import { AppLayout } from "@/components/layouts/app-layout";

export default function TermsConditionsPage() {
  return (
    <AppLayout>
      <div className=" bg-gray-950">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Terms & Conditions</h1>

            <div className="prose prose-invert max-w-none">
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800/50 space-y-6">
                <p className="text-gray-300 text-sm mb-6">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
                  <p className="text-gray-300">
                    By accessing and using Veymo.ai services, you accept and agree to be bound by the
                    terms and provision of this agreement. If you do not agree to abide by these terms,
                    please do not use this service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
                  <p className="text-gray-300">
                    Veymo.ai provides AI-powered video generation services. We reserve the right to
                    modify, suspend, or discontinue the service at any time without notice.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
                  <p className="text-gray-300">
                    You are responsible for maintaining the confidentiality of your account credentials
                    and for all activities that occur under your account. You must notify us immediately
                    of any unauthorized use of your account.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
                  <p className="text-gray-300">You agree not to use our services to:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Create content that is illegal, harmful, or violates others&apos; rights</li>
                    <li>Generate content that is defamatory, obscene, or offensive</li>
                    <li>Attempt to reverse engineer or compromise our systems</li>
                    <li>Use automated tools to access our services without permission</li>
                    <li>Create content that infringes on intellectual property rights</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">5. Payment and Credits</h2>
                  <p className="text-gray-300">
                    Our services operate on a credit-based system. Credits are non-refundable except
                    as outlined in our refund policy below. Subscription fees are billed in advance and
                    are non-refundable except as specified in the refund policy.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">6. Intellectual Property</h2>
                  <p className="text-gray-300">
                    You retain ownership of content you create using our services. We retain ownership
                    of our technology, software, and service improvements. By using our service, you
                    grant us a license to process your inputs to provide the service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">7. Privacy and Data</h2>
                  <p className="text-gray-300">
                    Your privacy is important to us. Please review our Privacy Policy to understand
                    how we collect, use, and protect your information.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
                  <p className="text-gray-300">
                    Veymo.ai shall not be liable for any indirect, incidental, special, consequential,
                    or punitive damages resulting from your use of our services. Our total liability
                    shall not exceed the amount paid by you in the 12 months preceding the claim.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">9. Termination</h2>
                  <p className="text-gray-300">
                    We may terminate or suspend your account immediately, without prior notice, if you
                    breach these terms. Upon termination, your right to use the service ceases immediately.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">10. Governing Law</h2>
                  <p className="text-gray-300">
                    These terms shall be governed by and construed in accordance with applicable laws.
                    Any disputes shall be resolved through binding arbitration.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">11. Changes to Terms</h2>
                  <p className="text-gray-300">
                    We reserve the right to modify these terms at any time. Changes will be effective
                    immediately upon posting. Your continued use of the service constitutes acceptance
                    of the modified terms.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">12. Refund Policy</h2>
                  
                  <h3 className="text-lg font-semibold text-white">Credit Purchases</h3>
                  <p className="text-gray-300">
                    Credits purchased through our platform are generally non-refundable. However,
                    we may provide refunds in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Technical issues preventing service delivery within 48 hours of purchase</li>
                    <li>Duplicate charges due to payment processing errors</li>
                    <li>Service outages lasting more than 24 hours</li>
                    <li>Unauthorized transactions (subject to fraud investigation)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Subscription Refunds</h3>
                  <p className="text-gray-300">
                    Subscription fees are billed in advance and are generally non-refundable.
                    Exceptions include:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Cancellation within 24 hours of initial subscription</li>
                    <li>Service unavailability for more than 72 consecutive hours</li>
                    <li>Billing errors or unauthorized charges</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Refund Process</h3>
                  <p className="text-gray-300">
                    To request a refund:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Contact our support team within 30 days of the transaction</li>
                    <li>Provide your transaction ID and reason for the refund request</li>
                    <li>Allow 5-10 business days for review and processing</li>
                    <li>Approved refunds will be processed to the original payment method</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Partial Refunds</h3>
                  <p className="text-gray-300">
                    In some cases, we may offer partial refunds based on unused service or
                    prorated subscription periods. This is evaluated on a case-by-case basis.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">13. Fraud Prevention Policy</h2>
                  
                  <h3 className="text-lg font-semibold text-white">Fraud Detection</h3>
                  <p className="text-gray-300">
                    We employ various measures to detect and prevent fraudulent activities:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Real-time transaction monitoring</li>
                    <li>Account behavior analysis</li>
                    <li>Payment verification systems</li>
                    <li>IP address and device tracking</li>
                    <li>Machine learning fraud detection algorithms</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Suspicious Activity</h3>
                  <p className="text-gray-300">
                    We may suspend or terminate accounts that exhibit suspicious behavior, including:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Multiple failed payment attempts</li>
                    <li>Unusual usage patterns or high-volume requests</li>
                    <li>Use of stolen payment methods</li>
                    <li>Account sharing or unauthorized access</li>
                    <li>Attempts to circumvent usage limits</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Chargeback Protection</h3>
                  <p className="text-gray-300">
                    We actively monitor and respond to chargebacks. Accounts associated with
                    illegitimate chargebacks may be permanently suspended. We encourage users
                    to contact us directly before initiating chargeback procedures.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">Account Recovery</h3>
                  <p className="text-gray-300">
                    If your account is suspended due to suspected fraud:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Contact our support team immediately</li>
                    <li>Provide verification documents as requested</li>
                    <li>Cooperate with our investigation process</li>
                    <li>Allow 3-5 business days for review</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">Reporting Fraud</h3>
                  <p className="text-gray-300">
                    If you suspect fraudulent activity on your account or unauthorized charges,
                    please contact us immediately at fraud@veymo.ai or through our priority
                    support channel.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">Data Protection</h3>
                  <p className="text-gray-300">
                    All fraud-related investigations are conducted in accordance with our Privacy
                    Policy. Personal information is only used for security purposes and is not
                    shared with third parties except as required by law.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">14. Contact Information</h2>
                  <p className="text-gray-300">
                    For questions about these terms, please contact us at legal@veymo.ai or
                    through our support channels. For fraud-related issues, contact fraud@veymo.ai.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}