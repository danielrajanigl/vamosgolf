"use client"

import { Play, MapPin, Calendar, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AndalusiaVideoHeroProps {
  videoId?: string
  videoUrl?: string
}

export function AndalusiaVideoHero({ videoId, videoUrl }: AndalusiaVideoHeroProps) {
  // YouTube Embed URL mit Loop für kurze Ausschnitte
  const getYouTubeEmbedUrl = (id: string) => {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&showinfo=0&loop=1&playlist=${id}&start=0`
  }

  const embedUrl = videoId 
    ? getYouTubeEmbedUrl(videoId)
    : videoUrl || null

  const title = "Wollen Sie dem kalten Winter entkommen?"
  const description = "Tauchen Sie ein in die Kultur Andalusiens mit kulinarischen und kulturellen Highlights. Erleben Sie Golf wie nie zuvor – eine authentische Golfreise mit Local Experience."

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
      {/* Video Background - Transparent Overlay */}
      <div className="absolute inset-0 z-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full scale-110 object-cover"
            style={{
              filter: 'brightness(0.4) contrast(1.1)',
              pointerEvents: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Andalusien Golfreise - Spanische Pros"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900">
            <div className="absolute inset-0 opacity-50" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
        )}
        
        {/* Gradient Overlay für bessere Textlesbarkeit */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="space-y-6 text-white">
            {/* Location Badge */}
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Andalusien, Spanien</span>
            </div>
            
            {/* Main Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {title}
            </h2>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed">
              Tauchen Sie ein in die <span className="text-emerald-400 font-semibold">Kultur Andalusiens</span> mit kulinarischen und kulturellen Highlights.
            </p>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              Erleben Sie Golf wie nie zuvor – eine <span className="text-white font-medium">authentische Golfreise mit Local Experience</span>. Unsere charismatischen spanischen Pros begleiten Sie durch unvergessliche Golf-Erlebnisse in einer der schönsten Regionen Europas.
            </p>

            {/* Pros Names */}
            <div className="flex flex-wrap items-center gap-4 pt-4 pb-6">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <Award className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-sm">Alvaro</div>
                  <div className="text-xs text-gray-300">Golf Pro</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <Award className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-sm">Pedro</div>
                  <div className="text-xs text-gray-300">PGA Pro</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/reisen">
                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6 h-auto shadow-xl"
                >
                  Reisen entdecken
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/reisen">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto backdrop-blur-sm"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Jetzt buchen
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4 pt-8 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold">Local Pros</div>
                  <div className="text-sm text-gray-300">Alvaro & Pedro</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold">Kultur & Küche</div>
                  <div className="text-sm text-gray-300">Authentisch Andalusisch</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold">Winter-Flucht</div>
                  <div className="text-sm text-gray-300">Sonniges Klima</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

