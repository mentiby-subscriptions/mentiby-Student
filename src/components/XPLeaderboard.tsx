'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, RefreshCw, Crown, Medal, Award, Zap, Clock, Users, Search, BookOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { LeaderboardEntry } from '@/types'
import { cn } from '@/lib/utils'

interface Batch {
  cohortType: string
  cohortNumber: string
  batchName: string
}

interface XPLeaderboardProps {
  studentBatches?: Batch[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function XPLeaderboard({ studentBatches }: XPLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Get batch names for display
  const batchNames = studentBatches?.map(b => b.batchName).join(' & ') || ''

  const fetchLeaderboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError('')

      let allData: any[] = []
      
      // Fetch data for ALL enrolled batches
      if (studentBatches && studentBatches.length > 0) {
        console.log(`🔍 Fetching XP for ${studentBatches.length} batch(es)...`)
        
        // Fetch data for each batch in parallel
        const batchPromises = studentBatches.map(batch => 
          supabase
            .from('student_xp')
            .select('*')
            .eq('cohort_type', batch.cohortType)
            .eq('cohort_number', batch.cohortNumber)
        )
        
        const results = await Promise.all(batchPromises)
        
        // Combine all results
        for (const result of results) {
          if (result.error) {
            console.error('❌ Supabase error:', result.error)
            throw result.error
          }
          if (result.data) {
            allData.push(...result.data)
          }
        }
        
        // Remove duplicates (in case a student is in multiple batches)
        const seen = new Set()
        allData = allData.filter(entry => {
          const key = entry.enrollment_id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        
        // Sort by XP descending
        allData.sort((a, b) => b.xp - a.xp)
      }

      console.log(`📈 Records count: ${allData.length}`)

      const formattedData: LeaderboardEntry[] = allData.map((entry, index) => ({
        rank: index + 1,
        enrollment_id: entry.enrollment_id,
        full_name: entry.full_name,
        email: entry.email,
        cohort_type: entry.cohort_type,
        cohort_number: entry.cohort_number,
        xp: entry.xp,
        last_updated: entry.last_updated
      }))

      setLeaderboard(formattedData)
      if (allData.length > 0) {
        setLastUpdated(new Date().toLocaleString())
      }
    } catch (err) {
      console.error('❌ Error fetching leaderboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }, [studentBatches])

  // Apply search filter
  useEffect(() => {
    let filtered = [...leaderboard]

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLeaderboard(filtered)
  }, [leaderboard, searchTerm])

  // Initial load
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <Trophy className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30 text-white"
      default:
        return "bg-slate-800/30 hover:bg-slate-800/50 border-white/5 text-foreground"
    }
  }

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`
    return xp.toString()
  }

  const LoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <Zap className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-white">Fetching XP Data</p>
        <p className="text-sm text-slate-400">Loading leaderboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Batch XP Leaderboard
          </h1>
          <p className="text-sm text-slate-400">
            Rankings for {batchNames || 'your batches'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Show enrolled batches info */}
          {studentBatches && studentBatches.length > 1 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">
                {studentBatches.length} batches combined
              </span>
            </div>
          )}

          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Updated: {lastUpdated}</span>
            </div>
          )}
          
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Reload
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && filteredLeaderboard.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-blue-400">{filteredLeaderboard.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Top XP</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {filteredLeaderboard[0] ? formatXP(filteredLeaderboard[0].xp) : '0'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-slate-400">Avg XP</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {filteredLeaderboard.length > 0
                    ? formatXP(Math.round(filteredLeaderboard.reduce((sum, entry) => sum + entry.xp, 0) / filteredLeaderboard.length))
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingAnimation />}

      {/* Leaderboard */}
      {!loading && filteredLeaderboard.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-slate-800/30 text-sm font-semibold text-slate-400">
                <div className="w-16 flex-shrink-0">Rank</div>
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-24 flex-shrink-0">Cohort</div>
                <div className="w-20 flex-shrink-0">Batch</div>
                <div className="w-24 flex-shrink-0 text-right">XP</div>
              </div>

              {/* Leaderboard Entries */}
              <div className="space-y-1 p-2">
                {filteredLeaderboard.map((entry, index) => (
                  <div
                    key={entry.email}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border",
                      getRankStyle(index + 1)
                    )}
                  >
                    <div className="w-16 flex-shrink-0 flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <span className="font-bold">{index + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{entry.full_name}</div>
                    </div>

                    <div className="w-24 flex-shrink-0">
                      <span className="px-2 py-1 bg-white/10 rounded-lg text-xs font-medium">
                        {entry.cohort_type}
                      </span>
                    </div>

                    <div className="w-20 flex-shrink-0">
                      <span className="px-2 py-1 bg-white/10 rounded-lg text-xs font-medium">
                        {entry.cohort_number}
                      </span>
                    </div>

                    <div className="w-24 flex-shrink-0 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold text-lg">{formatXP(entry.xp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && leaderboard.length === 0 && !error && (
        <div className="text-center py-16 space-y-4">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-400">No XP Data Available</h3>
            <p className="text-sm text-slate-500 mt-2">
              No students found in your batches yet.
            </p>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && leaderboard.length > 0 && filteredLeaderboard.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <Search className="w-16 h-16 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-400">No Results Found</h3>
            <p className="text-sm text-slate-500 mt-2">
              Try adjusting your search term.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
