import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/authApi';

const SignupPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; username?: string; password?: string }>({});
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setGlobalError(null);
        setIsLoading(true);

        try {
            // Optimized: Signup now returns token and user info directly
            const { access_token, user } = await authApi.signup({ username, password, email });
            
            // Update Store and Navigate
            login(user, access_token);
            navigate('/lobby');
        } catch (err: any) {
            console.error('Signup failed:', err);
            const message = err.response?.data?.message;

            const newFieldErrors: { email?: string; username?: string; password?: string } = {};
            let hasFieldError = false;
            
            // Normalize message to an array of strings
            let messages: string[] = [];
            if (Array.isArray(message)) {
                messages = message;
            } else if (typeof message === 'string') {
                messages = [message];
            }

            messages.forEach((msg: string) => {
                const lowerMsg = msg.toLowerCase();
                if (lowerMsg.includes('email')) {
                    newFieldErrors.email = msg;
                    hasFieldError = true;
                }
                if (lowerMsg.includes('username')) {
                    newFieldErrors.username = msg;
                    hasFieldError = true;
                } 
                if (lowerMsg.includes('password')) {
                    newFieldErrors.password = msg;
                    hasFieldError = true;
                }
            });

            if (hasFieldError) {
                setFieldErrors(newFieldErrors);
            } else {
                setGlobalError(typeof message === 'string' ? message : 'Signup failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
            <h1 className="text-4xl font-bold mb-8">Chess Master</h1>
            <div className="p-8 bg-zinc-800 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6">Sign Up</h2>
                {globalError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                        {globalError}
                    </div>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email" 
                            className={`w-full p-2 rounded bg-zinc-700 border focus:outline-none ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-zinc-600 focus:border-green-500'}`}
                            placeholder="Enter your email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input 
                            type="text" 
                            className={`w-full p-2 rounded bg-zinc-700 border focus:outline-none ${fieldErrors.username ? 'border-red-500 focus:border-red-500' : 'border-zinc-600 focus:border-green-500'}`}
                            placeholder="Choose a username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password" 
                            className={`w-full p-2 rounded bg-zinc-700 border focus:outline-none ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-zinc-600 focus:border-green-500'}`}
                            placeholder="Choose a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-2 rounded font-bold transition-colors ${
                            isLoading 
                                ? 'bg-green-600/50 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-500'
                        }`}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <div className="text-center text-sm text-zinc-400 mt-4">
                         Already have an account? <span className="text-green-400 cursor-pointer" onClick={() => navigate('/login')}>Login</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
