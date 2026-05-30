import React, { useState, useRef, useEffect } from 'react';

const COMMANDS: Record<string, string | React.ReactNode> = {
  help: `Available commands:
  whoami     - Display my profile summary
  skills     - List my technical skills
  projects   - View my top projects
  contact    - How to get in touch
  clear      - Clear the terminal`,
  whoami: `Muhammed Riswan M. P.
Network & MLOps Engineer
Passionate about SDN, 5G/O-RAN, and automating complex infrastructures.`,
  skills: `> Networking: TCP/IP, SDN, VPC, DNS, O-RAN (CU/DU)
> Automation: Python, Bash, Ansible, Terraform
> Cloud: OpenStack, AWS, KVM, Kubernetes`,
  projects: `1. Mesh Communication: Decentralized Python mesh networking for UAVs.
2. 5G/O-RAN Integration: Integrated OAI RAN with Keysight Core.
3. Network Management System: Built custom NMS across KVM labs.`,
  contact: `Email: riswanmp6@gmail.com
LinkedIn: linkedin.com/in/muhammedriswanmp
GitHub: github.com/jazdot`,
  
  // Easter Eggs
  'ls': `about_me.txt  projects/  resume.pdf  skills/  top_secret/`,
  'ls -la': `total 24
drwxr-xr-x 1 jazdot admin 4096 May 30 16:34 .
drwxr-xr-x 1 root   root  4096 May 30 16:34 ..
-rw-r--r-- 1 jazdot admin 1337 May 30 16:34 about_me.txt
drwxr-xr-x 2 jazdot admin 4096 May 30 16:34 projects
-r-xr-xr-x 1 jazdot admin 9001 May 30 16:34 resume.pdf
drwxr-xr-x 2 jazdot admin 4096 May 30 16:34 skills
drwx------ 2 root   root  4096 Jan  1  1970 top_secret`,
  'll': `total 24
drwxr-xr-x 1 jazdot admin 4096 May 30 16:34 .
drwxr-xr-x 1 root   root  4096 May 30 16:34 ..
-rw-r--r-- 1 jazdot admin 1337 May 30 16:34 about_me.txt
drwxr-xr-x 2 jazdot admin 4096 May 30 16:34 projects
-r-xr-xr-x 1 jazdot admin 9001 May 30 16:34 resume.pdf
drwxr-xr-x 2 jazdot admin 4096 May 30 16:34 skills
drwx------ 2 root   root  4096 Jan  1  1970 top_secret`,
  'cd top_secret': `bash: cd: top_secret: Permission denied`,
  'cat resume.pdf': `Error: resume.pdf is a binary file. Use the 'Download Resume' button on the Profile page instead!`,
  'ip a': `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 13:37:ca:fe:ba:be brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0
       valid_lft 86399sec preferred_lft 86399sec`,
  'ping': `ping: missing host operand.\nTry 'ping 8.8.8.8' maybe?`,
  'ping 8.8.8.8': `PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=14.2 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=14.5 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=117 time=14.3 ms`,
  'sudo rm -rf /': `[sudo] password for explorer: \nSorry, try again.\n[sudo] password for explorer: \nsudo: 3 incorrect password attempts\nSECURITY ALERT: This incident will be reported to the sysadmin.`
};

const TypewriterText = ({ text, onUpdate }: { text: string; onUpdate?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index + 1));
      index++;
      if (onUpdateRef.current) onUpdateRef.current();
      if (index >= text.length) clearInterval(interval);
    }, 15); // Adjust typing speed here (lower = faster)
    return () => clearInterval(interval);
  }, [text]);

  return <>{displayedText}</>;
};

export default function TerminalTool() {
  const [history, setHistory] = useState<{ command: string; output: string | React.ReactNode }[]>([
    { command: '', output: 'Welcome to JAZDOT terminal! Type "help" for a list of commands.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (trimmedInput.toLowerCase() === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    const output = COMMANDS[trimmedInput.toLowerCase()] || `Command not found: ${trimmedInput}. Type "help" for available commands.`;
    
    setHistory(prev => [...prev, { command: trimmedInput, output }]);
    setInput('');
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  return (
    <div 
      className="flex flex-col h-[400px] md:h-[500px] bg-[#0c0c0c] text-emerald-400 font-mono text-sm md:text-base rounded-xl overflow-hidden p-4 shadow-inner w-full cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto mb-2 space-y-4 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
        {history.map((entry, i) => {
          const isLast = i === history.length - 1;
          return (
            <div key={i}>
              {entry.command && (
                <div className="flex gap-2 text-slate-400 mb-1">
                  <span className="text-pink-500 font-bold">jazdot@ubuntu</span>
                  <span className="text-slate-500">~</span>
                  <span className="text-slate-300">$ {entry.command}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed opacity-90">
                {isLast && typeof entry.output === 'string' ? (
                  <TypewriterText text={entry.output} onUpdate={scrollToBottom} />
                ) : (
                  entry.output
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
        <span className="text-pink-500 font-bold">jazdot@ubuntu</span>
        <span className="text-slate-500">~</span>
        <span className="text-slate-300">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-emerald-400 focus:ring-0 w-full p-0 m-0"
          autoFocus
          spellCheck="false"
          autoComplete="off"
        />
      </form>
    </div>
  );
}