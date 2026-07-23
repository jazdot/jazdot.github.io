import { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ArrowLeft, Clock, BookOpen, Share2, Check, ArrowUpRight } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 18 } }
} as const;

export default function Blog() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // If a slug is in the URL, render the active post
  const activePost = useMemo(() => {
    if (!slug) return null;
    return blogPosts.find((p) => p.slug === slug) || null;
  }, [slug]);

  // Unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(blogPosts.flatMap((p) => p.tags)));
  }, []);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag =
        selectedTag === 'all' || post.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  const handleShare = (postSlug: string) => {
    const url = `${window.location.origin}/#/blog/${postSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If viewing single post
  if (activePost) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto font-sans"
      >
        <SEO
          title={`${activePost.title} | Muhammed Riswan M. P.`}
          description={activePost.excerpt}
        />

        {/* Back navigation */}
        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Blog</span>
        </button>

        {/* Post Article Header */}
        <header className="border-b border-slate-200/50 dark:border-white/10 pb-8 mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
            {activePost.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>{activePost.date}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {activePost.readTime}
              </span>
            </div>

            <button
              onClick={() => handleShare(activePost.slug)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
              <span>{copied ? 'Copied Link' : 'Share'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {activePost.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        </header>

        {/* Prose Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg space-y-6">
          {activePost.content.split('\n\n').map((paragraph, idx) => {
            const trimmed = paragraph.trim();

            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-4 tracking-tight">
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-3">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={idx} className="my-6 p-4 rounded-r-xl border-l-4 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-slate-700 dark:text-slate-200 text-sm md:text-base leading-relaxed italic">
                  {trimmed.replace('> ', '')}
                </blockquote>
              );
            }
            if (trimmed.startsWith('```')) {
              const codeLines = trimmed.replace(/```[a-z]*/g, '').trim();
              return (
                <pre key={idx} className="my-6 p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs md:text-sm overflow-x-auto border border-slate-800 shadow-inner">
                  <code>{codeLines}</code>
                </pre>
              );
            }

            return (
              <p key={idx} className="leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Footer Nav */}
        <div className="mt-16 pt-8 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <button
            onClick={() => navigate('/blog')}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            ← All Articles
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Back to Top ↑
          </button>
        </div>
      </m.div>
    );
  }

  // Blog Homepage Index List
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative z-10 w-full min-h-screen pt-28 pb-20 px-6 max-w-5xl mx-auto font-sans"
    >
      <SEO
        title="Blog | Muhammed Riswan M. P."
        description="Engineering notes on 5G protocol stacks, UAV mesh networking, cloud infrastructure, and network automation."
      />

      {/* Header */}
      <div className="flex flex-col text-left mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase w-max mb-4">
          <BookOpen size={13} /> Engineering Journal
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Blog &amp; Writing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-base md:text-lg max-w-2xl leading-relaxed">
          Technical breakdowns on 5G protocols, autonomous UAV mesh topologies, cloud automation, and high-performance network engineering.
        </p>
      </div>

      {/* Search & Tag Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-10">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 backdrop-blur-md transition-colors"
          />
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              selectedTag === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 hover:border-slate-400'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 hover:border-slate-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col divide-y divide-slate-200/50 dark:divide-white/10 border-t border-b border-slate-200/50 dark:border-white/10"
      >
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post) => (
            <m.div
              key={post.slug}
              variants={itemVariants}
              onClick={() => navigate(`/blog/${post.slug}`)}
              className="group cursor-pointer py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-slate-500/5 px-4 -mx-4 rounded-xl"
            >
              <div className="flex flex-col text-left max-w-3xl">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-2">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                  {post.title}
                  <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </m.div>
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
            No articles found matching your search.
          </div>
        )}
      </m.div>
    </m.div>
  );
}
