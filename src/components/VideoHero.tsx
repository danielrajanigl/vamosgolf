"use client"

import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface VideoHeroProps {
  videoUrl?: string
  videoId?: string
  platform?: 'youtube' | 'vimeo' | 'custom'
  title?: string
  description?: string
  className?: string
}

export function VideoHero({ 
  videoUrl,
  videoId,
  platform = 'youtube',
  title,
  description,
  className = ''
}: VideoHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // YouTube Embed URL
  const getYouTubeEmbedUrl = (id: string) => {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`
  }

  // Vimeo Embed URL
  const getVimeoEmbedUrl = (id: string) => {
    return `https://player.vimeo.com/video/${id}?autoplay=1&muted=0&controls=1`
  }

  const getEmbedUrl = () => {
    if (videoUrl) return videoUrl
    if (platform === 'youtube' && videoId) return getYouTubeEmbedUrl(videoId)
    if (platform === 'vimeo' && videoId) return getVimeoEmbedUrl(videoId)
    return null
  }

  const embedUrl = getEmbedUrl()

  if (!embedUrl) {
    return (
      <div className={`bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-12 rounded-lg text-center ${className}`}>
        <p className="text-lg">Video wird geladen...</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "Video"}
        />
        
        {/* Overlay mit Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-white">
              {title && (
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-lg md:text-xl text-emerald-100 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

