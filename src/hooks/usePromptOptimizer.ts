import { useState } from 'react';

interface UsePromptOptimizerOptions {
    onSuccess: (prompt: string) => void;
    onError?: (msg: string) => void;
}

export function usePromptOptimizer({ onSuccess, onError }: UsePromptOptimizerOptions) {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizerInput, setOptimizerInput] = useState('');
    const [showOptimizerInput, setShowOptimizerInput] = useState(false);

    const handleOptimize = async (name: string, role: string) => {
        if (!optimizerInput.trim()) return;

        setIsOptimizing(true);
        try {
            const res = await fetch('/api/agents/optimize-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, description: optimizerInput }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al optimizar');

            onSuccess(data.prompt);
            setShowOptimizerInput(false);
            setOptimizerInput('');
        } catch (err: any) {
            onError?.(err.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    return {
        isOptimizing,
        optimizerInput,
        setOptimizerInput,
        showOptimizerInput,
        setShowOptimizerInput,
        handleOptimize,
    };
}
