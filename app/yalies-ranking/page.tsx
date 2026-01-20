'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [searchInput, setSearchInput] = useState('');
  const [loadingAll, setLoadingAll] = useState(false);
  const [votedKey, setVotedKey] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'college' | 'year'>('score');
  const [fiftyMost, setFiftyMost] = useState(false);
  const [fiftyMostNames, setFiftyMostNames] = useState<string[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchYalies = async (pageNum: number, query: string = '') => {
    const res = await fetch(`/api/yalies?page=${pageNum}&page_size=50&query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch Yalies');
    return await res.json();
  };

  const fetchVotes = async () => {
    const res = await fetch('/api/votes');
    if (!res.ok) throw new Error('Failed to fetch votes');
    return await res.json();
  };

  const fetchFiftyMost = async () => {
    const res = await fetch('/50most.json');
    if (!res.ok) throw new Error('Failed to fetch 50 most');
    const data = await res.json();
    setFiftyMostNames(data);
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

  const sortYalies = (ylist: Yalie[], v: Votes, sortType: 'score' | 'college' | 'year') => {
    return [...ylist].sort((a, b) => {
      if (sortType === 'college') {
        const colA = a.college.toLowerCase();
        const colB = b.college.toLowerCase();
        if (colA !== colB) return colA.localeCompare(colB);
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortType === 'year') {
        const yearA = typeof a.year === 'string' ? parseInt(a.year) : a.year;
        const yearB = typeof b.year === 'string' ? parseInt(b.year) : b.year;
        if (yearA !== yearB) return yearB - yearA;
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        const scoreA = v[a.key] || 0;
        const scoreB = v[b.key] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });
  };



  useEffect(() => {
    fetchFiftyMost();
  }, []);

  useEffect(() => {
    if (search || fiftyMost) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingAll) {
          setLoading(true);
          const nextPage = page + 1;
          try {
            const newYalies = await fetchYalies(nextPage, '');
            if (newYalies.length === 0) {
              setHasMore(false);
            } else {
              const updatedYalies = sortYalies([...yalies, ...newYalies], votes, sortBy);
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
  }, [page, hasMore, loading, yalies, votes, sortBy, search, fiftyMost]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadData = async () => {
      if (fiftyMost) {
        setYalies([]);
        setPage(1);
        setLoadingAll(true);
        try {
          let allYalies: Yalie[] = [];
          let pageNum = 1;
          while (true) {
            const data = await fetchYalies(pageNum, '');
            if (data.length === 0) break;
            allYalies = [...allYalies, ...data];
            pageNum++;
          }
          allYalies = allYalies.filter(y => fiftyMostNames.includes(`${y.fname} ${y.lname}`));
          setYalies(sortYalies(allYalies, votes, sortBy));
          setHasMore(false);
          setLoadingAll(false);
        } catch (error) {
          console.error('Error loading 50 most:', error);
          setLoadingAll(false);
        }
      } else if (search) {
        setYalies([]);
        setPage(1);
        setLoadingAll(true);
        try {
          let allYalies: Yalie[] = [];
          let pageNum = 1;
          while (true) {
            const data = await fetchYalies(pageNum, search);
            if (data.length === 0) break;
            allYalies = [...allYalies, ...data];
            pageNum++;
          }
          setYalies(sortYalies(allYalies, votes, sortBy));
          setHasMore(false);
          setLoadingAll(false);
        } catch (error) {
          console.error('Error loading search results:', error);
          setLoadingAll(false);
        }
      } else {
        setYalies([]);
        setPage(1);
        setHasMore(true);
        setLoadingAll(false);
        setLoading(true);
        try {
          const [initialYalies, initialVotes] = await Promise.all([
            fetchYalies(1, ''),
            fetchVotes(),
          ]);
          setYalies(sortYalies(initialYalies, initialVotes, sortBy));
          setVotes(initialVotes);
          setLoading(false);
        } catch (error) {
          console.error('Error loading initial data:', error);
          setLoading(false);
        }
      }
    };
    loadData();
  }, [search, fiftyMost, sortBy, fiftyMostNames]);

  useEffect(() => {
    setYalies(sortYalies(yalies, votes, sortBy));
  }, [sortBy, votes]);

  const handleRefresh = async () => {
    try {
      const newVotes = await fetchVotes();
      setVotes(newVotes);
    } catch (error) {
      console.error('Error refreshing votes:', error);
    }
  };

  const handleVote = (key: string, delta: number) => {
    setVotedKey(key);
    setTimeout(() => setVotedKey(''), 1000);
    updateVote(key, delta);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Yalies Ranking</h1>
      <div className="flex items-center space-x-4 mb-4">
        <label>
          <input
            type="checkbox"
            checked={fiftyMost}
            onChange={(e) => setFiftyMost(e.target.checked)}
          />
          50 Most
        </label>
        <label>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'score' | 'college' | 'year')}>
            <option value="score">Score</option>
            <option value="college">College</option>
            <option value="year">Year</option>
          </select>
        </label>
        <button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Votes
        </button>
      </div>
      <input
        type="text"
        placeholder="Search by name, college, or year..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="text-black w-full p-2 mb-4 border rounded backdrop-blur bg-opacity-20 focus:bg-blue-500 focus:bg-opacity-50 focus:text-white transition-colors"
      />
      {loading || loadingAll ? (
        <div className="text-center py-4">
          {loading ? 'Loading rankings...' : 'Loading all Yalies for search...'}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {yalies.map((yalie) => (
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
            ))}
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