'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

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

const collegeColors: { [key: string]: string } = {
  'Berkeley': 'bg-red-100',
  'Branford': 'bg-blue-100',
  'Grace Hopper': 'bg-green-100',
  'Davenport': 'bg-yellow-100',
  'Ezra Stiles': 'bg-purple-100',
  'Jonathan Edwards': 'bg-pink-100',
  'Morse': 'bg-indigo-100',
  'Pauli Murray': 'bg-gray-100',
  'Pierson': 'bg-orange-100',
  'Saybrook': 'bg-teal-100',
  'Silliman': 'bg-cyan-100',
  'Timothy Dwight': 'bg-lime-100',
  'Trumbull': 'bg-emerald-100',
  'Benjamin Franklin': 'bg-violet-100',
};

export default function YaliesRankingPage() {
  const [yalies, setYalies] = useState<Yalie[]>([]);
  const [votes, setVotes] = useState<Votes>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
        setLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
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
            setHasMore(false);
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading, yalies, votes]);

  const filteredYalies = useMemo(() => {
    if (!search) return yalies;
    const lowerSearch = search.toLowerCase();
    return yalies.filter(yalie =>
      `${yalie.fname || ''} ${yalie.lname || ''}`.toLowerCase().includes(lowerSearch) ||
      (yalie.college || '').toLowerCase().includes(lowerSearch) ||
      String(yalie.year || '').includes(lowerSearch)
    );
  }, [yalies, search]);

  const handleVote = (key: string, delta: number) => {
    updateVote(key, delta);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Yalies Ranking</h1>
      <input
        type="text"
        placeholder="Search by name, college, or year..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      {loading ? (
        <div className="text-center py-4">Loading rankings...</div>
      ) : (
        <>
          <ul className="space-y-2">
            {filteredYalies.map((yalie) => {
              console.log('College:', yalie.college, 'Color:', collegeColors[yalie.college]);
              return (
                <li key={yalie.key} className={`flex items-center justify-between p-4 border rounded text-black ${collegeColors[yalie.college] || 'bg-gray-100'}`}>
                  <div>
                    <span className="font-semibold">{yalie.fname} {yalie.lname}</span> - {yalie.year}, {yalie.college}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Score: {votes[yalie.key] || 0}</span>
                    <button
                      onClick={() => handleVote(yalie.key, 1)}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleVote(yalie.key, -1)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div ref={observerTarget} className="text-center py-4">
            {loading && 'Loading more Yalies...'}
            {!hasMore && 'No more Yalies to load.'}
          </div>
        </>
      )}
    </div>
  );
}