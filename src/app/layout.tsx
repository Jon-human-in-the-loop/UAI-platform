import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "UAI - Unified Agentic Intelligence",
    description: "Plataforma de orquestación de agentes de IA de próxima generación",
};

import { Providers } from "@/components/providers";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark">
            <body className={`${inter.className} bg-background text-foreground antialiased`}>
                <Providers>
                    <div className="min-h-screen relative overflow-hidden">
                        {/* Fondo Decorativo Premium */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent rounded-full blur-[100px] opacity-10" />
                        </div>

                        <main className="relative z-10">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
