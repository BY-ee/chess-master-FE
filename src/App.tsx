import Game from './components/Game';

function App() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center py-10">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Chess Master</h1>
        <p className="text-zinc-400">Challenge the AI in a classic game of strategy</p>
      </header>

      <main className="w-full flex justify-center px-4">
        <Game />
      </main>

      <footer className="mt-12 text-zinc-500 text-sm">
        <p>Built with React, Chess.js & Tailwind</p>
      </footer>
    </div>
  );
}

export default App;
