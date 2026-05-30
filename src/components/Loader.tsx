import { m } from "framer-motion";

export default function Loader({ text = "Loading...", className = "min-h-[40vh]" }: { text?: string, className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center w-full gap-6 ${className}`}>
      <m.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-slate-200/50 dark:border-white/10 rounded-full"
        style={{ borderTopColor: "hsl(var(--accent))", boxShadow: "0 0 15px -3px hsl(var(--accent) / 0.4)" }}
      />
      <m.div 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase"
      >
        {text}
      </m.div>
    </div>
  );
}