import React, { useState } from 'react';
import { m } from 'framer-motion';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const formData = new FormData(e.currentTarget);
    // Get your free access key from https://web3forms.com/ and replace the string below!
    formData.append("access_key", "b3f49b3b-d907-4b51-9a63-dac8a2991b9e"); 

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p className="text-slate-500 dark:text-slate-400">Thanks for reaching out. I'll get back to you soon.</p>
      </m.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-900 dark:text-white">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1 opacity-80">Name</label>
        <input type="text" name="name" id="name" required placeholder="Jane Doe" className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-accent transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1 opacity-80">Email</label>
        <input type="email" name="email" id="email" required placeholder="jane@example.com" className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-accent transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1 opacity-80">Message</label>
        <textarea name="message" id="message" required rows={4} placeholder="How can I help you?" className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"></textarea>
      </div>
      
      {status === 'error' && (
        <p className="text-red-500 text-sm">Something went wrong. Please try again or email me directly.</p>
      )}

      <button 
        type="submit" 
        disabled={status === 'submitting'}
        className="mt-2 w-full py-3 px-6 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center"
      >
        {status === 'submitting' ? (
          <span className="inline-block w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></span>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}