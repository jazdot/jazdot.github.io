import { useState, useEffect, Suspense, lazy } from 'react';
import { m } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Gauge, Wrench, TerminalSquare, Activity, Network, RadioTower, BrainCircuit } from 'lucide-react';
import ToolModal from '../components/ToolModal';
import Loader from '../components/Loader';
import SEO from '../components/SEO';

const SpeedTestTool = lazy(() => import('../tools/SpeedTestTool'));
const TerminalTool = lazy(() => import('../tools/TerminalTool'));
const InfraHealthTool = lazy(() => import('../tools/InfraHealthTool'));
const TopologyTool = lazy(() => import('../tools/TopologyTool'));
const PingTraceTool = lazy(() => import('../tools/PingTraceTool'));
const MLOpsPipelineTool = lazy(() => import('../tools/MLOpsPipelineTool'));

export default function Tools({ setGlowColor }: { setGlowColor: (color: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as any).openTool) {
      setActiveTool((location.state as any).openTool);
      // Clear navigation state so a reload doesn't force re-opening
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div 
      className="gpu-layer"
      style={{ position: 'relative', zIndex: 10, padding: '140px 5vw 10vh', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}
    >
      <SEO 
        title="Tools | Muhammed Riswan M. P." 
        description="Explore custom networking and productivity tools built by Muhammed Riswan M. P., including Network Speed Test and CAT Maester."
        path="#/tools"
      />
      <h2 style={{ fontSize: '2.5rem', margin: '0 0 2.5rem 0', fontWeight: 700, letterSpacing: '-0.02em', position: 'relative', display: 'inline-block' }}>
        Explore Tools
        <span style={{ position: 'absolute', bottom: '-8px', left: 0, width: '60px', height: '4px', background: 'var(--accent)', borderRadius: '2px' }}></span>
      </h2>

      {/* Tools Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
        
        {/* Speed Test Tool Card */}
        <m.div
          onClick={() => setActiveTool('speedTest')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
            setGlowColor('rgba(56, 189, 248, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#38bdf8', padding: '0.75rem', borderRadius: '12px' }}><Gauge size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Network Speed Test</h2>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>Measure your download speed with a quick and simple test.</p>
        </m.div>

        {/* Cat Maester Tool Card */}
        <m.div 
          onClick={() => window.open('https://jazdot.github.io/cat-maester', '_blank')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(120, 119, 198, 0.5)';
            setGlowColor('rgba(120, 119, 198, 0.5)'); 
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)'); 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#7877c6', padding: '0.75rem', borderRadius: '12px' }}><GraduationCap size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>CAT Maester</h2>
            <span className="ml-auto px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">New</span>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>Final step to you favourite Business school journey. Master the concepts. Crush the mock. Own the CAT.</p>
        </m.div>

        {/* Terminal Tool Card */}
        <m.div
          onClick={() => setActiveTool('terminal')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
            setGlowColor('rgba(34, 197, 94, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#22c55e', padding: '0.75rem', borderRadius: '12px' }}><TerminalSquare size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Terminal</h2>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>An interactive command-line interface to explore my skills and projects.</p>
        </m.div>

        {/* Infra Health Tool Card */}
        <m.div
          onClick={() => setActiveTool('infraHealth')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'; // Purple-500
            setGlowColor('rgba(168, 85, 247, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#a855f7', padding: '0.75rem', borderRadius: '12px' }}><Activity size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>System Health</h2>
            <span className="ml-auto px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-sm">Live</span>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>View simulated real-time telemetry and health metrics of my core network infrastructure.</p>
        </m.div>

        {/* Topology Tool Card */}
        <m.div
          onClick={() => setActiveTool('topology')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)'; // orange-500
            setGlowColor('rgba(249, 115, 22, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#f97316', padding: '0.75rem', borderRadius: '12px' }}><Network size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Network Topology</h2>
            <span className="ml-auto px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-sm">Beta</span>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>Interactive visualization of an O-RAN 5G deployment with a UAV Mesh network.</p>
        </m.div>

        {/* Ping / Traceroute Tool Card */}
        <m.div
          onClick={() => setActiveTool('pingTrace')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)'; // pink-500
            setGlowColor('rgba(236, 72, 153, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#ec4899', padding: '0.75rem', borderRadius: '12px' }}><RadioTower size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Ping & Trace</h2>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>Simulate Ping and Traceroute operations to test network reachability and path.</p>
        </m.div>

        {/* MLOps Pipeline Tool Card */}
        <m.div
          onClick={() => setActiveTool('mlops')}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'; // blue-500
            setGlowColor('rgba(59, 130, 246, 0.25)');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            setGlowColor('rgba(120, 119, 198, 0.15)');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}><BrainCircuit size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>MLOps Pipeline</h2>
            <span className="ml-auto px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">Updated</span>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>Visualize an automated end-to-end Machine Learning deployment pipeline.</p>
        </m.div>

        {/* Placeholder for future tools */}
        <m.div whileHover={{ y: -8, scale: 1.02 }} style={{ background: 'var(--card-bg)', border: '1px dashed var(--card-border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
          <Wrench size={32} color="#888" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#888' }}>More tools incoming...</h2>
        </m.div>
      </div>

      <ToolModal
        isOpen={activeTool !== null}
        onClose={() => setActiveTool(null)}
        title={activeTool === 'speedTest' ? 'Network Speed Test' : activeTool === 'terminal' ? 'Terminal' : activeTool === 'infraHealth' ? 'System Health Dashboard' : activeTool === 'topology' ? 'Interactive Network Topology' : activeTool === 'pingTrace' ? 'Ping & Traceroute Simulator' : activeTool === 'mlops' ? 'MLOps Pipeline Visualizer' : ''}
      >
        <Suspense fallback={<Loader text="Loading tool..." className="p-8 min-h-[30vh]" />}>
          {activeTool === 'speedTest' && <SpeedTestTool />}
          {activeTool === 'terminal' && (
            <TerminalTool
              onCommand={(cmd: string) => {
                if (cmd === 'cat-maester' || cmd === 'run cat') {
                  setActiveTool(null);
                  window.open('https://jazdot.github.io/cat-maester', '_blank');
                }
              }} 
            />
          )}
          {activeTool === 'infraHealth' && <InfraHealthTool />}
          {activeTool === 'topology' && <TopologyTool />}
          {activeTool === 'pingTrace' && <PingTraceTool />}
          {activeTool === 'mlops' && <MLOpsPipelineTool />}
        </Suspense>
      </ToolModal>
    </div>
  );
}