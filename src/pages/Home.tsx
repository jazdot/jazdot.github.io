import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Network, 
  Server, 
  Cpu, 
  RadioTower, 
  Terminal, 
  Gauge, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import Hero from '../components/Hero';
import SEO from '../components/SEO';
import GitHubProjects from '../components/GitHubProjects';

const domains = [
  {
    id: 'telecom',
    title: '5G / O-RAN Telecommunications',
    subtitle: 'CU/DU Protocol Integration',
    tag: 'TS 38.413 / TS 24.501',
    icon: Network,
    description: 'Deploying OpenAirInterface protocol stacks, optimizing SCTP associations, and benchmarking N2/N3 message flows on Keysight core nodes.',
    stack: ['Keysight Core', 'OAI CU/DU', 'N2/N3 SCTP', '5G NR'],
    metrics: [
      { label: 'Core Status', value: 'Operational', highlight: 'text-emerald-500' },
      { label: 'CU/DU Latency', value: '2.5ms' },
      { label: 'Packet Loss', value: '0.00%' }
    ],
    color: 'from-blue-500/10 to-indigo-500/10 hover:border-blue-500/50 hover:shadow-blue-500/5'
  },
  {
    id: 'cloud',
    title: 'Cloud SDN & Infrastructure',
    subtitle: 'OpenStack Neutron & KVM virtualization',
    tag: 'L3 Routing & CNI Layers',
    icon: Server,
    description: 'Architecting high-performance cloud networks, managing zero-downtime VM migrations, and configuring tenant networks and virtual routers.',
    stack: ['OpenStack', 'VPC Routing', 'KVM / VMware', 'Kubernetes CNI'],
    metrics: [
      { label: 'SDN Sync', value: 'Active', highlight: 'text-emerald-500' },
      { label: 'Lab Topology', value: '12 KVM Nodes' },
      { label: 'Avg VM Load', value: '14.2%' }
    ],
    color: 'from-cyan-500/10 to-blue-500/10 hover:border-cyan-500/50 hover:shadow-cyan-500/5'
  },
  {
    id: 'automation',
    title: 'Network DevOps & Automation',
    subtitle: 'Declarative Infrastructures',
    tag: 'Infrastructure as Code',
    icon: Cpu,
    description: 'Automating multi-node network topologies, VM resource provisioning, and system telemetry tracking with Terraform, Ansible, and Python.',
    stack: ['Terraform', 'Ansible', 'IBM Concert', 'Python Scripting'],
    metrics: [
      { label: 'IAC Drift', value: '0.0%', highlight: 'text-emerald-500' },
      { label: 'Pipelines', value: '15 Active' },
      { label: 'Deploy Time', value: '< 15 mins' }
    ],
    color: 'from-purple-500/10 to-pink-500/10 hover:border-purple-500/50 hover:shadow-purple-500/5'
  },
  {
    id: 'mesh',
    title: 'Decentralized UAV Swarms',
    subtitle: 'Ad-hoc Mobile Networks',
    tag: 'MTech Research Thesis',
    icon: RadioTower,
    description: 'Designing routing algorithms (OLSR mesh topology) to maintain network integrity and telemetry sync for UAV node meshes in high-latency scenarios.',
    stack: ['OLSR Mesh', 'UAV Swarms', 'ROS Telemetry', 'Python Mesh'],
    metrics: [
      { label: 'Mesh Swarm', value: 'Active Swarm', highlight: 'text-emerald-500' },
      { label: 'Mesh Size', value: '10 UAVs' },
      { label: 'Tx Reliability', value: '99.8%' }
    ],
    color: 'from-fuchsia-500/10 to-purple-500/10 hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/5'
  }
];

const sandboxes = [
  {
    id: 'terminal',
    title: 'Diagnostic Command Shell',
    icon: Terminal,
    description: 'Query my background, systems configuration parameters, and career chronology through a web-simulated CLI shell.',
    action: 'Open Terminal',
    glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/5'
  },
  {
    id: 'infraHealth',
    title: 'Infrastructure Telemetry',
    icon: Activity,
    description: 'Monitor real-time system metrics, memory loads, and simulated core bandwidth diagrams on the health console.',
    action: 'Launch Dashboard',
    glow: 'hover:border-purple-500/40 hover:shadow-purple-500/5'
  },
  {
    id: 'speedTest',
    title: 'Speed Test Simulator',
    icon: Gauge,
    description: 'Execute web download speed checks inside the dial widget to benchmark link speeds in real time.',
    action: 'Run Speed Test',
    glow: 'hover:border-blue-500/40 hover:shadow-blue-500/5'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 18 } }
} as const;

export default function Home() {
  const navigate = useNavigate();

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative z-10 w-full"
    >
      <SEO 
        title="Muhammed Riswan M. P. | Network Engineer & Cloud DevOps" 
        description="Results-oriented Network Engineer with hands-on experience in SDN, 5G/O-RAN, and network automation. Specializing in Python, Terraform, and high-performance cloud infrastructures."
      />
      
      {/* Hero Section */}
      <Hero />

      {/* Core Engineering Domains */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200/30 dark:border-white/5 mt-8">
        <div className="flex flex-col mb-16 text-left">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs font-bold font-mono tracking-widest uppercase w-max mb-4"
          >
            <ShieldCheck size={14} /> Core Engineering Fields
          </m.div>
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Core Competencies & Stack
          </m.h2>
          <m.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 mt-4 text-base md:text-lg max-w-2xl leading-relaxed"
          >
            Simulating, virtualizing, and orchestrating communication meshes from high-throughput core routing stacks to autonomous aerial nodes.
          </m.p>
        </div>

        <m.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
        >
          {domains.map((dom) => {
            const DomIcon = dom.icon;
            return (
              <m.div
                key={dom.id}
                variants={itemVariants}
                className={`relative flex flex-col justify-between min-h-[300px] p-6 rounded-2xl border bg-gradient-to-br bg-white/40 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/10 backdrop-blur-xl transition-all duration-300 ${dom.color}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[hsl(var(--accent))]">
                      <DomIcon size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                      {dom.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-6">{dom.title}</h3>
                  <p className="text-xs text-[hsl(var(--accent))] font-bold font-mono tracking-wider mt-1 uppercase">{dom.subtitle}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">{dom.description}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/40 dark:border-white/5 flex flex-col gap-4">
                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-2">
                    {dom.stack.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Telemetry data */}
                  <div className="flex items-center gap-6 justify-between bg-black/5 dark:bg-black/25 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-500 border border-black/5 dark:border-white/5 select-none">
                    {dom.metrics.map((m, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <span className="text-slate-400">{m.label}:</span>
                        <span className={`font-bold ${m.highlight || 'text-slate-600 dark:text-slate-300'}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </m.div>
            );
          })}
        </m.div>
      </section>

      {/* Playable Sandbox Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200/30 dark:border-white/5">
        <div className="flex flex-col mb-16 text-left">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 text-xs font-bold font-mono tracking-widest uppercase w-max mb-4"
          >
            <Zap size={14} /> Playable Simulators Sandbox
          </m.div>
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Engineering Telemetry Sandbox
          </m.h2>
          <m.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 mt-4 text-base md:text-lg max-w-2xl leading-relaxed"
          >
            Run simulated network speed checks, parse telemetry metrics, or query logs inside hardware-accelerated diagnostic widgets.
          </m.p>
        </div>

        <m.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
        >
          {sandboxes.map((box) => {
            const SandboxIcon = box.icon;
            return (
              <m.div
                key={box.id}
                variants={itemVariants}
                onClick={() => navigate('/tools', { state: { openTool: box.id } })}
                className={`relative group cursor-pointer flex flex-col justify-between p-6 rounded-2xl border bg-white/40 dark:bg-slate-950/40 border-slate-200/50 dark:border-white/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${box.glow}`}
              >
                <div>
                  <div className="p-3 w-max rounded-xl bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[hsl(var(--accent))] transition-colors group-hover:bg-slate-900/10 dark:group-hover:bg-white/10">
                    <SandboxIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-6 transition-colors group-hover:text-[hsl(var(--accent))]">{box.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{box.description}</p>
                </div>

                <div className="flex items-center gap-1.5 mt-6 text-xs font-bold font-mono text-[hsl(var(--accent))] group-hover:translate-x-1 transition-transform">
                  <span>{box.action}</span>
                  <ArrowRight size={14} />
                </div>
              </m.div>
            );
          })}
        </m.div>
      </section>

      {/* Featured Open Source Showcase */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200/30 dark:border-white/5 mb-12">
        <div className="flex flex-col mb-16 text-left">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-bold font-mono tracking-widest uppercase w-max mb-4"
          >
            <Globe size={14} /> Open Source Spotlights
          </m.div>
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Featured Repositories
          </m.h2>
          <m.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 mt-4 text-base md:text-lg max-w-2xl leading-relaxed"
          >
            Inspect the source code, automation scripts, and protocol configurations of open projects.
          </m.p>
        </div>

        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <GitHubProjects />
        </m.div>
      </section>
    </m.div>
  );
}