'use client';

import { useState, useEffect, useRef } from 'react';

interface Yalie {
  fname: string;
  lname: string;
  year: number | string;
  college: string;
  profile: string;
  key: string;
}

interface Votes {
  [key: string]: number;
}

export default function YaliesRankingPage() {
  const [yalies, setYalies] = useState<Yalie[]>([]);
  const [votes, setVotes] = useState<Votes>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchYalies = async (pageNum: number) => {
    const res = await fetch(`/api/yalies?page=${pageNum}&page_size=50`);
    if (!res.ok) throw new Error('Failed to fetch Yalies');
    return await res.json();
  };

  const fetchVotes = async () => {
    const res = await fetch('/api/votes');
    if (!res.ok) throw new Error('Failed to fetch votes');
    return await res.json();
  };

  const updateVote = async (key: string, delta: number) => {
    const newVotes = { ...votes };
    newVotes[key] = (newVotes[key] || 0) + delta;
    setVotes(newVotes);
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVotes),
    });
  };

  const sortYalies = (ylist: Yalie[], v: Votes) => {
    return ylist.sort((a, b) => {
      const scoreA = v[a.key] || 0;
      const scoreB = v[b.key] || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      const nameA = `${a.fname} ${a.lname}`.toLowerCase();
      const nameB = `${b.fname} ${b.lname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [initialYalies, initialVotes] = await Promise.all([
          fetchYalies(1),
          fetchVotes(),
        ]);
        setYalies(sortYalies(initialYalies, initialVotes));
        setVotes(initialVotes);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          const nextPage = page + 1;
          try {
            const newYalies = await fetchYalies(nextPage);
            if (newYalies.length === 0) {
              setHasMore(false);
            } else {
              const updatedYalies = sortYalies([...yalies, ...newYalies], votes);
              setYalies(updatedYalies);
              setPage(nextPage);
            }
          } catch (error) {
            console.error('Error loading more Yalies:', error);
          }
          setLoading(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading, yalies, votes]);

  useEffect(() => {
    setYalies(sortYalies([...yalies], votes));
  }, [votes]);

  const handleVote = (key: string, delta: number) => {
    updateVote(key, delta);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Yalies Ranking</h1>
      <ul className="space-y-2">
        {yalies.map((yalie) => (
          <li key={yalie.key} className="flex items-center justify-between p-4 border rounded">
            <div>
              <span className="font-semibold">{yalie.fname} {yalie.lname}</span> - {yalie.year}, {yalie.college}
            </div>
            <div className="flex items-center space-x-2">
              <span>Score: {votes[yalie.key] || 0}</span>
              <button
                onClick={() => handleVote(yalie.key, 1)}
                className="px-2 py-1 bg-green-500 text-white rounded"
              >
                ↑
              </button>
              <button
                onClick={() => handleVote(yalie.key, -1)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div ref={observerTarget} className="text-center py-4">
        {loading && 'Loading more Yalies...'}
        {!hasMore && 'No more Yalies to load.'}
      </div>
    </div>
  );
}