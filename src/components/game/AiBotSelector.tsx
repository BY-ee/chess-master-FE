
import React, { useEffect, useState } from 'react';
import { gameApi } from '../../api/gameApi';
import { Trophy, Zap, Cpu } from 'lucide-react';

export interface AiModel {
    id: number;
    name: string;
    description: string;
    rating: number;
    type: 'balanced' | 'aggressive' | 'defensive';
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
                
                // Map API data to ensure types are correct for UI/Engine
                const mappedData = data.map((model: AiModel) => {
                    let type: AiModel['type'] = 'balanced';
                    if (model.rating <= 1000) type = 'defensive';
                    else if (model.rating >= 2000) type = 'aggressive';
                    
                    // If API returns generic 'stockfish' type, override it
                    if (model.type === 'stockfish' as any || !['balanced', 'aggressive', 'defensive'].includes(model.type)) {
                        return { ...model, type };
                    }
                    return model;
                });
                
                setModels(mappedData);
            } catch (error) {
                console.error('Failed to fetch AI models', error);
                
                // Fallback / Seed Data if API fails or is not yet ready (for dev safety)
                setModels([
                    { id: 1, name: "Newbie", description: "Just learned how to move pieces.", rating: 400, type: "balanced", config: { depth: 1 } },
                    { id: 2, name: "Beginner", description: "Makes few mistakes but misses tactics.", rating: 800, type: "defensive", config: { depth: 3 } },
                    { id: 3, name: "Intermediate", description: "Calculating a few moves ahead.", rating: 1200, type: "aggressive", config: { depth: 5 } },
                    { id: 4, name: "Advanced", description: "Strong club player level.", rating: 1600, type: "balanced", config: { depth: 8 } },
                    { id: 5, name: "Expert", description: "Very hard to beat.", rating: 2000, type: "balanced", config: { depth: 12 } },
                    { id: 6, name: "Grandmaster", description: "Near perfect play.", rating: 2400, type: "aggressive", config: { depth: 15 } },
                ]);
                // Only show toast if it was a real error, but for now we might be using fallback intentionally until backend is live
                // toast.error("Using offline bot profiles.");
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
                        className="glass-panel p-6 rounded-xl hover:bg-white/5 cursor-pointer transition-all hover:scale-105 border border-white/5 hover:border-green-500/50 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-zinc-800 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                {model.rating < 1000 ? <Zap size={24} className="text-yellow-400" /> :
                                 model.rating < 1800 ? <Cpu size={24} className="text-blue-400" /> :
                                 <Trophy size={24} className="text-purple-400" />}
                            </div>
                            <span className="font-mono text-xl font-bold text-zinc-300 group-hover:text-white">
                                {model.rating}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">{model.name}</h3>
                        <p className="text-zinc-400 text-sm mb-4 min-h-[40px]">{model.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <span className={`text-xs px-2 py-1 rounded-full border ${
                                model.type === 'aggressive' ? 'border-red-500/30 text-red-400' :
                                model.type === 'defensive' ? 'border-blue-500/30 text-blue-400' :
                                'border-green-500/30 text-green-400'
                            }`}>
                                {model.type.toUpperCase()}
                            </span>
                            <button className="text-sm font-semibold text-green-400 group-hover:text-green-300">
                                Play Now →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiBotSelector;
