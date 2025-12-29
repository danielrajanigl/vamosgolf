# Video-Einbindung - Andalusien Golfreise

## Setup

Um das Video von den spanischen Golf-Pros einzubinden, musst du eine der folgenden Umgebungsvariablen in deiner `.env.local` Datei setzen:

### Option 1: YouTube Video ID
```bash
NEXT_PUBLIC_ANDALUSIA_VIDEO_ID=deine-video-id
```

### Option 2: Vollständige Video URL (YouTube, Vimeo oder Custom)
```bash
NEXT_PUBLIC_ANDALUSIA_VIDEO_URL=https://www.youtube.com/embed/deine-video-id
```

## Verwendung

Das Video wird automatisch auf der Homepage eingebunden in der `AndalusiaVideoHero` Komponente.

## Text-Content

Der Text ist bereits auf Deutsch mit dem gewünschten Inhalt eingestellt:
- "Wollen Sie dem kalten Winter entkommen?"
- "Tauchen Sie ein in die Kultur Andalusiens mit kulinarischen und kulturellen Highlights"
- "Erleben Sie Golf wie nie zuvor – eine authentische Golfreise mit Local Experience"

## Features

- Responsive Design
- YouTube/Vimeo Embed Support
- Automatische Anpassung
- CTA Buttons zu Reisen
- Highlight-Features (Local Pros, Kultur & Küche, Winter-Flucht)

## Beispiel

```tsx
<AndalusiaVideoHero 
  videoId="abc123xyz"  // YouTube Video ID
  // oder
  videoUrl="https://www.youtube.com/embed/abc123xyz"
/>
```

