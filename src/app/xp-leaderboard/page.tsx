'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import XPLeaderboard from '@/components/XPLeaderboard'
import { 
  Home, Calendar, Award, Trophy, LogOut, Sparkles, GraduationCap, Loader2
} from 'lucide-react'

interface Batch {
  cohortType: string
  cohortNumber: string
  batchName: string
}

function XPLeaderboardContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBatches = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/student/batches?email=${encodeURIComponent(user.email)}`)
        const data = await response.json()

        if (response.ok && data.batches) {
          setBatches(data.batches.map((b: any) => ({
            cohortType: b.cohortType,
            cohortNumber: b.cohortNumber,
            batchName: b.batchName
          })))
        }
      } catch (err) {
        console.error('Error fetching batches:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [user?.email])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-slate-950 to-orange-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Menti<span className="text-amber-400">BY</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-white font-medium text-sm">{user?.name || 'Student'}</p>
                <p className="text-slate-500 text-xs">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => router.push('/home')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Home className="w-4 h-4 inline-block mr-2" />
              Home
            </button>
            <button
              onClick={() => router.push('/my-batches')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 inline-block mr-2" />
              My Schedule
            </button>
            <button
              onClick={() => router.push('/your-attendance')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Award className="w-4 h-4 inline-block mr-2" />
              My Attendance
            </button>
            <button
              className="px-4 sm:px-6 py-3 text-sm font-medium text-amber-400 border-b-2 border-amber-400 bg-amber-500/5 whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 inline-block mr-2" />
              XP Leaderboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-amber-500 border-r-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/50 animate-pulse">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Loading leaderboard...</p>
          </div>
        ) : (
          <XPLeaderboard studentBatches={batches.length > 0 ? batches : undefined} />
        )}
      </main>
    </div>
  )
}

export default function XPLeaderboardPage() {
  return (
    <AuthWrapper>
      <XPLeaderboardContent />
    </AuthWrapper>
  )
}
