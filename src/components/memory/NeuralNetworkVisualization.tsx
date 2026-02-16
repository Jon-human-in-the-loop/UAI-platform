'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Brain, Zap, Activity } from 'lucide-react';

interface Node {
    id: string;
    label: string;
    type: 'learning' | 'agent' | 'hub';
    complexity: 'Low' | 'Medium' | 'High' | 'Critical';
    value: number;
}

interface Link {
    source: string;
    target: string;
    strength: number;
}

export default function NeuralNetworkVisualization() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Simular datos de la red neuronal (en producción, vendrían de Pinecone)
    useEffect(() => {
        const mockNodes: Node[] = [
            { id: 'hub-1', label: 'UAI Nucleus', type: 'hub', complexity: 'High', value: 100 },
            { id: 'agent-1', label: 'Lead Estrategia', type: 'agent', complexity: 'High', value: 80 },
            { id: 'agent-2', label: 'Auditor Seguridad', type: 'agent', complexity: 'Critical', value: 75 },
            { id: 'learning-1', label: 'Market Insight', type: 'learning', complexity: 'High', value: 60 },
            { id: 'learning-2', label: 'Vulnerability Fix', type: 'learning', complexity: 'Critical', value: 70 },
            { id: 'learning-3', label: 'Optimization', type: 'learning', complexity: 'Medium', value: 50 },
            { id: 'agent-3', label: 'Investigador', type: 'agent', complexity: 'Medium', value: 65 },
        ];

        const mockLinks: Link[] = [
            { source: 'hub-1', target: 'agent-1', strength: 0.9 },
            { source: 'hub-1', target: 'agent-2', strength: 0.85 },
            { source: 'hub-1', target: 'agent-3', strength: 0.8 },
            { source: 'agent-1', target: 'learning-1', strength: 0.75 },
            { source: 'agent-2', target: 'learning-2', strength: 0.88 },
            { source: 'agent-3', target: 'learning-3', strength: 0.7 },
            { source: 'learning-1', target: 'learning-3', strength: 0.65 },
            { source: 'agent-1', target: 'agent-3', strength: 0.72 },
        ];

        setNodes(mockNodes);
        setLinks(mockLinks);
    }, []);

    // Renderizar la visualización con D3
    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        // Limpiar SVG anterior
        d3.select(svgRef.current).selectAll('*').remove();

        // Crear simulación de fuerzas
        const simulation = d3.forceSimulation(nodes as any)
            .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(50));

        const svg = d3.select(svgRef.current);

        // Crear grupo para zoom
        const g = svg.append('g');

        // Añadir zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Dibujar enlaces
        const link = g.selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', '#ffffff')
            .attr('stroke-opacity', (d: any) => 0.1 + d.strength * 0.4)
            .attr('stroke-width', (d: any) => 1 + d.strength * 3)
            .attr('class', 'neural-link');

        // Dibujar nodos
        const node = g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', (d: any) => {
                if (d.type === 'hub') return 25;
                if (d.type === 'agent') return 20;
                return 15;
            })
            .attr('fill', (d: any) => {
                if (d.type === 'hub') return '#ff006e';
                if (d.type === 'agent') return '#00d9ff';
                return '#9d4edd';
            })
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('class', 'neural-node')
            .style('cursor', 'pointer')
            .on('click', (event, d: any) => {
                setSelectedNode(d);
            })
            .call(d3.drag<any, any>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Añadir etiquetas
        const labels = g.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .attr('fill', '#ffffff')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text((d: any) => d.label.substring(0, 8))
            .style('pointer-events', 'none');

        // Actualizar posiciones en cada tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node
                .attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y);

            labels
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y);
        });

        // Funciones de drag
        function dragstarted(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: any, d: any) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return () => {
            simulation.stop();
        };
    }, [nodes, links]);

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Red Neuronal</h2>
                </div>
                <p className="text-sm text-white/60">
                    Visualización interactiva de la Memoria Colectiva. Haz clic en los nodos para explorar.
                </p>
            </div>

            {/* Visualización */}
            <div className="flex-1 flex gap-4 overflow-hidden p-4">
                <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                    <svg
                        ref={svgRef}
                        className="w-full h-full"
                        style={{ background: '#0a0a0a' }}
                    />
                </div>

                {/* Panel de Detalles */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-80 bg-[#0a0a0a] border border-white/5 rounded-xl p-6 overflow-y-auto custom-scrollbar"
                >
                    {selectedNode ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {selectedNode.type === 'hub' && <Zap className="w-5 h-5 text-accent" />}
                                {selectedNode.type === 'agent' && <Activity className="w-5 h-5 text-blue-400" />}
                                {selectedNode.type === 'learning' && <Brain className="w-5 h-5 text-purple-400" />}
                                <h3 className="text-lg font-bold">{selectedNode.label}</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-white/40 uppercase text-xs font-bold mb-1">Tipo</p>
                                    <p className="capitalize">{selectedNode.type}</p>
                                </div>

                                <div>
                                    <p className="text-white/40 uppercase text-xs font-bold mb-1">Complejidad</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            selectedNode.complexity === 'Critical' ? 'bg-red-500' :
                                            selectedNode.complexity === 'High' ? 'bg-orange-500' :
                                            selectedNode.complexity === 'Medium' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`} />
                                        <span>{selectedNode.complexity}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-white/40 uppercase text-xs font-bold mb-1">Valor de Conocimiento</p>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-accent to-blue-500 h-2 rounded-full"
                                            style={{ width: `${selectedNode.value}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-white/60 mt-1">{selectedNode.value}%</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-white/40 uppercase font-bold mb-2">Conexiones</p>
                                <div className="space-y-1 text-xs">
                                    {links
                                        .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                                        .map((link, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded">
                                                <span>{link.source === selectedNode.id ? link.target : link.source}</span>
                                                <span className="text-accent">{Math.round(link.strength * 100)}%</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Brain className="w-12 h-12 text-white/20 mb-4" />
                            <p className="text-sm text-white/40">Selecciona un nodo para ver detalles</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Leyenda */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-center gap-8 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent" />
                        <span>Hub Central</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400" />
                        <span>Agente</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-400" />
                        <span>Aprendizaje</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
