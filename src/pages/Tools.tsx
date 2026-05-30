import { useState, Suspense, lazy } from 'react';
import { m } from 'framer-motion';
import { Cat, Gauge, Wrench } from 'lucide-react';
import ToolModal from '../components/ToolModal';
import Loader from '../components/Loader';

const SpeedTestTool = lazy(() => import('../tools/SpeedTestTool'));

export default function Tools({ setGlowColor }: { setGlowColor: (color: string) => void }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: 'relative', zIndex: 10, padding: '150px 5vw 10vh', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}
    >
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

        {/* Cat Master Tool Card */}
        <m.div 
          onClick={() => window.open('/cat_master/index.html', '_blank')}
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
            <div style={{ background: '#7877c6', padding: '0.75rem', borderRadius: '12px' }}><Cat size={24} color="#fff" /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>cat_master</h2>
          </div>
          <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>The ultimate feline management toolkit. Access statistics, feeding schedules, and monitoring.</p>
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
        title={activeTool === 'speedTest' ? 'Network Speed Test' : ''}
      >
        <Suspense fallback={<Loader text="Loading tool..." className="p-8 min-h-[30vh]" />}>
          {activeTool === 'speedTest' && <SpeedTestTool />}
        </Suspense>
      </ToolModal>
    </m.div>
  );
}