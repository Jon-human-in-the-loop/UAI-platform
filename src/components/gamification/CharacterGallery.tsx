'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Star } from 'lucide-react';

interface Character {
    id: string | number;
    name: string;
    role: string;
    emoji?: string;
    rarity: string;
    bonusType: string;
    bonusValue: number;
    unlockedAtLevel: number;
    unlocked: boolean;
}

export default function CharacterGallery() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification/characters')
            .then(res => res.json())
            .then(data => {
                setCharacters(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading characters:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Galería de Personajes</h3>
                <span className="text-[10px] text-white/40 font-mono">COLECCIONABLES</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-3 py-10 text-center text-white/20 animate-pulse">Invocando avatares...</div>
                ) : characters.map((char: any) => (
                    <motion.div 
                        key={char.id}
                        whileHover={char.unlocked ? { scale: 1.05, y: -5 } : {}}
                        className={`relative p-4 rounded-2xl border transition-all ${
                            char.unlocked 
                            ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-xl' 
                            : 'bg-black/40 border-white/5 opacity-50 grayscale'
                        }`}
                    >
                        {!char.unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="bg-black/60 backdrop-blur-sm p-2 rounded-full border border-white/10">
                                    <Lock className="w-4 h-4 text-white/40" />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-white/5 border border-white/10 ${char.unlocked ? 'shadow-[0_0_20px_rgba(255,255,255,0.1)]' : ''}`}>
                                {char.id === 'sentinel' ? '🛡️' : char.id === 'architect' ? '🏗️' : '🐲'}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">{char.name}</h4>
                                <p className="text-[9px] text-white/40 uppercase">{char.role}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className={`w-3 h-3 ${char.rarity === 'LEGENDARY' ? 'text-yellow-500' : char.rarity === 'EPIC' ? 'text-purple-500' : 'text-blue-400'}`} />
                                <span className="text-[8px] font-bold text-white/60 uppercase">{char.rarity}</span>
                            </div>
                            {char.unlocked ? (
                                <div className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                    +{char.bonusValue}% {char.bonusType}
                                </div>
                            ) : (
                                <div className="text-[9px] font-bold text-white/20">
                                    Nivel {char.unlockedAtLevel}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
