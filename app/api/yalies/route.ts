import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '50', 10);
  const query = searchParams.get('query') || '';

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

    const yalies = people.map((person: any) => ({
      fname: person.first_name,
      lname: person.last_name,
      year: person.year,
      college: person.college,
      profile: person.profile,
      key: `${person.first_name}_${person.last_name}_${person.year}_${person.college}`, // unique key for voting
    }));

    return NextResponse.json(yalies);
  } catch (error) {
    console.error('Error fetching Yalies:', error);
    return NextResponse.json({ error: 'Failed to fetch Yalies' }, { status: 500 });
  }
}