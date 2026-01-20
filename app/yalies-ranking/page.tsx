'use client';

import { useEffect, useRef, useState } from 'react';
import "./rankst.css";

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
  const [fiftyMostNames, setFiftyMostNames] = useState<string[]>([]);
  const [is50Most, setIs50Most] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'college' | 'year'>('score');
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



  const updateVote = async (key: string, delta: number) => {
    const newVotes = { ...votes };
    newVotes[key] = (newVotes[key] || 0) + delta;
    setVotes(newVotes);
    setYalies(sortYalies(yalies, newVotes, sortBy));
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVotes),
    });
  };

  const sortYalies = (ylist: Yalie[], v: Votes, sort: 'score' | 'college' | 'year' = 'score') => {
    return ylist.sort((a, b) => {
      if (sort === 'college') {
        const collegeA = a.college.toLowerCase();
        const collegeB = b.college.toLowerCase();
        const comp = collegeA.localeCompare(collegeB);
        if (comp !== 0) return comp;
        return `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase());
      } else if (sort === 'year') {
        const yearA = parseInt(String(a.year));
        const yearB = parseInt(String(b.year));
        const comp = yearA - yearB;
        if (comp !== 0) return comp;
        return `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase());
      } else { // score
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
    if (search || is50Most) return;
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
      { threshold: 0.5 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  useEffect(() => {
    fetch('/50most.json')
      .then(res => res.json())
      .then(setFiftyMostNames)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (search && !loadingAll && !loading) {
      setYalies([]);
      setPage(1);
      setLoadingAll(true);
      const loadSearch = async () => {
        try {
          let query = search;
          if (is50Most) {
            query += ` ${fiftyMostNames.join(' OR ')}`;
          }
          const data = await fetchYalies(1, query);
          let filtered = data;
          if (is50Most) {
            filtered = data.filter((y: Yalie) => fiftyMostNames.some(name => name.toLowerCase() === `${y.fname} ${y.lname}`.toLowerCase()));
          }
          setYalies(sortYalies(filtered, votes, sortBy));
          setHasMore(false);
          setLoadingAll(false);
        } catch (error) {
          console.error('Error loading search results:', error);
          if (is50Most) {
            console.error('50 most search failed, disabling 50 most filter');
            setIs50Most(false);
          }
          setLoadingAll(false);
        }
      };
      loadSearch();
    } else if (!search) {
      if (is50Most) {
        setYalies([]);
        setLoadingAll(true);
        const load50 = async () => {
          try {
            const query = fiftyMostNames.join(' OR ');
            const data = await fetchYalies(1, query);
            const filtered = data.filter((y: Yalie) => fiftyMostNames.some(name => name.toLowerCase() === `${y.fname} ${y.lname}`.toLowerCase()));
            setYalies(sortYalies(filtered, votes, sortBy));
            setHasMore(false);
            setLoadingAll(false);
          } catch (error) {
            console.error('Error loading 50 most:', error);
            setIs50Most(false);
          }
        };
        load50();
      } else {
        setYalies([]);
        setPage(1);
        setHasMore(true);
        setLoadingAll(false);
        const loadInitial = async () => {
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
        };
        loadInitial();
      }
    }
  }, [search, is50Most, sortBy, fiftyMostNames]);



  const handleRefresh = async () => {
    try {
      const newVotes = await fetchVotes();
      setVotes(newVotes);
      setYalies(sortYalies(yalies, newVotes, sortBy));
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
      <p>or the Yanking. <br />
        there are no rules.
      </p>
      <h2>
        <a href="/">return Home</a>
      </h2>
      <button onClick={handleRefresh} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" id="ref">Refresh Votes</button>
      <div className="mb-4 flex flex-wrap gap-4">
        <button
          onClick={() => setIs50Most(!is50Most)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${is50Most ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          50 Most
        </button>
        <div className="flex items-center bg-white bg-opacity-20 backdrop-blur rounded-lg px-3 py-2">
          <label className="mr-2 font-semibold text-black">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'college' | 'year')}
            className="border rounded text-black focus:bg-blue-500 focus:bg-opacity-50 focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="score">Score</option>
            <option value="college">College</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>
      <input
        type="text"
        placeholder="Search by name, college, or year..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full p-2 mb-4 border rounded backdrop-blur bg-white bg-opacity-20 focus:bg-blue-500 focus:bg-opacity-50 transition-colors text-black focus:text-white"
      />
      {/* FIX: Only hide the list if we are "loadingAll" (searching) 
         or if we are loading the very first page (yalies.length === 0 and loading).
      */}
      {loadingAll || (loading && yalies.length === 0) ? (
        <div className="text-center py-4">
          {loadingAll ? 'Loading all Yalies for search...' : 'Loading rankings...'}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {yalies.map((yalie) => {
              // ... existing list item code ...
              const fullName = `${yalie.fname} ${yalie.lname}`;
              const isIn50Most = fiftyMostNames.some(name => name.toLowerCase() === fullName.toLowerCase());
              const displayName = isIn50Most ? fullName : `${yalie.fname[0]}${yalie.lname[0]}`;
              return (
                <li key={yalie.key} className={`flex items-center justify-between p-4 border rounded text-black ${collegeColors[yalie.college] || 'bg-gray-100'}`}>
                  <div>
                    <span className="font-semibold">{displayName}</span> {isIn50Most && <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">50 Most</span>} - {yalie.year}, {yalie.college}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Score: {votes[yalie.key] || 0}</span>
                    <button onClick={() => handleVote(yalie.key, 1)} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">↑</button>
                    <button onClick={() => handleVote(yalie.key, -1)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">↓</button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* The Observer Target stays at the bottom */}
          <div ref={observerTarget} className="text-center py-4">
            {loading && 'Loading more Yalies...'} {/* Spinner/Text appears BELOW list */}
            {!hasMore && 'No more Yalies to load.'}
          </div>
        </>
      )}
    </div>
  );
}