import { useEffect, useState } from 'react';
import { m } from 'framer-motion';

interface Repo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

let cachedRepos: Repo[] | null = null;

export default function GitHubProjects() {
  const [repos, setRepos] = useState<Repo[]>(cachedRepos || []);
  const [loading, setLoading] = useState(!cachedRepos);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedRepos) return;

    // Fetching repositories to sort by stars
    fetch('https://api.github.com/users/jazdot/repos?per_page=100')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid data');
        // Filter out forks, sort by stars (highest first), and grab the top 4
        const nonForks = data.filter(r => !r.fork);
        cachedRepos = nonForks.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4);
        setRepos(cachedRepos);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6 text-slate-900 dark:text-white">
      <p className="text-sm opacity-80 text-center">
        Here are my top-starred open-source repositories dynamically fetched from GitHub.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="inline-block w-8 h-8 border-4 border-slate-300 dark:border-slate-700 border-t-accent rounded-full animate-spin"></span>
        </div>
      ) : error ? (
        <p className="text-center text-red-500 py-4">Failed to load repositories. Please visit my profile directly.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {repos.map((repo, i) => (
            <m.a initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-accent dark:hover:border-accent hover:scale-[1.02] transition-all flex flex-col gap-2">
              <h4 className="font-bold truncate text-[hsl(var(--accent))]">{repo.name}</h4>
              <p className="text-xs opacity-70 line-clamp-2 flex-1">{repo.description || 'No description available.'}</p>
              <div className="flex justify-between items-center text-xs opacity-60 mt-2 font-mono"><span>{repo.language || 'Code'}</span><span className="flex items-center gap-1">★ {repo.stargazers_count}</span></div>
            </m.a>
          ))}
        </div>
      )}

      <a href="https://github.com/jazdot" target="_blank" rel="noopener noreferrer" className="mt-4 w-full py-3 px-6 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center shadow-lg">
        Take me to GitHub Profile
      </a>
    </div>
  );
}