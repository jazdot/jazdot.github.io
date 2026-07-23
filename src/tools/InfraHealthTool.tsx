import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Server, Activity, Cpu, Globe, Wifi } from 'lucide-react';

const MetricCard = ({ title, icon: Icon, value, unit, progress, status = "good" }: any) => {
  const statusColor = status === "good" ? "bg-emerald-500" : status === "warning" ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex justify-between items-start opacity-70">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon size={16} />
          {title}
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse shadow-[0_0_8px_currentColor]`}></div>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
        <span className="text-xs font-mono opacity-60">{unit}</span>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-1">
          <m.div 
            className={`h-full ${statusColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.8 }}
          />
        </div>
      )}
    </div>
  );
};

export default function InfraHealthTool() {
  const [latency, setLatency] = useState(14);
  const [cpu, setCpu] = useState(42);
  const [connections, setConnections] = useState(1204);
  const [bandwidthDown, setBandwidthDown] = useState(1.2);
  const [bandwidthUp, setBandwidthUp] = useState(0.8);

  // Simulate live data fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(80, Math.round(prev + (Math.random() * 12 - 6)))));
      setCpu(prev => Math.max(5, Math.min(95, Math.round(prev + (Math.random() * 14 - 7)))));
      setConnections(prev => Math.max(1000, Math.min(2000, Math.round(prev + (Math.random() * 30 - 15)))));
      setBandwidthDown(prev => Math.max(0.5, Math.min(2.5, prev + (Math.random() * 0.2 - 0.1))));
      setBandwidthUp(prev => Math.max(0.2, Math.min(1.5, prev + (Math.random() * 0.1 - 0.05))));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (val: number, warnThresh: number, errThresh: number) => 
    val > errThresh ? "error" : val > warnThresh ? "warning" : "good";

  return (
    <div className="flex flex-col gap-6 w-full text-slate-900 dark:text-white">
      {/* Global Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Server size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Global Network Status</h3>
            <p className="text-xs opacity-80">All core routing systems operational</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 mb-0.5">System Uptime</div>
          <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">99.999% • 45d 12h</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard 
          title="Core Edge CPU" 
          icon={Cpu} 
          value={cpu} 
          unit="%" 
          progress={cpu} 
          status={getStatus(cpu, 70, 90)} 
        />
        <MetricCard 
          title="Network Latency" 
          icon={Activity} 
          value={latency} 
          unit="ms" 
          progress={(latency / 100) * 100} 
          status={getStatus(latency, 40, 75)} 
        />
        <MetricCard 
          title="Active Tunnels" 
          icon={Globe} 
          value={connections.toLocaleString()} 
          unit="peers" 
          progress={(connections / 2000) * 100} 
        />
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium opacity-70 mb-1">
            <Wifi size={16} />
            Bandwidth (VPC)
          </div>
          <div className="flex justify-between items-end">
            <div><span className="text-xs opacity-60 block">IN</span><span className="font-mono font-bold">{bandwidthDown.toFixed(2)}</span> <span className="text-xs opacity-60 font-mono">Gbps</span></div>
            <div className="text-right"><span className="text-xs opacity-60 block">OUT</span><span className="font-mono font-bold">{bandwidthUp.toFixed(2)}</span> <span className="text-xs opacity-60 font-mono">Gbps</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}