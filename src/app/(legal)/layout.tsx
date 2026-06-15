import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowLeft } from 'lucide-react';

const LEGAL_NAV = [
    { href: '/terms', label: 'Términos' },
    { href: '/privacy', label: 'Privacidad' },
    { href: '/cookies', label: 'Cookies' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full h-20 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-6 lg:px-20">
                <Link href="/" className="flex items-center gap-3 group">
                    <Cpu className="text-accent w-7 h-7" />
                    <span className="text-xl font-bold tracking-tighter gold-text-gradient">UAI PLATFORM</span>
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver
                </Link>
            </header>

            <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
                {/* Navegación entre documentos legales */}
                <nav className="flex gap-6 mb-10 border-b border-white/5 pb-4">
                    {LEGAL_NAV.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-[11px] font-bold text-white/40 hover:text-accent transition-colors uppercase tracking-[0.15em]"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {children}
            </main>

            {/* Footer mínimo */}
            <footer className="border-t border-white/5 py-10 px-6 lg:px-20 text-center">
                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                    UAI Platform © 2026 · Todos los derechos reservados
                </p>
            </footer>
        </div>
    );
}
