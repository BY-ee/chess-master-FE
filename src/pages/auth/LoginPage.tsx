import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/authApi';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const token = await authApi.login({ username, password });
            localStorage.setItem('token', token); // Ensure token is available for getMe()
            const user = await authApi.getMe();
            login({ id: user.id, username: user.username }, token);
            navigate('/lobby');
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
            <h1 className="text-4xl font-bold mb-8">Chess Master</h1>
            <div className="p-8 bg-zinc-800 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6">Login</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                        {error}
                    </div>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input 
                            type="text" 
                            className="w-full p-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-green-500" 
                            placeholder="Username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-green-500" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
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
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <div className="text-center text-sm text-zinc-400 mt-4">
                         Don't have an account? <span className="text-green-400 cursor-pointer" onClick={() => navigate('/signup')}>Register</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
