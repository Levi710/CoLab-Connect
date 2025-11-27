import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-center text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} CoLab Connect. All rights reserved.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center space-x-6">
                        <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-gray-900">
                            Privacy Policy
                        </Link>
                        <Link to="/terms-and-conditions" className="text-sm text-gray-500 hover:text-gray-900">
                            Terms & Conditions
                        </Link>
                        <Link to="/refund-policy" className="text-sm text-gray-500 hover:text-gray-900">
                            Refund Policy
                        </Link>
                        <Link to="/shipping-policy" className="text-sm text-gray-500 hover:text-gray-900">
                            Shipping Policy
                        </Link>
                        <Link to="/contact-us" className="text-sm text-gray-500 hover:text-gray-900">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
