import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './context/ToastContext';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inbox = lazy(() => import('./pages/Inbox'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const Chat = lazy(() => import('./pages/Chat'));
const Policies = lazy(() => import('./pages/Policies')); // Assuming Policies exports components, might need adjustment if named exports

// Helper to lazy load named exports from Policies
const PrivacyPolicy = lazy(() => import('./pages/Policies').then(module => ({ default: module.PrivacyPolicy })));
const TermsAndConditions = lazy(() => import('./pages/Policies').then(module => ({ default: module.TermsAndConditions })));
const RefundPolicy = lazy(() => import('./pages/Policies').then(module => ({ default: module.RefundPolicy })));
const ContactUs = lazy(() => import('./pages/Policies').then(module => ({ default: module.ContactUs })));

const About = lazy(() => import('./pages/About'));
const Creators = lazy(() => import('./pages/Creators'));

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/creators" element={<Creators />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/chat/:requestId?" element={<Chat />} />

              {/* Policy Routes */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/contact-us" element={<ContactUs />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ToastProvider>
  );
}

export default App;
