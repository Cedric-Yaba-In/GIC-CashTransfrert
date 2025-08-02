'use client'

interface ContentLoaderProps {
  loading: boolean
  children: React.ReactNode
}

export default function ContentLoader({ loading, children }: ContentLoaderProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Chargement...</p>
          </div>
        </div>
      )}
    </div>
  )
}