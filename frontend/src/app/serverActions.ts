'use server'

import { kv } from '@vercel/kv'

// Redis에서 데이터 가져오기
export async function getInsightData(key: string): Promise<string[] | null> {
  try {
    const data = await kv.get<string[]>(key)
    return data
  } catch (error) {
    console.error('Failed to fetch insight data:', error)
    return null
  }
}

// Redis에 데이터 저장하기
export async function saveInsightData(key: string, items: string[]): Promise<boolean> {
  try {
    await kv.set(key, items)
    return true
  } catch (error) {
    console.error('Failed to save insight data:', error)
    return false
  }
}

