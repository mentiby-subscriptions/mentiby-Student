'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import AttendanceRecords from '@/components/AttendanceRecords'
import LoadingAnimation from '@/components/LoadingAnimation'
import { 
  Users, Home, Award, Calendar, GraduationCap,
  Sparkles, LogOut, Trophy
} from 'lucide-react'

function YourAttendanceContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  const cohortName = user?.cohortType && user?.cohortNumber 
    ? `${user.cohortType.charAt(0).toUpperCase() + user.cohortType.slice(1)} ${user.cohortNumber}`
    : 'Your Cohort'

  if (!user) {
    return (
      <LoadingAnimation 
        title="Loading" 
        steps={['Please wait...']}
        icon={<Award className="w-8 h-8 text-white" />}
      />
    )
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
                <p className="text-slate-500 text-xs">{cohortName}</p>
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
                onClick={() => router.push('/my-batches')}
                className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
              <Calendar className="w-4 h-4 inline-block mr-2" />
              My Schedule
              </button>
              <button
              className="px-4 sm:px-6 py-3 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5 whitespace-nowrap"
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
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your Attendance</h2>
            <p className="text-slate-400">Track your class attendance and performance</p>
        </div>

        {/* Attendance Records Component */}
        {user?.cohortType && user?.cohortNumber && user?.enrollmentId ? (
          <AttendanceRecords
            studentEnrollmentId={user.enrollmentId}
            cohortType={user.cohortType}
            cohortNumber={user.cohortNumber}
            studentName={user.name}
          />
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
            <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Missing Cohort Information</h3>
            <p className="text-yellow-400/80">
              Your cohort details are not available. Please log out and log in again.
            </p>
            <button
              onClick={signOut}
              className="mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function YourAttendancePage() {
  return (
    <AuthWrapper>
      <YourAttendanceContent />
    </AuthWrapper>
  )
}
