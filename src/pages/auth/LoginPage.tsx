const LoginPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
            <h1 className="text-4xl font-bold mb-8">Chess Master</h1>
            <div className="p-8 bg-zinc-800 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6">Login</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input type="text" className="w-full p-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-green-500" placeholder="Username" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" className="w-full p-2 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-green-500" placeholder="Password" />
                    </div>
                    <button type="button" className="w-full py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition-colors">
                        Sign In
                    </button>
                    <div className="text-center text-sm text-zinc-400 mt-4">
                         Don't have an account? <span className="text-green-400 cursor-pointer">Register</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
