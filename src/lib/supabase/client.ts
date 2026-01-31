'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function HomePage() {
  const [cities, setCities] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [hazards, setHazards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: citiesData } = await supabase
        .from('cities')
        .select('*')
      
      const { data: neighborhoodsData } = await supabase
        .from('neighborhoods')
        .select('*')
      
      const { data: hazardsData } = await supabase
        .from('hazards')
        .select('*')
      
      setCities(citiesData || [])
      setNeighborhoods(neighborhoodsData || [])
      setHazards(hazardsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          🎉 Supabase Connected!
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Cities ({cities.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {cities.map(city => (
              <div 
                key={city.id}
                className={`p-4 rounded border-2 ${
                  city.is_active 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300'
                }`}
              >
                <p className="font-bold">{city.name}</p>
                <p className="text-sm text-gray-600">{city.province}</p>
                <p className="text-xs">
                  {city.is_active ? '✅ Active' : '⏸️ Inactive'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Ottawa Neighborhoods ({neighborhoods.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {neighborhoods.map(n => (
              <div key={n.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="font-semibold">{n.name}</p>
                <p className="text-sm text-gray-600">FSA: {n.fsa_code}</p>
                <p className="text-xs text-gray-500">
                  {n.center_lat.toFixed(4)}, {n.center_lng.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            ⚠️ Hazard Warnings ({hazards.length})
          </h2>
          <div className="space-y-3">
            {hazards.map(h => (
              <div 
                key={h.id}
                className={`p-4 rounded-lg border-l-4 ${
                  h.severity === 'high' ? 'border-red-500 bg-red-50' :
                  h.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                  'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold uppercase">
                      {h.hazard_type} - {h.severity}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{h.warning_text}</p>
                    <p className="text-xs text-gray-600 mt-2">FSA: {h.fsa_code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-green-100 border-2 border-green-500 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-800 mb-2">
            ✅ Database Connection Successful!
          </h3>
          <p className="text-green-700">
            Your Supabase database is fully operational and ready for production.
          </p>
          <p className="text-green-600 text-sm mt-2">
            Next: Add the map view and import your renovation photos!
          </p>
        </div>
      </div>
    </div>
  )
}