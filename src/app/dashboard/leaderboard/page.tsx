'use client';

import React from 'react';
import LeaderboardPanel from '@/components/gamification/LeaderboardPanel';
import CharacterGallery from '@/components/gamification/CharacterGallery';

export default function LeaderboardPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Ranking de Agentes</h1>
                <p className="text-white/60">Compite con otros usuarios y demuestra el poder de tu flota de agentes.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <LeaderboardPanel />
                </div>
                <div className="space-y-8">
                    <CharacterGallery />
                </div>
            </div>
        </div>
    );
}
