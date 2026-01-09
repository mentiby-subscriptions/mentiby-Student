import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

// GET: Fetch session details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (!tableName || !date) {
      return NextResponse.json({ error: 'Table and date are required' }, { status: 400 })
    }

    console.log(`Fetching session: table=${tableName}, date=${date}, time=${time}`)

    // Try to find session by date (and time if provided)
    let query = supabaseB.from(tableName).select('*').eq('date', date)
    
    if (time) {
      // Try exact match first
      query = query.eq('time', time)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
    }

    // If no sessions found with exact time, get first session for that date
    let session = sessions && sessions.length > 0 ? sessions[0] : null

    if (!session && time) {
      // Retry without time filter
      const { data: dateOnlySessions } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('date', date)
      
      session = dateOnlySessions && dateOnlySessions.length > 0 ? dateOnlySessions[0] : null
    }

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    console.log('Found session:', session.id)

    // Parse materials
    const materials = session.initial_session_material || ''
    const materialLinks = materials
      .split(',')
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0)

    return NextResponse.json({
      session: {
        ...session,
        materialLinks
      }
    })

  } catch (error: any) {
    console.error('Get session details error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
