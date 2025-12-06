
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/firebase/admin';

// This is the session login API route.
// It receives a Firebase ID token from the client, verifies it,
// and then creates a session cookie that is stored in the browser.
// This cookie is then used to authenticate server-side requests.
export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return new NextResponse('Missing or invalid Authorization header', { status: 401 });
  }
  
  const idToken = authorization.split('Bearer ')[1];
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return new NextResponse('Session created', { status: 200 });
  } catch (error) {
    console.error('Session cookie creation error:', error);
    return new NextResponse('Failed to create session', { status: 401 });
  }
}
