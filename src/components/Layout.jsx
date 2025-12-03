import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ShootingStars } from './ui/shooting-stars';
import { StarsBackground } from './ui/stars-background';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#0b0f19] bg-grid text-gray-100 font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ShootingStars />
                <StarsBackground />
            </div>
            {/* Content with z-index to sit above background */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                    {children}
                </main>

                <Footer />
            </div>
        </div >
    );
}
