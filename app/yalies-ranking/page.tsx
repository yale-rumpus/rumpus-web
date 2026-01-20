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

  // Loading states
  const [loading, setLoading] = useState(false); // For pagination
  const [loadingAll, setLoadingAll] = useState(true); // For initial load / search

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [votedKey, setVotedKey] = useState('');

  // 50 Most Logic: Default is TRUE
  const [fiftyMostNames, setFiftyMostNames] = useState<string[]>([]);
  const [is50Most, setIs50Most] = useState(true);

  const [sortBy, setSortBy] = useState<'score' | 'college' | 'year'>('score');
  const observerTarget = useRef<HTMLDivElement>(null);

  // CHANGED: Added size parameter to override the default 50 limit
  const fetchYalies = async (pageNum: number, query: string = '', size: number = 50) => {
    const res = await fetch(`/api/yalies?page=${pageNum}&page_size=${size}&query=${encodeURIComponent(query)}`);
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
    return [...ylist].sort((a, b) => {
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

  // 1. Load the 50 Most JSON first
  useEffect(() => {
    fetch('/50most.json')
      .then(res => res.json())
      .then(data => {
        setFiftyMostNames(data);
      })
      .catch(console.error);
  }, []);

  // 2. Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 3. Main Data Orchestration
  useEffect(() => {
    // If we are in 50 Most mode but haven't loaded the names list yet, wait.
    if (is50Most && fiftyMostNames.length === 0) return;

    const loadData = async () => {
      setLoadingAll(true);
      setYalies([]);
      setPage(1);

      try {
        const votesData = await fetchVotes();
        setVotes(votesData);

        let query = search;
        let pageSize = 50; // Default size

        if (is50Most) {
          // Construct the OR query
          const namesQuery = fiftyMostNames.join(' OR ');
          query = search ? `${search} AND (${namesQuery})` : namesQuery;

          // CRITICAL FIX: Request a much larger page size (e.g., 200) 
          // because the search is "fuzzy". If we only ask for 50, 
          // the API might return 48 close matches (which we filter out) 
          // and only 2 exact matches.
          pageSize = 200;
        }

        // Pass the calculated pageSize to the fetch function
        const data = await fetchYalies(1, query, pageSize);

        // Strict client-side filtering to clean up the "fuzzy" results
        let filtered = data;
        if (is50Most) {
          filtered = data.filter((y: Yalie) =>
            fiftyMostNames.some(name => name.toLowerCase() === `${y.fname} ${y.lname}`.toLowerCase())
          );
        }

        setYalies(sortYalies(filtered, votesData, sortBy));
        setHasMore(!is50Most);
      } catch (error) {
        console.error('Error loading data:', error);
        if (is50Most) setIs50Most(false);
      } finally {
        setLoadingAll(false);
        setLoading(false);
      }
    };

    loadData();

    // Reset infinite scroll observer if leaving 50 most mode
    if (!is50Most) {
      setHasMore(true);
    }

  }, [search, is50Most, fiftyMostNames, sortBy]);

  // 4. Infinite Scroll (Only active if NOT 50 Most and NOT searching)
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
              setYalies(prev => sortYalies([...prev, ...newYalies], votes, sortBy));
              setPage(nextPage);
            }
          } catch (error) {
            setHasMore(false);
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadingAll, search, is50Most, votes, sortBy]);

  const handleRefresh = async () => {
    const newVotes = await fetchVotes();
    setVotes(newVotes);
    setYalies(sortYalies(yalies, newVotes, sortBy));
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
          {is50Most ? 'Showing: 50 Most' : 'Show: 50 Most'}
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

      {loadingAll || (loading && yalies.length === 0) ? (
        <div className="text-center py-4">
          {loadingAll ? 'Searching...' : 'Loading rankings...'}
        </div>
      ) : (
        <>
          <ul className="space-y-2 min-h-[50vh]">
            {yalies.map((yalie) => {
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
            {yalies.length === 0 && !loading && (
              <li className="text-center p-4 text-gray-500">No results found.</li>
            )}
          </ul>

          <div ref={observerTarget} className="text-center py-4 h-10">
            {loading && 'Loading more Yalies...'}
            {!hasMore && !loading && <span className="text-gray-400 text-sm">End of list</span>}
          </div>
        </>
      )}
    </div>
  );
}