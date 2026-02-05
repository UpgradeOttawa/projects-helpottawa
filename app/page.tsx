'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalProjects: 0,
    neighborhoods: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [photosRes, projectsRes, neighborhoodsRes] = await Promise.all([
        supabase.from('photos').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('neighborhoods').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalPhotos: photosRes.count || 0,
        totalProjects: projectsRes.count || 0,
        neighborhoods: neighborhoodsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  const features = [
    {
      title: '📍 Renovation Map',
      description: 'Browse renovation photos by neighborhood on an interactive map',
      href: '/map',
      color: 'bg-blue-600 hover:bg-blue-700',
      stats: `${stats.totalPhotos} photos`,
    },
    {
      title: '⚠️ Hazard Map',
      description: 'View construction hazards and safety information by location',
      href: '/hazards',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      stats: 'Coming soon',
    },
    {
      title: '📤 Upload & Manage',
      description: 'Upload new photos, tag them, and manage your renovation portfolio',
      href: '/admin',
      color: 'bg-green-600 hover:bg-green-700',
      stats: 'Admin access',
    },
    {
      title: '🔬 Vision Analyzer',
      description: 'AI-powered room detection, measurements, and construction analysis',
      href: '#analyzer',
      color: 'bg-purple-600 hover:bg-purple-700',
      stats: 'V3-Butterfly',
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900">
            🏗️ Help Ottawa
          </h1>
          <p className="text-gray-600 mt-2">
            Renovation & Construction Intelligence Platform
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 mb-1">Total Photos</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPhotos}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 mb-1">Projects</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 mb-1">Neighborhoods</p>
            <p className="text-3xl font-bold text-purple-600">{stats.neighborhoods}</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className={`${feature.color} text-white rounded-xl shadow-lg p-8 transition-all hover:scale-105 hover:shadow-xl relative overflow-hidden group`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
              </div>

              {/* Content */}
              <div className="relative">
                <h2 className="text-3xl font-bold mb-3">{feature.title}</h2>
                <p className="text-white text-opacity-90 mb-4 text-lg">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm bg-white bg-opacity-20 px-4 py-2 rounded-full">
                    {feature.stats}
                  </span>
                  {feature.external ? (
                    <span className="text-sm">Desktop App →</span>
                  ) : (
                    <span className="text-2xl group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/upload"
              className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="text-3xl">📤</span>
              <div>
                <p className="font-semibold">Upload Photos</p>
                <p className="text-sm text-gray-600">Add new renovation photos</p>
              </div>
            </a>
            <a
              href="/map"
              className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <span className="text-3xl">🗺️</span>
              <div>
                <p className="font-semibold">View Map</p>
                <p className="text-sm text-gray-600">Browse by location</p>
              </div>
            </a>
            <a
              href="/admin"
              className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
            >
              <span className="text-3xl">⚙️</span>
              <div>
                <p className="font-semibold">Admin Panel</p>
                <p className="text-sm text-gray-600">Manage content</p>
              </div>
            </a>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-4">About This Platform</h3>
          <p className="text-lg text-white text-opacity-90 mb-4">
            Help Ottawa is a comprehensive renovation intelligence platform that combines:
          </p>
          <ul className="space-y-2 text-white text-opacity-90">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span><strong>Photo mapping</strong> - Geospatially organized renovation documentation</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span><strong>Manual tagging</strong> - Room types, neighborhoods, and construction phases</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span><strong>Hazard tracking</strong> - Construction safety and risk management</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span><strong>Vision AI</strong> - Automated analysis (V3-Butterfly integration)</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center text-gray-600">
          <p>Help Ottawa - Renovation Intelligence Platform</p>
          <p className="text-sm mt-2">
            v1.0 - Simple Upload + Map + Manual Tagging
          </p>
        </div>
      </footer>
    </div>
  );
}
