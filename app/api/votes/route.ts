import { NextResponse } from 'next/server';

const GIST_ID = process.env.GIST_ID;
const VOTES_GITHUB_TOKEN = process.env.VOTES_GITHUB_TOKEN;

if (!GIST_ID || !VOTES_GITHUB_TOKEN) {
  throw new Error('GIST_ID and VOTES_GITHUB_TOKEN must be set');
}

export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${VOTES_GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch gist');
    }

    const gist = await res.json();
    const votesFile = gist.files['votes.json'];
    if (!votesFile) {
      return NextResponse.json({});
    }

    const votes = JSON.parse(votesFile.content);
    return NextResponse.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const votes = await request.json();

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VOTES_GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: {
          'votes.json': {
            content: JSON.stringify(votes),
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update gist');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating votes:', error);
    return NextResponse.json({ error: 'Failed to update votes' }, { status: 500 });
  }
}