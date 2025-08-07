import { AppLayout } from "@/components/layouts/app-layout";

export default function PrivacyPolicyPage() {
  return (
    <AppLayout>
      <div className=" bg-gray-950">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

            <div className="prose prose-invert max-w-none">
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800/50 space-y-6">
                <p className="text-gray-300 text-sm mb-6">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
                  <p className="text-gray-300">
                    We collect information you provide directly to us, such as when you create an account,
                    use our services, or contact us for support. This may include your name, email address,
                    and payment information.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
                  <p className="text-gray-300">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices and support messages</li>
                    <li>Communicate with you about products, services, and events</li>
                    <li>Monitor and analyze trends and usage</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">3. Information Sharing</h2>
                  <p className="text-gray-300">
                    We do not sell, trade, or otherwise transfer your personal information to third parties
                    without your consent, except as described in this policy. We may share information with
                    trusted service providers who assist us in operating our website and conducting our business.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
                  <p className="text-gray-300">
                    We implement appropriate security measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction. However, no method of
                    transmission over the internet is 100% secure.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">5. Cookies and Tracking</h2>
                  <p className="text-gray-300">
                    We use cookies and similar tracking technologies to enhance your experience on our
                    platform. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
                  <p className="text-gray-300">
                    You have the right to access, update, or delete your personal information. You may
                    also opt out of certain communications from us. Contact us to exercise these rights.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">7. Children&apos;s Privacy</h2>
                  <p className="text-gray-300">
                    Our services are not intended for children under 13. We do not knowingly collect
                    personal information from children under 13.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">8. Changes to This Policy</h2>
                  <p className="text-gray-300">
                    We may update this privacy policy from time to time. We will notify you of any
                    changes by posting the new policy on this page and updating the &quot;last updated&quot; date.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">9. Contact Us</h2>
                  <p className="text-gray-300">
                    If you have any questions about this privacy policy, please contact us at
                    privacy@veymo.ai or through our support channels.
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