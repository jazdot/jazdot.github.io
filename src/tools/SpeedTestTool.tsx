import { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import { Play, Square, Download, Upload, Server, ShieldAlert, ShieldCheck, Globe, Activity } from 'lucide-react';

type Status = 'idle' | 'testing_ping' | 'testing_down' | 'testing_up' | 'done' | 'error';
type Unit = 'MBps' | 'Mbps';

interface NetworkInfo {
  ip: string;
  carrier: string;
  isVpn: boolean;
  lat?: number;
  lon?: number;
}

export default function SpeedTestTool() {
  const [status, setStatus] = useState<Status>('idle');
  const [unit, setUnit] = useState<Unit>('MBps');
  
  const [pingRaw, setPingRaw] = useState<number | null>(null);
  const [downSpeedRaw, setDownSpeedRaw] = useState<number | null>(null);
  const [upSpeedRaw, setUpSpeedRaw] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  // Fetch Real IP, Carrier, and Security details
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 4000);
        
        // Attempt 1: ipwho.is (Provides VPN info, but sometimes blocked by adblockers)
        const res1 = await fetch('https://ipwho.is/json/', { signal: controller1.signal });
        clearTimeout(timeout1);
        
        const data1 = await res1.json();
        if (data1.success) {
          setNetworkInfo({
            ip: data1.ip,
            carrier: data1.connection?.isp || data1.connection?.org || 'Unknown',
            isVpn: data1.security?.vpn || data1.security?.proxy || data1.security?.tor || false,
            lat: data1.latitude,
            lon: data1.longitude
          });
          return;
        }
        throw new Error("ipwho.is returned unsuccessful");
      } catch (e) {
        // Attempt 2: ipinfo.io (Extremely reliable fallback)
        try {
          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 4000);
          
          const res2 = await fetch('https://ipinfo.io/json', { signal: controller2.signal });
          clearTimeout(timeout2);
          
          const data2 = await res2.json();
          const [lat, lon] = data2.loc ? data2.loc.split(',').map(Number) : [undefined, undefined];
          setNetworkInfo({
            ip: data2.ip || 'Unavailable',
            carrier: data2.org || 'Unknown',
            isVpn: false, // Fallback API doesn't provide VPN flag for free
            lat,
            lon
          });
          return;
        } catch (e2) {
          // Absolute Fallback
          setNetworkInfo({ ip: 'Unavailable', carrier: 'Unknown Network', isVpn: false });
        }
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
    setStatus('testing_ping');
    setPingRaw(null)
    setDownSpeedRaw(null);
    setUpSpeedRaw(null);
    setProgress(0);
    abortController.current = new AbortController();

    try {
      // 0. Ping Test
      const pingStart = performance.now();
      const pingRes = await fetch('https://speed.cloudflare.com/__down?bytes=0', { 
        signal: abortController.current.signal,
        cache: 'no-store'
      });
      if (!pingRes.ok) throw new Error("Ping failed");
      setPingRaw(Math.round(performance.now() - pingStart));

      // 1. Downlink Test (25MB)
      const dlSize = 25_000_000; 
      const dlUrl = `https://speed.cloudflare.com/__down?bytes=${dlSize}`;
      const dlStart = performance.now();
      
      const dlRes = await fetch(dlUrl, { 
        signal: abortController.current.signal,
        cache: 'no-store'
      });

      if (!dlRes.ok || !dlRes.body) throw new Error("Stream not supported");
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

      // 2. Uplink Test (5MB payload - isolated to prevent crashing downlink results)
      setStatus('testing_up');
      try {
        const ulSize = 5_000_000;
        const payload = new Uint8Array(ulSize);
        const ulStart = performance.now();
        
        const ulRes = await fetch('https://speed.cloudflare.com/__up', {
          method: 'POST',
          body: payload,
          signal: abortController.current.signal,
          // 'text/plain' prevents strict CORS preflight OPTIONS requests
          headers: { 'Content-Type': 'text/plain' }
        });
        
        if (!ulRes.ok) throw new Error("Upload rejected");
        
        const ulDuration = (performance.now() - ulStart) / 1000;
        setUpSpeedRaw((ulSize * 8) / ulDuration); // Calculate raw bps
      } catch (upErr: any) {
        if (upErr.name === 'AbortError') throw upErr;
        console.warn("Upload test failed or was blocked:", upErr);
        // Fails gracefully; upSpeedRaw stays null but status advances to 'done'
      }
      
      setProgress(100);
      setStatus('done');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Speed test error:", e);
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
      <div className="flex flex-col sm:flex-row items-center justify-between bg-black/5 dark:bg-white/5 p-3 md:p-4 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm gap-3 sm:gap-0">
         <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
           {status === 'idle' || status === 'done' || status === 'error' ? (
             <button onClick={startTest} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 active:scale-95 transition-all shadow-md shadow-sky-500/20 text-sm md:text-base">
               <Play size={16} fill="currentColor" className="w-3 h-3 md:w-4 md:h-4" /> {status === 'done' ? 'Restart' : 'Start'}
             </button>
           ) : (
             <button onClick={stopTest} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all shadow-md shadow-red-500/20 text-sm md:text-base">
               <Square size={16} fill="currentColor" className="w-3 h-3 md:w-4 md:h-4" /> Stop
             </button>
           )}
           <span className="text-xs md:text-sm font-medium opacity-70 ml-1 md:ml-0 whitespace-nowrap">
             {status === 'testing_ping' && 'Testing Ping...'}
             {status === 'testing_down' && 'Testing Downlink...'}
             {status === 'testing_up' && 'Testing Uplink...'}
             {status === 'done' && 'Test Complete'}
             {status === 'error' && 'Network Error'}
           </span>
         </div>
         
         <div className="flex bg-black/10 dark:bg-white/10 p-1 rounded-lg w-full sm:w-auto">
           <button onClick={() => setUnit('MBps')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all ${unit === 'MBps' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-500' : 'opacity-60 hover:opacity-100'}`}>
             MBps
           </button>
           <button onClick={() => setUnit('Mbps')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all ${unit === 'Mbps' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-500' : 'opacity-60 hover:opacity-100'}`}>
             Mbps
           </button>
         </div>
      </div>

      {/* Network Info Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-3 md:p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 md:p-3 bg-purple-500/20 text-purple-500 rounded-lg shrink-0"><Server className="w-4 h-4 md:w-5 md:h-5" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-50">Carrier / ISP</p>
            <p className="font-medium text-[11px] md:text-sm leading-tight break-words" title={networkInfo?.carrier || 'Detecting...'}>{networkInfo?.carrier || 'Detecting...'}</p>
          </div>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-3 md:p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 md:p-3 bg-blue-500/20 text-blue-500 rounded-lg shrink-0"><Globe className="w-4 h-4 md:w-5 md:h-5" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-50">IP Address</p>
            <p className="font-mono text-[11px] md:text-sm break-all" title={networkInfo?.ip || 'Detecting...'}>{networkInfo?.ip || 'Detecting...'}</p>
          </div>
        </div>
        <div className={`border p-3 md:p-4 rounded-xl flex items-center gap-3 transition-colors ${networkInfo?.isVpn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className={`p-2 md:p-3 rounded-lg shrink-0 ${networkInfo?.isVpn ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
            {networkInfo?.isVpn ? <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" /> : <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-50">VPN Status</p>
            <p className="font-medium text-[11px] md:text-sm break-words">{networkInfo ? (networkInfo.isVpn ? 'VPN Detected' : 'No VPN') : 'Detecting...'}</p>
          </div>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-3 md:p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 md:p-3 bg-pink-500/20 text-pink-500 rounded-lg shrink-0"><Activity className="w-4 h-4 md:w-5 md:h-5" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-50">Ping</p>
            <p className="font-mono text-[11px] md:text-sm font-bold">{pingRaw !== null ? `${pingRaw} ms` : '--'}</p>
          </div>
        </div>
      </div>
      
      {/* OSM Zero-Dependency Map */}
      {networkInfo?.lat && networkInfo?.lon && (
        <div className="w-full h-[120px] md:h-[180px] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner relative group">
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${networkInfo.lon-0.05},${networkInfo.lat-0.05},${networkInfo.lon+0.05},${networkInfo.lat+0.05}&layer=mapnik&marker=${networkInfo.lat},${networkInfo.lon}`}
            className="grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none group-hover:pointer-events-auto"
          ></iframe>
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded md:rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm pointer-events-none text-slate-500">
            Detected Node Location
          </div>
        </div>
      )}

      {/* Speed Dials */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mt-2">
        <div className={`flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl border transition-all duration-300 ${status === 'testing_down' ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
          <Download className={`mb-3 md:mb-4 w-6 h-6 md:w-8 md:h-8 ${status === 'testing_down' ? 'text-sky-500 animate-bounce' : 'opacity-40'}`} />
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            {formatSpeed(downSpeedRaw)}
          </div>
          <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 md:mt-2">Down ({unit})</div>
        </div>
        
        <div className={`flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl border transition-all duration-300 ${status === 'testing_up' ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.15)]' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
          <Upload className={`mb-3 md:mb-4 w-6 h-6 md:w-8 md:h-8 ${status === 'testing_up' ? 'text-fuchsia-500 animate-bounce' : 'opacity-40'}`} />
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            {formatSpeed(upSpeedRaw)}
          </div>
          <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 md:mt-2">Up ({unit})</div>
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