import React from 'react';

export const PrivacyPolicy = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>At CoLab Connect, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide, maintain, and improve our services, match you with projects, and communicate with you.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with other users as part of the collaboration features of our platform.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@colabconnect.com.</p>
        </div>
    </div>
);

export const TermsAndConditions = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        <div className="prose">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>Please read these Terms and Conditions carefully before using CoLab Connect.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. User Accounts</h2>
            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Content</h2>
            <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Termination</h2>
            <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.</p>
        </div>
    </div>
);

export const RefundPolicy = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cancellation & Refund Policy</h1>
        <div className="prose">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Premium Subscription</h2>
            <p>CoLab Connect offers a Premium subscription service. Due to the digital nature of our services, we generally do not offer refunds once a subscription has been activated.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Cancellation</h2>
            <p>You may cancel your Premium subscription at any time. Your subscription will remain active until the end of the current billing period.</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Refund Requests</h2>
            <p>If you believe you have been charged in error, please contact our support team within 7 days of the charge. We review refund requests on a case-by-case basis.</p>

            <p className="mt-6">For any billing questions, please contact support@colabconnect.com.</p>
        </div>
    </div>
);

export const ShippingPolicy = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
        <div className="prose">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>CoLab Connect is a digital platform and does not sell physical goods. Therefore, we do not have a shipping policy as no physical products are shipped to users.</p>
            <p>All services and features are delivered digitally through our website and application immediately upon activation.</p>
        </div>
    </div>
);

export const ContactUs = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="prose">
            <p className="mb-6">We'd love to hear from you! Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.</p>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-3">
                    <p><strong>Email:</strong> support@colabconnect.com</p>
                    <p><strong>Address:</strong> 123 Tech Park, Innovation Way, Bangalore, India 560001</p>
                    <p><strong>Phone:</strong> +91 98765 43210</p>
                </div>
            </div>
        </div>
    </div>
);
