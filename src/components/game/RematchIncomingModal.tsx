import { Trophy } from 'lucide-react';

interface RematchIncomingModalProps {
    rematchIncoming: { requestedBy: number; expiresAt: Date } | null;
    timeLeft: number;
    onAccept: () => void;
    onDecline: () => void;
}

export const RematchIncomingModal = ({ 
    rematchIncoming, 
    timeLeft, 
    onAccept, 
    onDecline 
}: RematchIncomingModalProps) => {
    if (!rematchIncoming) return null;

    return (
        <div className="glass-panel p-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-300 border border-yellow-500/50">
            <Trophy size={48} className="text-yellow-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-center">Opponent wants a Rematch!</h2>
            <p className="text-zinc-400">Time remaining: {timeLeft}s</p>
            <div className="flex gap-4">
                <button 
                    onClick={onAccept}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                >
                    Accept
                </button>
                <button 
                    onClick={onDecline}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                >
                    Decline
                </button>
            </div>
        </div>
    );
};
