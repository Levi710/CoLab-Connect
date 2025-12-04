import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';

export default function Login() {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        if (isLogin || !username) {
            setUsernameAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingUsername(true);
            try {
                const res = await api.auth.checkUsername(username);
                setUsernameAvailable(res.available);
            } catch (err) {
                console.error(err);
                setUsernameAvailable(null);
            } finally {
                setCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin) {
            // Password Complexity Validation
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
                const msg = 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.';
                setError(msg);
                addToast(msg, 'error');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            if (isLogin) {
                await login(email, password);
                addToast('Welcome back!', 'success');
            } else {
                await register(username, email, password);
                addToast('Account created successfully!', 'success');
            }
            navigate('/');
        } catch (err) {
            let errorMessage = err.response?.data?.error || 'Failed to authenticate. Please check your credentials.';

            if (errorMessage === 'User already exists') {
                errorMessage = 'This email already exists.';
            } else if (errorMessage === 'Username is already taken') {
                errorMessage = 'This username is already taken.';
            }

            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-dark py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-dark-surface p-8 rounded-xl shadow-2xl border border-white/5">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-medium text-primary hover:text-primary-hover focus:outline-none transition-colors"
                        >
                            {isLogin ? 'create a new account' : 'sign in to existing account'}
                        </button>
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-400">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {!isLogin && (
                            <div className="relative">
                                <label htmlFor="username" className="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white bg-dark rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${usernameAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${usernameAvailable === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`}
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-20">
                                    {checkingUsername && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                                    {!checkingUsername && usernameAvailable === true && <Check className="h-5 w-5 text-green-500" />}
                                    {!checkingUsername && usernameAvailable === false && <X className="h-5 w-5 text-red-500" />}
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white bg-dark ${isLogin ? 'rounded-t-md' : ''} focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white bg-dark rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm pr-10"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 text-gray-400 hover:text-white"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex items-center justify-end">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            disabled={isSubmitting}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isSubmitting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors shadow-lg shadow-primary/20`}
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {isSubmitting ? <Loader2 className="h-5 w-5 text-white/70 animate-spin" /> : (isLogin ? <LogIn className="h-5 w-5 text-white/70 group-hover:text-white" aria-hidden="true" /> : <UserPlus className="h-5 w-5 text-white/70 group-hover:text-white" aria-hidden="true" />)}
                            </span>
                            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
