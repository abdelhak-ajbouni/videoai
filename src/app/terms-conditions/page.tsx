import { AppLayout } from "@/components/layouts/app-layout";

export default function TermsConditionsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
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
                    By accessing and using VideoAI services, you accept and agree to be bound by the
                    terms and provision of this agreement. If you do not agree to abide by these terms,
                    please do not use this service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
                  <p className="text-gray-300">
                    VideoAI provides AI-powered video generation services. We reserve the right to
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
                    as outlined in our refund policy. Subscription fees are billed in advance and
                    are non-refundable.
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
                    VideoAI shall not be liable for any indirect, incidental, special, consequential,
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
                  <h2 className="text-xl font-semibold text-white">12. Contact Information</h2>
                  <p className="text-gray-300">
                    For questions about these terms, please contact us at legal@videoai.com or
                    through our support channels.
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