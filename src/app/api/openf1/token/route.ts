import { NextRequest, NextResponse } from 'next/server';

// Token cache
interface CachedToken {
  access_token: string;
  expires_at: number; // Unix timestamp
}

let tokenCache: CachedToken | null = null;

/**
 * OpenF1 Token Management API Route
 *
 * Fetches OAuth2 access token from OpenF1 API
 * Caches token and auto-refreshes before expiry
 *
 * Security: Credentials stored server-side in .env
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we have a valid cached token
    if (tokenCache && tokenCache.expires_at > Date.now() + 60000) {
      // Token valid for at least 1 more minute
      return NextResponse.json({
        access_token: tokenCache.access_token,
        cached: true,
        expires_in: Math.floor((tokenCache.expires_at - Date.now()) / 1000)
      });
    }

    // Fetch new token
    const username = process.env.OPENF1_USERNAME;
    const password = process.env.OPENF1_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'OpenF1 credentials not configured' },
        { status: 500 }
      );
    }

    const tokenUrl = 'https://api.openf1.org/token';
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenF1 token fetch failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch OpenF1 token', details: errorText },
        { status: response.status }
      );
    }

    const tokenData = await response.json();

    // Cache the token
    const expiresIn = parseInt(tokenData.expires_in || '3600');
    tokenCache = {
      access_token: tokenData.access_token,
      expires_at: Date.now() + (expiresIn * 1000)
    };

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: expiresIn,
      cached: false
    });

  } catch (error) {
    console.error('OpenF1 token API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to manually invalidate cache
 * Useful for testing or troubleshooting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'invalidate') {
      tokenCache = null;
      return NextResponse.json({ success: true, message: 'Token cache invalidated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
