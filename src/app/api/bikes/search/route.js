import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json({ bikes: [] });
  }

  try {
    const appId = process.env.BIKE_INDEX_APP_ID;
    const url = new URL('https://bikeindex.org/api/v3/search');
    url.searchParams.append('query', query);
    url.searchParams.append('per_page', '10');
    
    if (appId) {
      url.searchParams.append('app_id', appId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Bike Index API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bike Index selection error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Bike Index' }, { status: 500 });
  }
}
