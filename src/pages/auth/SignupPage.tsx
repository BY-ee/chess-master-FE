import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/authApi';

const SignupPage = () => {
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
            // LoginRequest 타입 재사용 (username, password)
            const data = await authApi.signup({ username, password });
            // 회원가입 성공 시 바로 로그인 처리까지 진행
            login({ id: data.id, username: data.username }, data.accessToken);
            navigate('/lobby');
        } catch (err: any) {
            console.error('Signup failed:', err);
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
            <h1 className="text-4xl font-bold mb-8">Chess Master</h1>
            <div className="p-8 bg-zinc-800 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6">Sign Up</h2>
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
                            placeholder="Choose a username" 
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
                            placeholder="Choose a password"
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
