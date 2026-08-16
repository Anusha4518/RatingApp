// GET /api/health — simple health check to confirm the server is running
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Store Rating API Server is running.',
  });
}
