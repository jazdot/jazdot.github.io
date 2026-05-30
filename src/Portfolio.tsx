import { useRef, useEffect } from 'react';
import { m, useInView, useMotionValue, useSpring, useTransform, type Variants, useScroll } from 'framer-motion';
import './Portfolio.css';
import SEO from './components/SEO';

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 20 
    } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const timelineItemVariant: Variants = {
  hidden: { opacity: 0, x: -40, scale: 0.9, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 14,
      staggerChildren: 0.15,
      delayChildren: 0.2
    } 
  }
};

const bulletVariant: Variants = {
  hidden: { opacity: 0, x: 20, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 150, damping: 12 } 
  }
};

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = "", suffix = "", decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100, mass: 1 });
  const displayValue = useTransform(springValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return (
    <span ref={ref} className="font-mono text-3xl font-extrabold text-[hsl(var(--accent))] flex items-baseline">
      {prefix}<m.span>{displayValue}</m.span>{suffix}
    </span>
  );
};

// Resume Data
const skills = [
  { category: 'Networking & Telecom', items: 'TCP/IP, SDN, VPC, DNS, O-RAN (CU/DU), Mesh Networks, NMS' },
  { category: 'Network Automation', items: 'Python, Bash Scripting, Ansible, Terraform, IBM Concert' },
  { category: 'Cloud & Virtualization', items: 'OpenStack (Neutron), AWS, KVM, VMware, Kubernetes (CNI)' },
  { category: 'Tools & Platforms', items: 'OpenAirInterface (OAI), Keysight Core, Git, Jenkins, Prometheus' },
  { category: 'Operating Systems', items: 'Red Hat Enterprise Linux (RHEL), Ubuntu/Debian' },
];

const experience = [
  {
    title: 'Senior Engineer (Cloud & DevOps)',
    company: 'Tata Elxsi',
    location: 'Bengaluru, India',
    date: 'June 2025 - Present',
    description: [
      '5G/O-RAN Integration: Integrated OpenAirInterface (OAI) RAN with Keysight Core for O-RAN CU/DU architectures, achieving 99.9% protocol adherence and reducing packet routing latency by 15ms.',
      'Network Management System: Architected and deployed a custom NMS across a 20+ node KVM lab environment, improving infrastructure health monitoring and reducing network downtime by 25%.',
      'Virtual Networking & SDN: Executed live migration of 50+ virtual machines from VMware to OpenStack SDN/Neutron, resolving IP conflicts and optimizing routing to achieve zero-downtime cutovers.',
      'Network Automation: Automated network provisioning using IBM Concert, Terraform, and Ansible, reducing manual configuration errors by 40% and cutting deployment time from hours to under 15 minutes.',
      'Linux Network Administration: Resolved 100+ L3 network tickets in RHEL environments by troubleshooting TCP/IP stack issues and firewall rules, maintaining a 95% SLA compliance rate.'
    ],
    metrics: [
      { value: 99.9, suffix: "%", label: "Protocol Adherence", decimals: 1 },
      { value: 15, prefix: "-", suffix: "ms", label: "Routing Latency" },
      { value: 40, prefix: "-", suffix: "%", label: "Config Errors" }
    ]
  },
  {
    title: 'Research Intern',
    company: 'ICFOSS',
    location: 'Trivandrum, India',
    date: 'June 2024 - Jan 2025',
    description: [
      'Mesh Communication: Developed decentralized Python mesh networking algorithms to coordinate a swarm of 10+ autonomous UAVs, increasing data transmission reliability by 30% in disaster scenarios.',
      'Data Transmission: Optimized payload delivery and telemetry streaming protocols, reducing bandwidth consumption by 20% in high-latency environments during field testing.'
    ],
    metrics: [
      { value: 10, prefix: "+", suffix: "", label: "UAV Swarm Size" },
      { value: 30, prefix: "+", suffix: "%", label: "Tx Reliability" },
      { value: 20, prefix: "-", suffix: "%", label: "Bandwidth Used" }
    ]
  }
];

const education = [
  {
    degree: 'MTech in Robotics and Automation',
    school: 'College of Engineering Trivandrum',
    date: '2023 - 2025',
    details: 'Focus: Autonomous Systems, Mesh Communication Frameworks'
  },
  {
    degree: 'BTech in Electronics and Communication',
    school: 'Government College of Engineering Kannur',
    date: '2018 - 2022',
    details: 'Inter College Zonal Chess Champions (2018-2020)'
  }
];

// Infinite Scrolling Tech Stack Marquee
const techStackKeys = [
  "Python", "Terraform", "Ansible", "Kubernetes", "Docker", "AWS",
  "OpenStack", "SDN", "O-RAN", "BGP/OSPF", "Linux", "Jenkins", "Prometheus"
];

const TechMarquee = () => (
  <div className="marquee-container my-12 relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw]">
    <m.div
      className="flex w-max"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ ease: "linear", duration: 35, repeat: Infinity }}
    >
      {[...techStackKeys, ...techStackKeys].map((tech, index) => (
        <div key={index} className="text-2xl md:text-3xl font-mono font-bold text-slate-400/40 dark:text-slate-500/40 whitespace-nowrap flex items-center px-6 hover:text-[hsl(var(--accent))] transition-colors duration-300 cursor-default">
          {tech}
          <span className="text-[hsl(var(--accent))]/30 ml-12">/</span>
        </div>
      ))}
    </m.div>
  </div>
);

export default function Portfolio() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="portfolio-content" style={{ paddingTop: '120px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <SEO 
        title="Profile | Muhammed Riswan M. P." 
        description="Explore the professional experience, skills, and education of Muhammed Riswan M. P. in Networking, SDN, and MLOps."
        path="#/about"
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 5vw 0' }} className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-8">
        
        <m.div 
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }} 
          animate={{ opacity: 1, scale: 1, rotate: 0 }} 
          transition={{ type: "spring", stiffness: 120, damping: 15 }} 
          className="relative shrink-0"
        >
          <m.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-slate-200/50 dark:border-white/10 shadow-2xl relative z-10 backdrop-blur-sm bg-white/20 dark:bg-white/5 cursor-pointer">
            <img src="/pp.jpeg" alt="Muhammed Riswan M. P." className="w-full h-full object-cover" />
          </m.div>
          {/* Subtle animated glow behind the avatar */}
          <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-40 rounded-full -z-10 scale-110"></div>
        </m.div>

        <div className="text-center md:text-left flex-1 mt-4 md:mt-0">
          <m.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', fontWeight: 800, letterSpacing: '-0.02em' }} className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 pb-2">
            Muhammed Riswan M. P.
          </m.h2>
          <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ color: 'var(--nav-text)', fontSize: '1.2rem', marginBottom: '1rem', maxWidth: '600px' }} className="mx-auto md:mx-0">
            Network & MLOps Engineer
          </m.p>
          
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-6 flex flex-col items-center md:items-start md:justify-start">
            <a href={`${import.meta.env.BASE_URL}Muhammed_Riswan_Resume_2026.pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Resume
            </a>
          </m.div>
          
        </div>
      </div>

      {/* About Section */}
      <m.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <m.h3 variants={fadeUp} className="section-title">Objective</m.h3>
        <m.p variants={fadeUp} className="objective-text">
          Results-oriented Network Engineer with hands-on experience in SDN, 5G/O-RAN, and network automation. Proven track record of managing complex topologies across OpenStack and AWS, automating infrastructure with Python and Terraform, and optimizing routing to reduce latency and ensure 99.9% availability.
        </m.p>
      </m.section>

      {/* Tech Stack Marquee */}
      <TechMarquee />

      {/* Skills */}
      <m.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <m.h3 variants={fadeUp} className="section-title">Technical Strengths</m.h3>
        <m.div variants={staggerContainer} className="skills-grid">
          {skills.map((skill, index) => (
            <m.div key={index} variants={fadeUp} className="card skill-card" whileHover={{ scale: 1.02 }}>
              <h4 className="skill-category">{skill.category}</h4>
              <p>{skill.items}</p>
            </m.div>
          ))}
        </m.div>
      </m.section>

      {/* Experience */}
      <m.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <m.h3 variants={fadeUp} className="section-title">Work Experience</m.h3>
        <div className="relative">
          {/* Animated Scroll Progress Line */}
          <m.div 
            style={{ scaleY, transformOrigin: 'top' }} 
            className="absolute left-[0.5rem] md:left-0 top-2 bottom-0 w-[2px] bg-[hsl(var(--accent))] shadow-[0_0_8px_hsl(var(--accent))] z-0" 
          />
        <div className="timeline" ref={timelineRef}>
          {experience.map((exp, index) => (
            <m.div 
              key={index} 
              variants={timelineItemVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="experience-item"
            >
              <div className="exp-header">
                <h4 className="exp-title">{exp.title}</h4>
                <span className="exp-date">{exp.date}</span>
              </div>
              <div className="exp-company">{exp.company} &bull; {exp.location}</div>
              
              {exp.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                  {exp.metrics.map((metric, idx) => (
                    <m.div key={idx} variants={bulletVariant} className="flex flex-col p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-inner">
                      <AnimatedCounter value={metric.value} prefix={metric.prefix} suffix={metric.suffix} decimals={metric.decimals} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">{metric.label}</span>
                    </m.div>
                  ))}
                </div>
              )}

              <ul className="exp-desc">
                {exp.description.map((item, idx) => (
                  <m.li key={idx} variants={bulletVariant}>{item}</m.li>
                ))}
              </ul>
            </m.div>
          ))}
        </div>
        </div>
      </m.section>

      {/* Education & Publications */}
      <m.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <m.h3 variants={fadeUp} className="section-title">Education & Publications</m.h3>
        <div className="edu-grid">
          {education.map((edu, index) => (
            <m.div key={index} variants={fadeUp} className="card edu-card" whileHover={{ scale: 1.02 }}>
              <h4>{edu.degree}</h4>
              <div className="exp-company">{edu.school}</div>
              <div className="exp-date">{edu.date}</div>
              <p className="edu-details">{edu.details}</p>
            </m.div>
          ))}
        </div>
        
        <m.div variants={fadeUp} className="card publication-card" whileHover={{ scale: 1.02 }}>
          <h4>Paper Publication (ETET 2025)</h4>
          <p><em>"Scalable and Secure Mesh Communication Framework for UAV Swarm Coordination in Disaster Response"</em>. Converted from IEEE to Grenzee Journal format, highlighting robust network topology design for autonomous systems.</p>
        </m.div>
      </m.section>

    </m.div>
  );
}