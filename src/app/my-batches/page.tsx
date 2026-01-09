'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Users, ChevronRight, ChevronLeft, Loader2, RefreshCw, 
  LogOut, Calendar, Sparkles, X, Clock, BookOpen, Award, Trophy,
  GraduationCap, Video, FileText, ExternalLink, Home
} from 'lucide-react'

interface Batch {
  enrollmentId: string
  studentName: string
  cohortType: string
  cohortNumber: string
  tableName: string
  batchName: string
  sessionCount: number
}

interface Session {
  id: number
  date: string
  day: string
  time: string
  subject: string
  topic?: string
  sessionType?: string
  meetingLink?: string
  sessionMaterial?: string
  sessionRecording?: string
  weekNumber?: number
  sessionNumber?: number
  tableName?: string
  batchName?: string
}

function MyBatchesContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  // Batches state
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Calendar state
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  const fetchBatches = async () => {
    if (!user?.email) {
      setError('No email found in session')
      setLoading(false)
      setInitialLoadComplete(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/student/batches?email=${encodeURIComponent(user.email)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch batches')
        setLoading(false)
        setInitialLoadComplete(true)
        return
      }

      const fetchedBatches = data.batches || []
      setBatches(fetchedBatches)
      
      // If only one batch, auto-select it and fetch sessions before showing anything
      if (fetchedBatches.length === 1) {
        setSelectedBatch(fetchedBatches[0])
        setCurrentMonth(new Date())
        // Don't set loading false yet - wait for sessions to load
        try {
          const sessionsResponse = await fetch(
            `/api/student/sessions?cohortType=${encodeURIComponent(fetchedBatches[0].cohortType)}&cohortNumber=${encodeURIComponent(fetchedBatches[0].cohortNumber)}&days=730&offset=-365`
          )
          const sessionsData = await sessionsResponse.json()
          if (sessionsResponse.ok) {
            setSessions(sessionsData.sessions || [])
          }
        } catch (err) {
          console.error('Error fetching sessions:', err)
        }
        setLoading(false)
        setInitialLoadComplete(true)
      } else {
        // Multiple batches - show batch selection
        setLoading(false)
        setInitialLoadComplete(true)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }

  const fetchSessions = async (batch: Batch) => {
    setLoadingSessions(true)
    try {
      const response = await fetch(
        `/api/student/sessions?cohortType=${encodeURIComponent(batch.cohortType)}&cohortNumber=${encodeURIComponent(batch.cohortNumber)}&days=730&offset=-365`
      )
      const data = await response.json()
      if (response.ok) {
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchBatches()
    }
  }, [user?.email])

  useEffect(() => {
    // Only fetch sessions on batch change if initial load is complete (user selected a batch manually)
    if (selectedBatch && initialLoadComplete && batches.length > 1) {
      fetchSessions(selectedBatch)
    }
  }, [selectedBatch])

  const handleSelectBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setCurrentMonth(new Date())
  }

  const handleBackToBatches = () => {
    setSelectedBatch(null)
    setSessions([])
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getSessionsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return sessions.filter(s => s.date === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isPastDate = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return checkDate < today
  }

  const handleSessionClick = (session: Session) => {
    sessionStorage.setItem('sessionPageData', JSON.stringify({
      table: selectedBatch?.tableName,
      date: session.date,
      time: session.time,
      batch: selectedBatch?.batchName || '',
      from: 'my-batches'
    }))
    router.push('/session')
  }

  // Get session type colors
  const getSessionTypeColors = (sessionType: string | undefined, isPast: boolean) => {
    if (isPast) {
      return {
        bg: 'bg-slate-700/30 hover:bg-slate-700/50',
        border: 'border-slate-600/20',
        text: 'text-slate-400',
        dot: 'text-slate-500'
      }
    }
    
    switch (sessionType?.toLowerCase()) {
      case 'live session':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30',
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          text: 'text-emerald-300',
          dot: 'text-emerald-400/70'
        }
      case 'self paced':
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
          border: 'border-blue-500/20 hover:border-blue-500/40',
          text: 'text-blue-300',
          dot: 'text-blue-400/70'
        }
      case 'project':
        return {
          bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
          border: 'border-purple-500/20 hover:border-purple-500/40',
          text: 'text-purple-300',
          dot: 'text-purple-400/70'
        }
      case 'assignment':
        return {
          bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30',
          border: 'border-amber-500/20 hover:border-amber-500/40',
          text: 'text-amber-300',
          dot: 'text-amber-400/70'
        }
      case 'contest':
        return {
          bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30',
          border: 'border-orange-500/20 hover:border-orange-500/40',
          text: 'text-orange-300',
          dot: 'text-orange-400/70'
        }
      case 'doubt session':
        return {
          bg: 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30',
          border: 'border-rose-500/20 hover:border-rose-500/40',
          text: 'text-rose-300',
          dot: 'text-rose-400/70'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 hover:from-slate-500/30 hover:to-gray-500/30',
          border: 'border-slate-500/20 hover:border-slate-500/40',
          text: 'text-slate-300',
          dot: 'text-slate-400/70'
        }
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-900/20 rounded-lg border border-white/5" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const daySessions = getSessionsForDate(day)
      const hasSession = daySessions.length > 0
      const todayClass = isToday(day)
      const isPast = isPastDate(day)

      days.push(
        <div
          key={day}
          className={`h-24 sm:h-32 rounded-lg border-2 transition-all duration-200 overflow-hidden ${
            todayClass
              ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/30'
              : hasSession
              ? isPast 
                ? 'border-slate-600/30 bg-slate-800/30'
                : 'border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-400/60'
              : 'border-white/5 bg-slate-900/30 hover:bg-slate-800/30'
          }`}
        >
          {/* Day number */}
          <div className="p-1.5 sm:p-2 flex justify-between items-start">
            <span className={`text-xs sm:text-sm font-medium ${
              todayClass ? 'text-amber-400 font-bold' : hasSession ? (isPast ? 'text-slate-500' : 'text-cyan-400') : 'text-slate-500'
            }`}>
              {day}
            </span>
            {todayClass && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-black rounded-full font-bold">
                Today
              </span>
            )}
          </div>

          {/* Sessions */}
          <div className="px-1.5 sm:px-2 space-y-1 overflow-y-auto max-h-16 sm:max-h-20 scrollbar-hide">
            {daySessions.map((session, idx) => {
              const colors = getSessionTypeColors(session.sessionType, isPast)
              return (
                <button
                  key={idx}
                  onClick={() => handleSessionClick(session)}
                  className={`w-full text-left px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs truncate transition-colors border ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  <span className="font-medium">{session.time?.slice(0, 5)}</span>
                  <span className={`ml-1 ${colors.dot}`}>• {session.subject}</span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {weekdays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days}
        </div>
      </div>
    )
  }

  // Show loading screen until initial load is complete
  if (loading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-teal-950/20" />
        </div>
        <div className="relative z-10 mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin" />
          <div className="absolute inset-2 w-[80px] h-[80px] rounded-full border-4 border-transparent border-b-cyan-400 border-l-green-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <p className="relative z-10 text-slate-400">Loading your batches...</p>
      </div>
    )
  }

  // Calendar View (when a batch is selected)
  if (selectedBatch) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-teal-950/20" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {batches.length > 1 && (
                  <button
                    onClick={handleBackToBatches}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    {selectedBatch.batchName}
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    {selectedBatch.sessionCount} sessions • ID: {selectedBatch.enrollmentId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-white font-medium text-sm">{user?.name || 'Student'}</p>
                  <p className="text-slate-500 text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={signOut}
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
                className="px-4 sm:px-6 py-3 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5 whitespace-nowrap"
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
                onClick={() => router.push('/xp-leaderboard')}
                className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 inline-block mr-2" />
                XP Leaderboard
              </button>
            </div>
          </div>
        </nav>

        {/* Calendar Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <button
              onClick={() => navigateMonth('prev')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 hover:border-white/20 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">Previous</span>
            </button>

            <h2 className="text-xl sm:text-3xl font-bold text-white">
              {formatMonthYear(currentMonth)}
            </h2>

            <button
              onClick={() => navigateMonth('next')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 hover:border-white/20 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <span className="hidden sm:inline text-sm">Next</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/30 border-2 border-amber-400" />
              <span className="text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-500/20 border-2 border-cyan-500/50" />
              <span className="text-slate-400">Upcoming Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-700/50 border border-slate-600/50" />
              <span className="text-slate-400">Past Class</span>
            </div>
          </div>

          {/* Loading */}
          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin" />
                <div className="absolute inset-1.5 w-[62px] h-[62px] rounded-full border-4 border-transparent border-b-cyan-400 border-l-green-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-sm">Loading sessions...</p>
            </div>
          ) : (
            renderCalendar()
          )}

          {/* Summary */}
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">Sessions this month</h3>
                <p className="text-slate-400 text-sm">
                  {sessions.filter(s => {
                    const d = new Date(s.date)
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
                  }).length} sessions scheduled
                </p>
              </div>
              {batches.length > 1 && (
                <button
                  onClick={handleBackToBatches}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors text-sm"
                >
                  <Users className="w-4 h-4" />
                  View Other Batches
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Batches List View
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-teal-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Menti<span className="text-emerald-400">BY</span>
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
                onClick={signOut}
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
              className="px-4 sm:px-6 py-3 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5 whitespace-nowrap"
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
              onClick={() => router.push('/xp-leaderboard')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 inline-block mr-2" />
              XP Leaderboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
            Your <span className="text-emerald-400">Batches</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg">
            Select a batch to view calendar and sessions
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin" />
              <div className="absolute inset-2 w-[80px] h-[80px] rounded-full border-4 border-transparent border-b-cyan-400 border-l-green-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-slate-400">Loading your batches...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchBatches}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && batches.length === 0 && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No batches found</h3>
            <p className="text-slate-400 mb-6">
              You don&apos;t have any batches assigned yet. Please contact support.
            </p>
            <button
              onClick={fetchBatches}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}

        {/* Batch Grid */}
        {!loading && !error && batches.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <p className="text-slate-400 text-sm sm:text-base">
                <span className="text-white font-semibold">{batches.length}</span> batch{batches.length !== 1 ? 'es' : ''} enrolled
              </p>
              <button
                onClick={fetchBatches}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {batches.map((batch, index) => (
                <button
                  key={batch.enrollmentId}
                  onClick={() => handleSelectBatch(batch)}
                  className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                    </div>

                    {/* Batch Name */}
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                      {batch.batchName}
                    </h3>

                    {/* Enrollment ID */}
                    <p className="text-slate-500 text-xs font-mono mb-2">
                      ID: {batch.enrollmentId}
                    </p>

                    {/* Session Count */}
                    <p className="text-slate-400 text-sm mb-4">
                      {batch.sessionCount} session{batch.sessionCount !== 1 ? 's' : ''} scheduled
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center text-emerald-400 text-sm font-medium">
                      <span>View Calendar</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function MyBatchesPage() {
  return (
    <AuthWrapper>
      <MyBatchesContent />
    </AuthWrapper>
  )
}
