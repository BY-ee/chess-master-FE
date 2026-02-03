
import React, { useEffect, useState } from 'react';
import { gameApi } from '../../api/gameApi';
import { Trophy, Zap, Cpu } from 'lucide-react';

export interface AiModel {
    id: number;
    name: string;
    description: string;
    rating: number;
    type: 'balanced' | 'aggressive' | 'defensive';
    imageUrl: string;
    config: { depth: number; [key: string]: any };
}

interface AiBotSelectorProps {
    onSelect: (model: AiModel) => void;
}

const AiBotSelector: React.FC<AiBotSelectorProps> = ({ onSelect }) => {
    const [models, setModels] = useState<AiModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                // In a real scenario, we fetch this from API
                // Assuming gameApi.getAiModels() is implemented and returns AiModel[]
                const data = await gameApi.getAiModels();
                setModels(data);
            } catch (error) {
                console.error('Failed to fetch AI models', error);
                
                // Fallback / Seed Data if API fails or is not yet ready (for dev safety)
                setModels([
                    { id: 1, name: "Newbie", description: "Just learned how to move pieces.", rating: 400, type: "balanced", imageUrl: "", config: { depth: 1 } },
                    { id: 2, name: "Beginner", description: "Makes few mistakes but misses tactics.", rating: 800, type: "defensive", imageUrl: "", config: { depth: 3 } },
                    { id: 3, name: "Intermediate", description: "Calculating a few moves ahead.", rating: 1200, type: "aggressive", imageUrl: "", config: { depth: 5 } },
                    { id: 4, name: "Advanced", description: "Strong club player level.", rating: 1600, type: "balanced", imageUrl: "", config: { depth: 8 } },
                    { id: 5, name: "Expert", description: "Very hard to beat.", rating: 2000, type: "balanced", imageUrl: "", config: { depth: 12 } },
                    { id: 6, name: "Grandmaster", description: "Near perfect play.", rating: 2400, type: "aggressive", imageUrl: "", config: { depth: 15 } },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-zinc-400">Loading AI Opponents...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Choose Your Opponent
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model) => (
                    <div 
                        key={model.id}
                        onClick={() => onSelect(model)}
                        className="glass-panel p-6 rounded-xl hover:bg-white/5 cursor-pointer transition-all hover:scale-105 border border-white/5 hover:border-green-500/50 group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            {/* Image Container with Fallback Icon behind it */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shadow-lg group-hover:ring-2 ring-green-500/50 transition-all">
                                {/* Fallback Icon (Visible if image fails or loading) */}
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 group-hover:text-zinc-500">
                                    {model.rating < 1000 ? <Zap size={32} className="text-yellow-500/50" /> :
                                     model.rating < 1800 ? <Cpu size={32} className="text-blue-500/50" /> :
                                     <Trophy size={32} className="text-purple-500/50" />}
                                </div>
                                
                                {/* Character Image */}
                                <img 
                                    src={model.imageUrl} 
                                    alt={model.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'; // Hide image on error to show fallback
                                    }}
                                />
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="font-mono text-2xl font-bold text-zinc-300 group-hover:text-white">
                                    {model.rating}
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 border ${
                                    model.type === 'aggressive' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                    model.type === 'defensive' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                    'border-green-500/30 text-green-400 bg-green-500/10'
                                }`}>
                                    {model.type}
                                </span>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors truncate pr-2">{model.name}</h3>
                        <p className="text-zinc-400 text-sm mb-4 min-h-[40px] line-clamp-2">{model.description}</p>
                        
                        <div className="flex items-center justify-end mt-auto pt-4 border-t border-white/5">
                            <button className="text-sm font-semibold text-green-400 group-hover:text-green-300 flex items-center gap-1">
                                Play Match <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiBotSelector;
