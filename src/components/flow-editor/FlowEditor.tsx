'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import UaiNode from './CustomNodes';

const nodeTypes = {
    uaiNode: UaiNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'uaiNode',
        position: { x: 50, y: 150 },
        data: { label: 'Analizador (Claude 3.7)' },
    },
    {
        id: '2',
        type: 'uaiNode',
        position: { x: 300, y: 150 },
        data: { label: 'Ejecutor (CrewAI Workforce)' },
    },
    {
        id: '3',
        type: 'uaiNode',
        position: { x: 550, y: 150 },
        data: { label: 'Validador (Auto-Sanación)' },
    },
    {
        id: '4',
        type: 'uaiNode',
        position: { x: 800, y: 150 },
        data: { label: 'Reflexión (Pinecone Memory)' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#D4AF37', strokeWidth: 2 } },
    { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, label: 'Válido' },
    { id: 'e3-1', source: '3', target: '1', animated: true, style: { stroke: '#8B0000', opacity: 0.8, strokeWidth: 2 }, label: 'Re-intento' },
    { id: 'e4-1', source: '4', target: '1', animated: true, style: { stroke: '#10b981', opacity: 0.3, strokeWidth: 2 } },
];

interface FlowEditorProps {
    activeNodeId?: string;
}

export default function FlowEditor({ activeNodeId }: FlowEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Efecto para resaltar el nodo activo
    React.useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                selected: node.id === activeNodeId
            }))
        );
    }, [activeNodeId, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="w-full h-full bg-[#0a0c10]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#1a1c22" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
