import React from 'react';

const PolicyLayout = ({ title, children, lastUpdated }) => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-dark-surface rounded-2xl shadow-xl overflow-hidden border border-white/10 p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">{title}</h1>
            <div className="prose prose-invert max-w-none">
                {lastUpdated && <p className="mb-4 text-gray-400">Last updated: {lastUpdated}</p>}
                {children}
            </div>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <PolicyLayout title="Privacy Policy" lastUpdated={new Date().toLocaleDateString()}>
        <p className="text-gray-300">At CoLab Connect, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">1. Information We Collect</h2>
        <p className="text-gray-300">We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">2. How We Use Your Information</h2>
        <p className="text-gray-300">We use your information to provide, maintain, and improve our services, match you with projects, and communicate with you.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">3. Information Sharing</h2>
        <p className="text-gray-300">We do not sell your personal information. We may share your information with other users as part of the collaboration features of our platform.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">4. Contact Us</h2>
        <p className="text-gray-300">If you have any questions about this Privacy Policy, please contact us at support@colabconnect.com.</p>
    </PolicyLayout>
);

export const TermsAndConditions = () => (
    <PolicyLayout title="Terms and Conditions" lastUpdated={new Date().toLocaleDateString()}>
        <p className="text-gray-300">Please read these Terms and Conditions carefully before using CoLab Connect.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">1. Acceptance of Terms</h2>
        <p className="text-gray-300">By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">2. User Accounts</h2>
        <p className="text-gray-300">When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">3. Content</h2>
        <p className="text-gray-300">Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">4. Termination</h2>
        <p className="text-gray-300">We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.</p>
    </PolicyLayout>
);

export const RefundPolicy = () => (
    <PolicyLayout title="Cancellation & Refund Policy" lastUpdated={new Date().toLocaleDateString()}>
        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">1. Premium Subscription</h2>
        <p className="text-gray-300">CoLab Connect offers a Premium subscription service. Due to the digital nature of our services, we generally do not offer refunds once a subscription has been activated.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">2. Cancellation</h2>
        <p className="text-gray-300">You may cancel your Premium subscription at any time. Your subscription will remain active until the end of the current billing period.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3 text-white">3. Refund Requests</h2>
        <p className="text-gray-300">If you believe you have been charged in error, please contact our support team within 7 days of the charge. We review refund requests on a case-by-case basis.</p>

        <p className="mt-6 text-gray-300">For any billing questions, please contact support@colabconnect.com.</p>
    </PolicyLayout>
);

export const ShippingPolicy = () => (
    <PolicyLayout title="Shipping Policy" lastUpdated={new Date().toLocaleDateString()}>
        <p className="text-gray-300">CoLab Connect is a digital platform and does not sell physical goods. Therefore, we do not have a shipping policy as no physical products are shipped to users.</p>
        <p className="mt-4 text-gray-300">All services and features are delivered digitally through our website and application immediately upon activation.</p>
    </PolicyLayout>
);

export const ContactUs = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-dark-surface rounded-2xl shadow-xl overflow-hidden border border-white/10 p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">Contact Us</h1>
            <div className="prose prose-invert max-w-none">
                <p className="mb-6 text-gray-300">We'd love to hear from you! Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.</p>

                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-white">Get in Touch</h2>
                    <div className="space-y-3 text-gray-300">
                        <p><strong>Email:</strong> support@colabconnect.com</p>
                        <p><strong>Address:</strong> 123 Tech Park, Innovation Way, Bangalore, India 560001</p>
                        <p><strong>Phone:</strong> +91 98765 43210</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
