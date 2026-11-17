import { NextResponse } from 'next/server';
import fiftyMostRaw from '@/public/50most.json';
import { normalizeName, parseFiftyMostEntry, parseFiftyMostList } from '@/lib/fiftyMost';

const fiftyMostBySearchName = new Map(
  parseFiftyMostList(fiftyMostRaw).map((entry) => [normalizeName(entry.searchName), entry])
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '50', 10);
  const rawQuery = searchParams.get('query') || '';

  // 50most.json entries look like: First "Pen Name" Last.
  // Search Yalies with the first and last words instead of the whole string.
  const parsedQuery = rawQuery ? parseFiftyMostEntry(rawQuery) : null;
  const query = parsedQuery?.penName ? parsedQuery.searchName : rawQuery;

  try {
    const res = await fetch("https://api.yalies.io/v2/people", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YALIES_API_KEY}`,
      },
      body: JSON.stringify(
        query ? {
          query,
          filters: {},
        } : {
          query: "",
          filters: {},
          page,
          page_size: pageSize,
        }
      ),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch Yalies");
    }

    const json = await res.json();
    const people = json.data ?? json;

    const yalies = people.map((person: any) => {
      const fiftyMostEntry = fiftyMostBySearchName.get(
        normalizeName(`${person.first_name} ${person.last_name}`)
      );

      return {
        fname: person.first_name,
        lname: person.last_name,
        year: person.year,
        college: person.college,
        profile: person.profile,
        key: `${person.first_name}_${person.last_name}_${person.year}_${person.college}`, // unique key for voting
        penName: fiftyMostEntry?.penName ?? null,
        displayName: fiftyMostEntry?.displayName ?? null,
        isFiftyMost: Boolean(fiftyMostEntry),
      };
    });

    return NextResponse.json(yalies);
  } catch (error) {
    console.error('Error fetching Yalies:', error);
    return NextResponse.json({ error: 'Failed to fetch Yalies' }, { status: 500 });
  }
}