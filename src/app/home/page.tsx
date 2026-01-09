'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { 
  Calendar, Clock, Video, FileText,
  LogOut, Loader2, RefreshCw, Home, Award, Trophy, Users,
  BookOpen, GraduationCap, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react'

interface SessionData {
  id: string
  date: string
  day: string
  time: string
  subject: string
  topic: string
  sessionType: string
  subjectType: string
  meetingLink?: string
  sessionMaterial?: string
  initialSessionMaterial?: string
  sessionRecording?: string
  weekNumber: number
  sessionNumber: number
  tableName: string
  batchName: string
}

function HomePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, SessionData[]>>({})
  const [todaySession, setTodaySession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dates, setDates] = useState<string[]>([])
  const [dateOffset, setDateOffset] = useState(0)
  const [cohortName, setCohortName] = useState('')

  const fetchSessions = async (offset = 0) => {
    if (!user?.cohortType || !user?.cohortNumber) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/student/sessions?cohortType=${user.cohortType}&cohortNumber=${user.cohortNumber}&days=5&offset=${offset}`
      )
      const data = await response.json()

      if (response.ok) {
        setSessions(data.sessions || [])
        setSessionsByDate(data.sessionsByDate || {})
        setTodaySession(data.todaySession)
        setDates(data.dates || [])
        setCohortName(data.cohortName || '')
      } else {
        console.error('Error fetching sessions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions(dateOffset)
  }, [user?.cohortType, user?.cohortNumber, dateOffset])

  const navigateDates = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setDateOffset(prev => prev - 5)
    } else if (direction === 'next') {
      setDateOffset(prev => prev + 5)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const inputDate = new Date(dateStr + 'T00:00:00')
    inputDate.setHours(0, 0, 0, 0)
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: inputDate.getTime() === today.getTime(),
      isTomorrow: inputDate.getTime() === tomorrow.getTime()
    }
  }

  const getTimeColor = (time: string) => {
    if (!time) return 'text-slate-400'
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return 'text-amber-400'
    if (hour < 17) return 'text-blue-400'
    return 'text-emerald-400'
  }

  const getSessionTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'live session':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'self paced':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'project':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'assignment':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'contest':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const handleSessionClick = (session: SessionData) => {
    sessionStorage.setItem('sessionPageData', JSON.stringify({
      table: session.tableName,
      date: session.date,
      time: session.time,
      batch: session.batchName,
      from: 'home'
    }))
    router.push('/session')
  }

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
                <p className="text-slate-500 text-xs">{cohortName || `${user?.cohortType} ${user?.cohortNumber}`}</p>
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
              className="px-4 sm:px-6 py-3 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5 whitespace-nowrap"
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome, <span className="text-emerald-400">{user?.name?.split(' ')[0] || 'Student'}</span>! 👋
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Here&apos;s your class schedule for the next 5 days
          </p>
          {cohortName && (
            <p className="text-emerald-400/70 text-sm mt-1">
              📚 {cohortName}
            </p>
          )}
        </div>

        {loading ? (
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
            <p className="text-slate-400 text-sm">Loading your schedule...</p>
          </div>
        ) : !user?.cohortType || !user?.cohortNumber ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg mb-2">No cohort information found</p>
            <p className="text-slate-500 text-sm">Please log in again to refresh your session</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Session Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Today&apos;s Class
                  </h3>
                  <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {todaySession ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => handleSessionClick(todaySession)}
                      className="w-full text-left rounded-xl p-4 border bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-1 text-xs rounded-md font-medium border ${getSessionTypeColor(todaySession.sessionType)}`}>
                          {todaySession.sessionType || 'Session'}
                        </span>
                        <span className={`text-sm font-mono ${getTimeColor(todaySession.time)}`}>
                          {todaySession.time || 'TBD'}
                        </span>
                      </div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-emerald-300 transition-colors">{todaySession.subject}</h4>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{todaySession.topic || 'No topic specified'}</p>
                      
                      {/* Join Button */}
                      {todaySession.meetingLink ? (
                        <a
                          href={todaySession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20"
                        >
                          <Video className="w-4 h-4" />
                          Join Class
                        </a>
                      ) : (
                        <span className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-400 font-medium rounded-lg">
                          <Video className="w-4 h-4" />
                          No Meeting Link Yet
                        </span>
                      )}
                    </button>

                    {/* Session Materials */}
                    <div className="space-y-2">
                      {todaySession.initialSessionMaterial && (
                        <a
                          href={todaySession.initialSessionMaterial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                        >
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Pre-class Material</p>
                            <p className="text-xs text-slate-500 truncate">{todaySession.initialSessionMaterial}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      )}
                      {todaySession.sessionMaterial && (
                        <a
                          href={todaySession.sessionMaterial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                        >
                          <BookOpen className="w-5 h-5 text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Session Material</p>
                            <p className="text-xs text-slate-500 truncate">{todaySession.sessionMaterial}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      )}
                      {todaySession.sessionRecording && (
                        <a
                          href={todaySession.sessionRecording}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                        >
                          <Video className="w-5 h-5 text-purple-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Recording</p>
                            <p className="text-xs text-slate-500 truncate">{todaySession.sessionRecording}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 mb-1">No class today</p>
                    <p className="text-slate-500 text-sm">Enjoy your day off! 🎉</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Upcoming Classes
                    {dateOffset !== 0 && (
                      <span className="text-xs text-slate-500 font-normal ml-2">
                        ({dateOffset > 0 ? `+${dateOffset}` : dateOffset} days)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {dateOffset !== 0 && (
                      <button
                        onClick={() => setDateOffset(0)}
                        className="px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                      >
                        Today
                      </button>
                    )}
                    <button
                      onClick={() => fetchSessions(dateOffset)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-5 divide-x divide-white/5">
                  {dates.map((dateStr) => {
                    const { day, date, month, isToday, isTomorrow } = formatDate(dateStr)
                    const daySessions = sessionsByDate[dateStr] || []

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-[280px] sm:min-h-[320px] ${isToday ? 'bg-emerald-500/5' : ''}`}
                      >
                        {/* Date Header */}
                        <div className={`px-2 sm:px-3 py-3 text-center border-b border-white/5 ${isToday ? 'bg-emerald-500/10' : ''}`}>
                          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">{day}</p>
                          <p className={`text-lg sm:text-2xl font-bold ${isToday ? 'text-emerald-400' : 'text-white'}`}>{date}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{month}</p>
                          {isToday && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] sm:text-[10px] rounded font-medium">
                              TODAY
                            </span>
                          )}
                          {isTomorrow && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[8px] sm:text-[10px] rounded font-medium">
                              TOMORROW
                            </span>
                          )}
                        </div>

                        {/* Sessions */}
                        <div className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                          {daySessions.length > 0 ? (
                            daySessions.map((session) => (
                              <button
                                key={session.id}
                                onClick={() => handleSessionClick(session)}
                                className="group w-full text-left p-2 sm:p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-lg sm:rounded-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                                  <span className={`text-[10px] sm:text-xs font-mono ${getTimeColor(session.time)}`}>
                                    {session.time || 'TBD'}
                                  </span>
                                </div>
                                <p className="text-white text-[10px] sm:text-xs font-medium line-clamp-2 mb-1 group-hover:text-emerald-300 transition-colors">
                                  {session.subject}
                                </p>
                                <span className={`inline-block px-1 py-0.5 text-[8px] sm:text-[9px] rounded border ${getSessionTypeColor(session.sessionType)}`}>
                                  {session.sessionType || 'Session'}
                                </span>
                                {session.meetingLink && (
                                  <a
                                    href={session.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] rounded transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Video className="w-2.5 h-2.5" />
                                    Join
                                  </a>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-20 sm:h-24">
                              <p className="text-slate-600 text-[10px] sm:text-xs">No class</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  onClick={() => navigateDates('prev')}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-emerald-500/50 bg-slate-900 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm text-slate-400 min-w-[100px] text-center">
                  {dateOffset === 0 ? 'This week' : dateOffset > 0 ? `+${dateOffset} days` : `${dateOffset} days`}
                </span>
                
                <button
                  onClick={() => navigateDates('next')}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-emerald-500/50 bg-slate-900 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function HomePageWrapper() {
  return (
    <AuthWrapper>
      <HomePage />
    </AuthWrapper>
  )
}
