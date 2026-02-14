import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, Zap, Map, Terminal, Trophy } from 'lucide-react';

interface Step {
    title: string;
    description: string;
    icon: React.ElementType;
    target?: string; // ID of the element to highlight (optional for future enhancements)
}

const steps: Step[] = [
    {
        title: "Bienvenido a UAI Platform",
        description: "Tu centro de comando para orquestar inteligencia artificial. Aquí podrás conectar múltiples modelos y agentes para ejecutar tareas complejas automáticamente.",
        icon: Zap
    },
    {
        title: "Lanza tu Misión",
        description: "Escribe cualquier instrucción en la barra inferior. Desde 'Investiga este mercado' hasta 'Genera un reporte de ventas'. Los agentes entenderán tu intención.",
        icon: Map
    },
    {
        title: "Visualiza el Pensamiento",
        description: "Observa en tiempo real cómo los agentes PLANIFICAN, EJECUTAN y VERIFICAN tu tarea en el editor de flujo y la consola de logs.",
        icon: Terminal
    },
    {
        title: "Sube de Nivel",
        description: "Cada misión exitosa te otorga XP. Mantén tu racha diaria, desbloquea logros y compite por el rango Arcano.",
        icon: Trophy
    }
];

export default function OnboardingTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('uai_onboarding_completed');
        if (!hasSeenTutorial) {
            // Small delay to allow dashboard animation to settle
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('uai_onboarding_completed', 'true');
    };

    if (!isOpen) return null;

    const CurrentIcon = steps[currentStep].icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <CurrentIcon className="w-32 h-32 text-white stroke-1" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                        <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">

                            {/* Icon Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-xl"
                            >
                                <CurrentIcon className="w-8 h-8 text-accent" />
                            </motion.div>

                            {/* Content */}
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">
                                    {steps[currentStep].title}
                                </h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    {steps[currentStep].description}
                                </p>
                            </div>

                            {/* Progress Indicators */}
                            <div className="flex gap-2 pt-2">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-accent' : 'w-1.5 bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex w-full gap-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wider"
                                >
                                    Saltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    {currentStep === steps.length - 1 ? (
                                        <>¡Comenzar! <Check className="w-4 h-4" /></>
                                    ) : (
                                        <>Siguiente <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
