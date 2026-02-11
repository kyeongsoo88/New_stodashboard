import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'

// GET: Redis에서 데이터 가져오기
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const data = await kv.get<string[]>(key)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to fetch insight data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST: Redis에 데이터 저장하기
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, items } = body

    if (!key || !items) {
      return NextResponse.json({ error: 'Key and items are required' }, { status: 400 })
    }

    await kv.set(key, items)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save insight data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}

