"use client";

import { useEffect, useRef, useState } from "react";
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
    Berkeley: "bg-red-100",
    Branford: "bg-blue-100",
    "Grace Hopper": "bg-green-100",
    Davenport: "bg-yellow-100",
    "Ezra Stiles": "bg-purple-100",
    Interdisciplinary: "bg-slate-100",
    "Jonathan Edwards": "bg-pink-100",
    Morse: "bg-indigo-100",
    "Pauli Murray": "bg-gray-100",
    Pierson: "bg-orange-100",
    Saybrook: "bg-teal-100",
    Silliman: "bg-cyan-100",
    "Timothy Dwight": "bg-lime-100",
    Trumbull: "bg-emerald-100",
    "Benjamin Franklin": "bg-violet-100",
};

export default function YaliesRankingPage() {
    const [yalies, setYalies] = useState<Yalie[]>([]);
    const [votes, setVotes] = useState<Votes>({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isProcessing50, setIsProcessing50] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);

    const [searchInput, setSearchInput] = useState("");
    const [fiftyMostNames, setFiftyMostNames] = useState<string[]>([]);
    const [is50Most, setIs50Most] = useState(true);
    const [sortBy, setSortBy] = useState<"score" | "college" | "year">("score");

    const observerTarget = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const normalize = (str: string) =>
        str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const sortYalies = (ylist: Yalie[], v: Votes, sort: string) => {
        return [...ylist].sort((a, b) => {
            if (sort === "college") return a.college.localeCompare(b.college);
            if (sort === "year") return parseInt(String(a.year)) - parseInt(String(b.year));
            const scoreA = v[a.key] || 0;
            const scoreB = v[b.key] || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return `${a.fname}${a.lname}`.localeCompare(`${b.fname}${b.lname}`);
        });
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [vRes, nRes] = await Promise.all([fetch("/api/votes"), fetch("/50most.json")]);
                const vData = await vRes.json();
                const nData = await nRes.json();
                setVotes(vData);
                setFiftyMostNames(nData);
                console.log("✅ Votes loaded from gist:", Object.keys(vData).length, "entries");
            } catch (e) {
                console.error("Init error", e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (is50Most && fiftyMostNames.length > 0) {
            loadAll50Mosters();
        } else if (!is50Most) {
            loadInitialPage();
        }
        return () => abortControllerRef.current?.abort();
    }, [is50Most, fiftyMostNames]);

    // Log missing names when processing finishes
    useEffect(() => {
        if (!isProcessing50 && fiftyMostNames.length > 0 && is50Most) {
            const foundNames = yalies.map(y => normalize(`${y.fname} ${y.lname}`));
            const missing = fiftyMostNames.filter(name => !foundNames.includes(normalize(name)));
            if (missing.length > 0) {
                console.log("⚠️ The following names from 50most.json were not found in the database:", missing);
            } else {
                console.log("✅ All names from 50most.json found!");
            }
        }
    }, [isProcessing50]);

    useEffect(() => {
        if (is50Most) return;
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        if (searchInput.trim()) {
            setLoading(true);
            fetch(`/api/yalies?query=${encodeURIComponent(searchInput)}`, { signal: abortControllerRef.current.signal })
                .then(res => res.json())
                .then(data => {
                    setYalies(sortYalies(data, votes, sortBy));
                    setHasMore(false);
                })
                .catch(e => {
                    if (e.name !== "AbortError") console.error(e);
                })
                .finally(() => setLoading(false));
        } else {
            loadInitialPage();
        }
    }, [searchInput, is50Most, votes, sortBy]);

    const loadAll50Mosters = async () => {
        setIsProcessing50(true);
        setYalies([]);
        setProcessedCount(0);
        const foundKeys = new Set<string>();

        await Promise.all(
            fiftyMostNames.map(async name => {
                try {
                    const res = await fetch(`/api/yalies?page=1&page_size=10&query=${encodeURIComponent(name)}`);
                    if (!res.ok) return;
                    const data: Yalie[] = await res.json();

                    const match = data.find(y => normalize(`${y.fname} ${y.lname}`) === normalize(name));

                    if (match && !foundKeys.has(match.key)) {
                        foundKeys.add(match.key);
                        setYalies(prev => sortYalies([...prev, match], votes, sortBy));
                    }
                } catch (e) {
                    console.error(`Error finding ${name}`, e);
                } finally {
                    setProcessedCount(prev => prev + 1);
                }
            }),
        );

        setIsProcessing50(false);
    };

    const loadInitialPage = async () => {
        setLoading(true);
        try {
            // Wait for votes to be loaded (with a reasonable timeout)
            let attempts = 0;
            const maxAttempts = 10;
            while (Object.keys(votes).length === 0 && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            // First, load people with scores by searching for their names
            const peopleWithScores = await loadPeopleWithScores();

            // Fill the rest of the page with normal loading
            const remainingSlots = 50 - peopleWithScores.length;
            let allYalies = peopleWithScores;

            if (remainingSlots > 0) {
                const normalPeople = await loadNormalPeople(remainingSlots);
                allYalies = [...peopleWithScores, ...normalPeople];
            }

            setYalies(sortYalies(allYalies, votes, sortBy));
            setPage(1);
            setHasMore(true);
        } finally {
            setLoading(false);
        }
    };

    const loadPeopleWithScores = async () => {
        const peopleWithScores: Yalie[] = [];
        const foundKeys = new Set<string>();

        // Get all people who have scores (votes)
        const peopleWithVotes = Object.keys(votes).filter(key => votes[key] !== 0);

        // For each person with votes, search for them by name
        for (const key of peopleWithVotes) {
            try {
                // We need to search by name, but we only have the key
                // Let's make a request to get the person's details first
                const res = await fetch(`/api/yalies?page=1&page_size=1&query=${encodeURIComponent(key)}`);
                if (!res.ok) continue;

                const data: Yalie[] = await res.json();
                if (data.length > 0) {
                    const person = data[0];
                    if (!foundKeys.has(person.key)) {
                        foundKeys.add(person.key);
                        peopleWithScores.push(person);
                    }
                }
            } catch (e) {
                console.error(`Error finding person with key ${key}`, e);
            }
        }

        return peopleWithScores.slice(0, 50);
    };

    const loadNormalPeople = async (count: number) => {
        const normalPeople: Yalie[] = [];
        let currentPage = 1;
        const pageSize = 50;

        // Load people normally until we have enough
        while (normalPeople.length < count) {
            const res = await fetch(`/api/yalies?page=${currentPage}&page_size=${pageSize}`);
            const data: Yalie[] = await res.json();

            if (data.length === 0) break;

            normalPeople.push(...data);
            currentPage++;
        }

        return normalPeople.slice(0, count);
    };

    useEffect(() => {
        if (is50Most || !hasMore || loading) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) loadMore();
            },
            { threshold: 0.5 },
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [yalies, hasMore, loading, is50Most]);

    const loadMore = async () => {
        setLoading(true);
        const nextPage = page + 1;
        const res = await fetch(`/api/yalies?page=${nextPage}&page_size=50`);
        const data = await res.json();
        if (data.length === 0) setHasMore(false);
        else {
            setYalies(prev => sortYalies([...prev, ...data], votes, sortBy));
            setPage(nextPage);
        }
        setLoading(false);
    };

    const handleVote = async (key: string, delta: number) => {
        const newVotes = { ...votes, [key]: (votes[key] || 0) + delta };
        setVotes(newVotes);
        setYalies(prev => sortYalies(prev, newVotes, sortBy));
        await fetch("/api/votes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newVotes),
        });
    };

    const displayedYalies = is50Most
        ? yalies.filter(y => normalize(`${y.fname} ${y.lname} ${y.college}`).includes(normalize(searchInput)))
        : yalies;

    const progressPercent = fiftyMostNames.length > 0 ? (processedCount / fiftyMostNames.length) * 100 : 0;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Yalies Ranking</h1>
            <p>
                or the Yanking. <br />
                Note: for security and privacy reasons, only people in 50 most have their full names displayed. Everyone
                else only displays initials, year, and college (just like on fizz)
            </p>
            <h2>
                <a href="/">return Home</a>
            </h2>
            <br />
            <br />
            <h2>
                <a href="https://yalies.io/" target="_blank">
                    powered by Yalies API
                </a>
            </h2>

            <div className="mb-4 flex flex-wrap gap-4 mt-4">
                <button
                    onClick={() => setIs50Most(!is50Most)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${is50Most ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                    {is50Most ? "Showing 50 Most" : "Showing All"}
                </button>

                <div className="flex items-center bg-white bg-opacity-20 backdrop-blur rounded-lg px-3 py-2">
                    <label className="mr-2 font-semibold text-black">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={e => {
                            const val = e.target.value as any;
                            setSortBy(val);
                            setYalies(prev => sortYalies(prev, votes, val));
                        }}
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
                onChange={e => setSearchInput(e.target.value)}
                className="w-full p-2 mb-4 border rounded backdrop-blur bg-white bg-opacity-20 focus:bg-blue-500 focus:bg-opacity-50 transition-colors text-black focus:text-white"
            />

            {isProcessing50 && (
                <div className="mb-6">
                    <div className="text-blue-600 font-bold mb-2 text-center p-2">
                        🔍 Scanning Database... ({yalies.length} found)
                    </div>
                    {/* LOADING BAR */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                        <div
                            className="bg-blue-600 h-2.5 transition-all duration-300 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <ul className="space-y-2">
                {displayedYalies.map(yalie => {
                    const fullName = `${yalie.fname} ${yalie.lname}`;
                    const isIn50Most = fiftyMostNames.some(name => normalize(name) === normalize(fullName));
                    const displayName = isIn50Most ? fullName : `${yalie.fname[0]}${yalie.lname[0]}`;

                    return (
                        <li
                            key={yalie.key}
                            className={`flex items-center justify-between p-4 border rounded text-black ${collegeColors[yalie.college] || "bg-gray-100"}`}
                        >
                            <div>
                                <span className="font-semibold">{displayName}</span>{" "}
                                {isIn50Most && (
                                    <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded inline-flex whitespace-nowrap ">
                                        50 Most
                                    </span>
                                )}{" "}
                                - {yalie.year}, {yalie.college}
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
                {loading && !isProcessing50 && "Loading more Yalies..."}
                {!hasMore && !is50Most && "No more Yalies to load."}
            </div>
        </div>
    );
}
