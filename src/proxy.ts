import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAdminApi = pathname.startsWith('/api/admin')
  const isExamRoute = pathname.startsWith('/exam')

  const session = request.cookies.get('session')?.value
  const adminSession = request.cookies.get('admin_session')?.value

  // Admin pages protection
  if (isAdminPage) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const payload = await decrypt(adminSession)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Admin API routes protection
  if (isAdminApi) {
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 })
    }
    const payload = await decrypt(adminSession)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
  }

  // Student exam routes protection
  if (isExamRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const payload = await decrypt(session)
    if (!payload || payload.role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/exam/:path*'],
}
