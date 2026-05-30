import React from 'react';
import { motion } from 'framer-motion';
import './Portfolio.css';

// Animation Variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
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

export default function Portfolio() {
  return (
    <div className="portfolio-content">
      {/* About Section */}
      <motion.section 
        className="section" id="about"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.h3 variants={fadeUp} className="section-title">Objective</motion.h3>
        <motion.p variants={fadeUp} className="objective-text">
          Results-oriented Network Engineer with hands-on experience in SDN, 5G/O-RAN, and network automation. Proven track record of managing complex topologies across OpenStack and AWS, automating infrastructure with Python and Terraform, and optimizing routing to reduce latency and ensure 99.9% availability.
        </motion.p>
      </motion.section>

      {/* Skills */}
      <motion.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.h3 variants={fadeUp} className="section-title">Technical Strengths</motion.h3>
        <motion.div variants={staggerContainer} className="skills-grid">
          {skills.map((skill, index) => (
            <motion.div key={index} variants={fadeUp} className="card skill-card" whileHover={{ scale: 1.02 }}>
              <h4 className="skill-category">{skill.category}</h4>
              <p>{skill.items}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Experience */}
      <motion.section 
        className="section" id="work"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.h3 variants={fadeUp} className="section-title">Work Experience</motion.h3>
        <div className="timeline">
          {experience.map((exp, index) => (
            <motion.div key={index} variants={fadeUp} className="experience-item">
              <div className="exp-header">
                <h4 className="exp-title">{exp.title}</h4>
                <span className="exp-date">{exp.date}</span>
              </div>
              <div className="exp-company">{exp.company} &bull; {exp.location}</div>
              <ul className="exp-desc">
                {exp.description.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Education & Publications */}
      <motion.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.h3 variants={fadeUp} className="section-title">Education & Publications</motion.h3>
        <div className="edu-grid">
          {education.map((edu, index) => (
            <motion.div key={index} variants={fadeUp} className="card edu-card" whileHover={{ scale: 1.02 }}>
              <h4>{edu.degree}</h4>
              <div className="exp-company">{edu.school}</div>
              <div className="exp-date">{edu.date}</div>
              <p className="edu-details">{edu.details}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div variants={fadeUp} className="card publication-card" whileHover={{ scale: 1.02 }}>
          <h4>Paper Publication (ETET 2025)</h4>
          <p><em>"Scalable and Secure Mesh Communication Framework for UAV Swarm Coordination in Disaster Response"</em>. Converted from IEEE to Grenzee Journal format, highlighting robust network topology design for autonomous systems.</p>
        </motion.div>
      </motion.section>

    </div>
  );
}