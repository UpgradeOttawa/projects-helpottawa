'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function HomePage() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('cities').select('*').then(({ data }) => {
      setCities(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎉 Supabase Connected!</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Cities: {cities.length}</h2>
          <div className="grid grid-cols-3 gap-4">
            {cities.map(c => (
              <div key={c.id} className="p-4 border-2 border-green-500 rounded">
                <p className="font-bold">{c.name}</p>
                <p className="text-sm">{c.is_active ? '✅ Active' : '⏸️ Inactive'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}