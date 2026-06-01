import { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import { Play, Square, Download, Upload, Server, ShieldAlert, ShieldCheck, Globe } from 'lucide-react';

type Status = 'idle' | 'testing_down' | 'testing_up' | 'done' | 'error';
type Unit = 'MBps' | 'Mbps';

interface NetworkInfo {
  ip: string;
  carrier: string;
  isVpn: boolean;
}

export default function SpeedTestTool() {
  const [status, setStatus] = useState<Status>('idle');
  const [unit, setUnit] = useState<Unit>('MBps');
  
  const [downSpeedRaw, setDownSpeedRaw] = useState<number | null>(null);
  const [upSpeedRaw, setUpSpeedRaw] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  // Fetch Real IP, Carrier, and Security details
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const res = await fetch('https://ipwho.is/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNetworkInfo({
              ip: data.ip,
              carrier: data.connection.isp || data.connection.org || 'Unknown',
              // API provides boolean flags for vpn, proxy, and tor network usage
              isVpn: data.security.vpn || data.security.proxy || data.security.tor
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch network info", e);
      }
    };
    fetchNetworkInfo();
  }, []);

  // Converts raw Bits per Second into requested unit scale instantly
  const formatSpeed = (bps: number | null) => {
    if (bps === null) return '--';
    if (unit === 'Mbps') return (bps / 1_000_000).toFixed(1);
    return (bps / 8_000_000).toFixed(1); // 1 Byte = 8 bits
  };

  const startTest = async () => {
    setStatus('testing_down');
    setDownSpeedRaw(null);
    setUpSpeedRaw(null);
    setProgress(0);
    abortController.current = new AbortController();

    try {
      // 1. Downlink Test (25MB)
      const dlSize = 25_000_000; 
      const dlUrl = `https://speed.cloudflare.com/__down?bytes=${dlSize}`;
      const dlStart = performance.now();
      
      const dlRes = await fetch(dlUrl, { 
        signal: abortController.current.signal,
        cache: 'no-store'
      });

      if (!dlRes.body) throw new Error("Stream not supported");
      const reader = dlRes.body.getReader();
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        setProgress((received / dlSize) * 50); // Downlink counts for first 50%

        const duration = (performance.now() - dlStart) / 1000;
        if (duration > 0.1) {
          setDownSpeedRaw((received * 8) / duration); // Calculate raw bps
        }
      }

      // 2. Uplink Test (10MB payload)
      setStatus('testing_up');
      const ulSize = 10_000_000;
      const payload = new Uint8Array(ulSize);
      const ulStart = performance.now();
      
      await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        body: payload,
        signal: abortController.current.signal,
        headers: { 'Content-Type': 'application/octet-stream' }
      });
      
      const ulDuration = (performance.now() - ulStart) / 1000;
      setUpSpeedRaw((ulSize * 8) / ulDuration); // Calculate raw bps
      setProgress(100);
      
      setStatus('done');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setStatus('error');
      } else {
        setStatus('idle');
      }
    }
  };

  const stopTest = () => {
    if (abortController.current) abortController.current.abort();
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-900 dark:text-white">
      {/* Controls & Unit Toggle */}
      <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
         <div className="flex items-center gap-3">
           {status === 'idle' || status === 'done' || status === 'error' ? (
             <button onClick={startTest} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 active:scale-95 transition-all shadow-md shadow-sky-500/20">
               <Play size={18} fill="currentColor" /> {status === 'done' ? 'Restart' : 'Start'}
             </button>
           ) : (
             <button onClick={stopTest} className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all shadow-md shadow-red-500/20">
               <Square size={18} fill="currentColor" /> Stop
             </button>
           )}
           <span className="text-sm font-medium opacity-70 hidden md:block">
             {status === 'testing_down' && 'Testing Downlink...'}
             {status === 'testing_up' && 'Testing Uplink...'}
             {status === 'done' && 'Test Complete'}
             {status === 'error' && 'Network Error'}
           </span>
         </div>
         
         <div className="flex bg-black/10 dark:bg-white/10 p-1 rounded-lg">
           <button onClick={() => setUnit('MBps')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${unit === 'MBps' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-500' : 'opacity-60 hover:opacity-100'}`}>
             MBps
           </button>
           <button onClick={() => setUnit('Mbps')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${unit === 'Mbps' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-500' : 'opacity-60 hover:opacity-100'}`}>
             Mbps
           </button>
         </div>
      </div>

      {/* Network Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-500 rounded-lg"><Server size={20} /></div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-wider opacity-50">Carrier / ISP</p>
            <p className="font-medium text-sm truncate w-full" title={networkInfo?.carrier || 'Detecting...'}>{networkInfo?.carrier || 'Detecting...'}</p>
          </div>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-500 rounded-lg"><Globe size={20} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-50">IP Address</p>
            <p className="font-mono text-sm">{networkInfo?.ip || 'Detecting...'}</p>
          </div>
        </div>
        <div className={`border p-4 rounded-xl flex items-center gap-4 transition-colors ${networkInfo?.isVpn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className={`p-3 rounded-lg ${networkInfo?.isVpn ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
            {networkInfo?.isVpn ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-50">VPN Status</p>
            <p className="font-medium text-sm">{networkInfo ? (networkInfo.isVpn ? 'VPN Detected' : 'No VPN Detected') : 'Detecting...'}</p>
          </div>
        </div>
      </div>

      {/* Speed Dials */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 ${status === 'testing_down' ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
          <Download size={32} className={`mb-4 ${status === 'testing_down' ? 'text-sky-500 animate-bounce' : 'opacity-40'}`} />
          <div className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            {formatSpeed(downSpeedRaw)}
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Down ({unit})</div>
        </div>
        
        <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 ${status === 'testing_up' ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.15)]' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
          <Upload size={32} className={`mb-4 ${status === 'testing_up' ? 'text-fuchsia-500 animate-bounce' : 'opacity-40'}`} />
          <div className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            {formatSpeed(upSpeedRaw)}
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Up ({unit})</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2">
        <m.div 
          className="h-full bg-gradient-to-r from-sky-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      </div>
    </div>
  );
}