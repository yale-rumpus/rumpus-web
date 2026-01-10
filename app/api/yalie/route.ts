import { NextResponse } from 'next/server';

// CACHE FIX: This tells Next.js to cache the result of this function 
// for 3600 seconds (1 hour) or 86400 (24 hours). 
// 3600 is usually safer to handle potential errors without locking them in all day.
export const revalidate = 3600;

// Simple seeded random number generator for consistent daily selection
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Convert date to a numeric seed
function getDailySeed(): number {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return year * 10000 + month * 100 + day;
}

export async function GET() {
    try {
        const seed = getDailySeed();
        const page = Math.floor(seededRandom(seed) * 50);
        
        const res = await fetch("https://api.yalies.io/v2/people", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.YALIES_API_KEY}`,
            },
            body: JSON.stringify({
                query: "",
                filters: {},
                page: page,
                page_size: 50,
            }),
        });

        if (!res.ok) {
            throw new Error("Failed to fetch Yalie");
        }

        const json = await res.json();
        const people = json.data ?? json;
        
        // Use seeded random to pick a person from the page
        const personIndex = Math.floor(seededRandom(seed + 1) * people.length);
        const person = people[personIndex];

        return NextResponse.json({
            fname: person.first_name,
            lname: person.last_name,
            year: person.year,
            profile: person.profile,
            college: person.college,
        });
    } catch (error) {
        console.error('Error fetching Yalie:', error);
        return NextResponse.json({ error: 'Failed to fetch Yalie' }, { status: 500 });
    }
}
