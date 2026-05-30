import { useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeStyle = { 
  background: 'var(--card-bg)', 
  color: 'var(--page-text)', 
  border: '1px solid var(--card-border)', 
  borderRadius: '8px', 
  padding: '12px',
  fontWeight: 'bold',
  fontSize: '12px',
  backdropFilter: 'blur(10px)',
};

const initialNodes = [
  { id: '1', position: { x: 250, y: 20 }, data: { label: '5G Core (EPC)' }, type: 'input', style: nodeStyle },
  { id: '2', position: { x: 250, y: 120 }, data: { label: 'O-RAN CU' }, style: nodeStyle },
  { id: '3', position: { x: 100, y: 220 }, data: { label: 'O-RAN DU 1' }, style: nodeStyle },
  { id: '4', position: { x: 400, y: 220 }, data: { label: 'O-RAN DU 2' }, style: nodeStyle },
  { id: '5', position: { x: 40, y: 340 }, data: { label: 'UAV Node A' }, type: 'output', style: nodeStyle },
  { id: '6', position: { x: 160, y: 340 }, data: { label: 'UAV Node B' }, type: 'output', style: nodeStyle },
  { id: '7', position: { x: 340, y: 340 }, data: { label: 'UAV Node C' }, type: 'output', style: nodeStyle },
  { id: '8', position: { x: 460, y: 340 }, data: { label: 'UAV Node D' }, type: 'output', style: nodeStyle },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: 'N2/N3' },
  { id: 'e2-3', source: '2', target: '3', animated: true, label: 'F1-C/U' },
  { id: 'e2-4', source: '2', target: '4', animated: true, label: 'F1-C/U' },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#38bdf8' } },
  { id: 'e3-6', source: '3', target: '6', animated: true, style: { stroke: '#38bdf8' } },
  { id: 'e4-7', source: '4', target: '7', animated: true, style: { stroke: '#38bdf8' } },
  { id: 'e4-8', source: '4', target: '8', animated: true, style: { stroke: '#38bdf8' } },
  // Mesh connections
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { strokeDasharray: '5, 5', stroke: '#a855f7' } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { strokeDasharray: '5, 5', stroke: '#a855f7' } },
  { id: 'e7-8', source: '7', target: '8', animated: true, style: { strokeDasharray: '5, 5', stroke: '#a855f7' } },
];

export default function TopologyTool() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)' }} className="bg-black/5 dark:bg-white/5 relative">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView attributionPosition="bottom-right">
        <Controls className="bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 fill-slate-900 dark:fill-white" />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--card-border)" />
      </ReactFlow>
    </div>
  );
}