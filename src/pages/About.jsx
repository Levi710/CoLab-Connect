import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Globe, ChevronDown, ChevronUp } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function About() {
    const { currentUser } = useAuth();
    const [openFaq, setOpenFaq] = React.useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "Is CoLab Connect free to use?",
            answer: "Yes! The core features of CoLab Connect are completely free. You can create projects, join teams, and chat with members at no cost. We also offer a Premium plan for advanced features like unlimited project edits and image sharing."
        },
        {
            question: "How do I join a project?",
            answer: "Browse the 'Discovery' page to find projects that interest you. Click on a project to view details, and if you're interested, send a request to join. The project owner will review your request."
        },
        {
            question: "Can I create my own project?",
            answer: "Absolutely! Just click on the '+' icon in the navbar to create a new project. You can specify what roles you're looking for and describe your vision."
        },
        {
            question: "Is my data secure?",
            answer: "We take security seriously. We use industry-standard encryption for passwords and secure practices for data storage. Your profile URLs are also randomized for privacy."
        }
    ];

    return (
        <div className="min-h-screen bg-dark text-gray-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-dark-surface border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                        About CoLab Connect
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
                        The ultimate platform for developers, designers, and creators to find teammates, build projects, and turn ideas into reality.
                    </p>
                    <Link to={currentUser ? "/dashboard" : "/register"} className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25">
                        {currentUser ? "Go to Dashboard" : "Start Collaborating"}
                    </Link>
                </div>

                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-20 bg-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            We believe that great things happen when creative minds come together. Our mission is to bridge the gap between ideas and execution by connecting like-minded individuals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-dark-surface border border-white/5 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Connect</h3>
                            <p className="text-gray-400">
                                Find the perfect teammates based on skills, interests, and project goals. No more searching in the dark.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-dark-surface border border-white/5 hover:border-secondary/50 transition-colors group">
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                                <Zap className="w-6 h-6 text-secondary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Build</h3>
                            <p className="text-gray-400">
                                Collaborate in real-time with integrated chat, project management tools, and file sharing.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-dark-surface border border-white/5 hover:border-purple-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                                <Globe className="w-6 h-6 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Share</h3>
                            <p className="text-gray-400">
                                Showcase your projects to the world, get feedback, and build your portfolio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-20 bg-dark-surface border-t border-white/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-white/10 rounded-xl overflow-hidden bg-dark transition-all">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-medium text-white">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-5 h-5 text-primary" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="py-20 bg-dark text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Ready to start your journey?</h2>
                <div className="flex justify-center gap-4">
                    {currentUser ? (
                        <Link to="/dashboard" className="px-8 py-3 rounded-full bg-white text-dark font-bold hover:bg-gray-200 transition-colors">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <Link to="/register" className="px-8 py-3 rounded-full bg-white text-dark font-bold hover:bg-gray-200 transition-colors">
                            Sign Up Now
                        </Link>
                    )}
                    <Link to="/creators" className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors">
                        Meet the Creators
                    </Link>
                </div>
            </div>
        </div>
    );
}
