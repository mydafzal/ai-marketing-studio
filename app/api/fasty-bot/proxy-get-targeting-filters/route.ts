import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the expected structure of the backend response's filters
// This should match the structure used in AudienceTargetingSelector.tsx
interface FilterItem {
  name: string;
  id: string;
}

interface TargetingFiltersDataStructure {
  interest_filters: { [category: string]: FilterItem[] };
  demographic_filters: {
    life_events: { [category: string]: FilterItem[] };
    family_statuses: FilterItem[];
    industries: FilterItem[];
    household_income: { [country: string]: FilterItem[] };
    income: FilterItem[];
  };
  behaviour_filters: { [category: string]: FilterItem[] };
}

interface BackendResponse {
  success: boolean;
  filters?: TargetingFiltersDataStructure;
  message?: string;
  error?: string;
}

export async function GET(req: Request) {
  console.log('GET /api/fasty-bot/proxy-get-targeting-filters called');

//   const token = await getToken({ req, secret: process.env.AUTH_SECRET });

//   if (!token || !token.accessToken) {
//     console.error('Authentication failed: No token or access token found');
//     return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
//   }
  const backendUrl = process.env.FASTY_API_URL;
  if (!backendUrl) {
    console.error('Server configuration error: FASTY_API_URL is not set.');
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  const targetUrl = `${backendUrl}/facebook/campaign-creation-flow/targeting-filters`;
  console.log(`Proxying GET request to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
      },
      cache: 'no-store' // Ensure fresh data is fetched every time
    });

    console.log(`Backend response status: ${response.status} ${targetUrl}`);
    const json_response = await response.json()
    const data: BackendResponse = json_response;
    console.log('Backend response data received (structure check):', { success: data.success, hasFilters: !!data.filters });


    if (!response.ok) {
      console.error(`Backend error: ${response.status}`, data);
      return NextResponse.json(
        { success: false, message: data.message || data.error || `Backend request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    // Return the successful response from the backend
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch targeting filters from backend.' }, { status: 500 });
  }
}
