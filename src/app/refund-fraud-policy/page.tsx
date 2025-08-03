import { AppLayout } from "@/components/layouts/app-layout";

export default function RefundFraudPolicyPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Refund & Fraud Policy</h1>

            <div className="prose prose-invert max-w-none">
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800/50 space-y-6">
                <p className="text-gray-300 text-sm mb-6">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Refund Policy</h2>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">1. Credit Purchases</h3>
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
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">2. Subscription Refunds</h3>
                  <p className="text-gray-300">
                    Subscription fees are billed in advance and are generally non-refundable.
                    Exceptions include:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Cancellation within 24 hours of initial subscription</li>
                    <li>Service unavailability for more than 72 consecutive hours</li>
                    <li>Billing errors or unauthorized charges</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">3. Refund Process</h3>
                  <p className="text-gray-300">
                    To request a refund:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Contact our support team within 30 days of the transaction</li>
                    <li>Provide your transaction ID and reason for the refund request</li>
                    <li>Allow 5-10 business days for review and processing</li>
                    <li>Approved refunds will be processed to the original payment method</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">4. Partial Refunds</h3>
                  <p className="text-gray-300">
                    In some cases, we may offer partial refunds based on unused service or
                    prorated subscription periods. This is evaluated on a case-by-case basis.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Fraud Prevention Policy</h2>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">5. Fraud Detection</h3>
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
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">6. Suspicious Activity</h3>
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
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">7. Chargeback Protection</h3>
                  <p className="text-gray-300">
                    We actively monitor and respond to chargebacks. Accounts associated with
                    illegitimate chargebacks may be permanently suspended. We encourage users
                    to contact us directly before initiating chargeback procedures.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">8. Account Recovery</h3>
                  <p className="text-gray-300">
                    If your account is suspended due to suspected fraud:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Contact our support team immediately</li>
                    <li>Provide verification documents as requested</li>
                    <li>Cooperate with our investigation process</li>
                    <li>Allow 3-5 business days for review</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">9. Reporting Fraud</h3>
                  <p className="text-gray-300">
                    If you suspect fraudulent activity on your account or unauthorized charges,
                    please contact us immediately at fraud@videoai.com or through our priority
                    support channel.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">10. Data Protection</h3>
                  <p className="text-gray-300">
                    All fraud-related investigations are conducted in accordance with our Privacy
                    Policy. Personal information is only used for security purposes and is not
                    shared with third parties except as required by law.
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