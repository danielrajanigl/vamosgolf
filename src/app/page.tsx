import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, Star, Shield, Calendar, Sparkles } from 'lucide-react'
import { NewsletterCTA } from '@/components/CTAs/NewsletterCTA'
import { AndalusiaVideoHero } from '@/components/AndalusiaVideoHero'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Golf Course Image - Leicht und luftig */}
      <section className="relative h-[80vh] min-h-[700px] overflow-hidden">
        {/* Background Image - Spanischer Golfplatz mit grünen Greens */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/20 to-white/80"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-gray-900 drop-shadow-lg animate-slide-up">
                Premium Golfreisen
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto drop-shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Entdecke unvergessliche Golf-Erlebnisse an Spaniens schönsten Plätzen zwischen Meer und Grün
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/shop">
                  <Button 
                    size="lg" 
                    className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    Jetzt buchen
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/reisen">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-lg px-8 py-6 h-auto bg-white/90 backdrop-blur-sm transition-all duration-300"
                  >
                    Reisen entdecken
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(255 255 255)"/>
          </svg>
        </div>
      </section>

      {/* Andalusien Video Hero Section */}
      <section className="py-0">
        <AndalusiaVideoHero 
          videoId={process.env.NEXT_PUBLIC_ANDALUSIA_VIDEO_ID}
          videoUrl={process.env.NEXT_PUBLIC_ANDALUSIA_VIDEO_URL}
        />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Warum VamosGolf?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Premium Golfreisen mit professioneller Betreuung und unvergesslichen Erlebnissen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-50 mb-4 group-hover:bg-sky-100 transition-colors">
                <MapPin className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Locations</h3>
              <p className="text-gray-600">
                Die schönsten Golfplätze der Welt ausgewählt
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4 group-hover:bg-amber-100 transition-colors">
                <Star className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professionelle Betreuung</h3>
              <p className="text-gray-600">
                PGA-Coaches und individuelle Betreuung
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-50 mb-4 group-hover:bg-sky-100 transition-colors">
                <Shield className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sicher buchen</h3>
              <p className="text-gray-600">
                Sichere Zahlung mit Stripe
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-50 mb-4 group-hover:bg-sky-100 transition-colors">
                <Calendar className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Termine</h3>
              <p className="text-gray-600">
                Wähle den perfekten Termin für dich
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Golf Image - Leicht und luftig */}
      <section className="relative py-20 bg-gradient-to-br from-sky-50 via-white to-blue-50 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80')`,
          }}
        ></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-12 w-12 text-sky-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bereit für dein nächstes Golf-Abenteuer?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Entdecke unsere Premium Golfreisen und buche jetzt deinen Platz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Jetzt buchen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/reisen">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-sky-500 text-sky-600 hover:bg-sky-500 hover:text-white text-lg px-8 py-6 h-auto transition-all duration-300"
              >
                Reisen entdecken
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterCTA variant="default" source="homepage" />
        </div>
      </section>
    </div>
  )
}
