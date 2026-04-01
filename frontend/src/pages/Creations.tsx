import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchCreations, fetchCreationContent, fetchGalleryImages, getAuthorsDisplay, type Creation, type GalleryImage } from '../lib/api'

type Tab = 'stories' | 'poems' | 'reflections' | 'songs' | 'gallery'

const MODEL_LABELS: Record<string, string> = {
  flux: 'FLUX.1',
  sd: 'SDXL',
  sdl: 'SDXL Lightning',
  'gemini-flash': 'Gemini Flash',
  'gemini-pro': 'Gemini Pro',
}

export default function Creations() {
  const [activeTab, setActiveTab] = useState<Tab>('stories')
  const [creations, setCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [galleryCursor, setGalleryCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Fetch creations or gallery when tab changes
  useEffect(() => {
    setLoading(true)

    if (activeTab === 'gallery') {
      fetchGalleryImages({ limit: 30 })
        .then(data => {
          setGalleryImages(data.images)
          setGalleryCursor(data.cursor)
          setLoading(false)
        })
        .catch(() => {
          setGalleryImages([])
          setLoading(false)
        })
    } else {
      const typeMap: Record<string, 'Story' | 'Poem' | 'Reflections' | 'Song'> = {
        stories: 'Story',
        poems: 'Poem',
        reflections: 'Reflections',
        songs: 'Song',
      }

      fetchCreations({ type: typeMap[activeTab] })
        .then(data => {
          setCreations(data)
          setLoading(false)
        })
        .catch(() => {
          setCreations([])
          setLoading(false)
        })
    }
  }, [activeTab])

  // Handle selecting a creation - fetch its content
  const handleSelectCreation = async (creation: Creation) => {
    setSelectedCreation(creation)
    setLoadingContent(true)

    const fullCreation = await fetchCreationContent(creation.id)
    if (fullCreation) {
      setSelectedCreation(fullCreation)
    }
    setLoadingContent(false)
  }

  const loadMoreImages = async () => {
    if (!galleryCursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetchGalleryImages({ limit: 30, cursor: galleryCursor })
    setGalleryImages(prev => [...prev, ...data.images])
    setGalleryCursor(data.cursor)
    setLoadingMore(false)
  }

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: 'stories', label: 'Stories' },
    { id: 'poems', label: 'Poems' },
    { id: 'reflections', label: 'Reflections' },
    { id: 'songs', label: 'Songs 🔜', disabled: true },
    { id: 'gallery', label: '🖼️ Gallery' }
  ]

  // Gallery lightbox
  if (selectedImage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute top-4 right-4 z-60 text-white/70 hover:text-white text-2xl p-2"
        >
          ✕
        </button>

        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={selectedImage.url}
            alt={selectedImage.prompt}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        <div className="p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white/90 text-sm mb-2">
            {selectedImage.prompt}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="px-2 py-0.5 rounded-full bg-white/10">
              {MODEL_LABELS[selectedImage.model] || selectedImage.model}
            </span>
            {selectedImage.steps > 0 && (
              <span>{selectedImage.steps} steps</span>
            )}
            {selectedImage.created && (
              <span>{new Date(selectedImage.created).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // TTS state
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopSpeaking = useCallback(() => {
    try { speechSynthesis.cancel() } catch {}
    setSpeaking(false)
  }, [])

  const toggleTTS = useCallback(() => {
    if (speaking) {
      stopSpeaking()
      return
    }
    const text = selectedCreation?.content
    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onend = () => setSpeaking(false)
    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
    setSpeaking(true)
  }, [speaking, selectedCreation, stopSpeaking])

  // Stop TTS when navigating away
  useEffect(() => {
    return () => { try { speechSynthesis.cancel() } catch {} }
  }, [selectedCreation])

  // If a creation is selected, show its content
  if (selectedCreation) {
    const authorDisplay = getAuthorsDisplay(selectedCreation.author)
    return (
      <div className="p-4">
        {/* Back button */}
        <button
          onClick={() => { stopSpeaking(); setSelectedCreation(null) }}
          className="flex items-center gap-2 text-[var(--color-text-muted)] mb-4 hover:text-[var(--color-text-primary)]"
        >
          ← Back
        </button>

        {/* Creation header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span>{authorDisplay.emojis}</span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {authorDisplay.names}
              </span>
              {selectedCreation.date && (
                <span className="text-sm text-[var(--color-text-muted)]">
                  • {new Date(selectedCreation.date).toLocaleDateString()}
                </span>
              )}
            </div>
            {/* TTS button */}
            {selectedCreation.content && (
              <button
                onClick={toggleTTS}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  speaking
                    ? 'bg-[var(--color-shared)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                title={speaking ? 'Stop reading' : 'Read aloud'}
              >
                {speaking ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
            )}
          </div>
          <h1 className="text-2xl font-semibold">{selectedCreation.title}</h1>
          {selectedCreation.genre && (
            <span className="text-sm text-[var(--color-text-muted)]">
              {selectedCreation.genre}
            </span>
          )}
        </header>

        {/* Creation content */}
        <div className="bg-[var(--color-bg-card)] rounded-xl p-6">
          {loadingContent ? (
            <p className="text-[var(--color-text-muted)]">Loading content...</p>
          ) : selectedCreation.content ? (
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-[var(--color-text-secondary)]">
              {selectedCreation.content}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] italic">
              No content yet. Add some in Notion!
            </p>
          )}
        </div>

        {/* Link to Notion */}
        {selectedCreation.url && (
          <a
            href={selectedCreation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-center text-sm text-[var(--color-shared)] hover:underline"
          >
            Open in Notion →
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">✨ Creations</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Stories, poems, songs, and images from the family
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-shared)] text-white'
                : tab.disabled
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'gallery' ? (
        // Gallery grid
        <div>
          {loading ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading gallery...</p>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="text-[var(--color-text-secondary)] font-medium">
                No images yet
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Generate images using the Nanobanana MCP and they'll appear here
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {galleryImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-bg-card)] hover:ring-2 hover:ring-[var(--color-shared)] transition-all group"
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-white text-xs line-clamp-2">
                        {image.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {galleryCursor && (
                <button
                  onClick={loadMoreImages}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}

          <a
            href="https://www.notion.so/c8cb42b6cb64493a8d8c256d9c998fea?v=5cbfd053f77241dda81b1da283928f32"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-center text-sm text-[var(--color-shared)] hover:underline"
          >
            Open Gallery in Notion →
          </a>
        </div>
      ) : (
        // Stories/Poems/Songs list
        <div className="space-y-3">
          {loading ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
              <p className="text-[var(--color-text-muted)]">Loading...</p>
            </div>
          ) : creations.length === 0 ? (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-[var(--color-text-secondary)] font-medium">
                No {activeTab} yet
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {activeTab === 'songs'
                  ? 'Song lyrics coming in a future update'
                  : 'Add some to the Notion database to see them here'
                }
              </p>
              <a
                href="https://www.notion.so/2f6ba08f4a2c8066bef6f8638de26028"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-[var(--color-shared)] hover:underline"
              >
                Open Creations in Notion →
              </a>
            </div>
          ) : (
            creations.map((creation) => {
              const authorDisplay = getAuthorsDisplay(creation.author)
              return (
                <button
                  key={creation.id}
                  onClick={() => handleSelectCreation(creation)}
                  className="w-full text-left bg-[var(--color-bg-card)] rounded-xl p-4 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{authorDisplay.emojis}</span>
                      <span className="font-medium">{creation.title}</span>
                    </div>
                    {creation.rating && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {'★'.repeat(Math.round(creation.rating))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <span>by {authorDisplay.names}</span>
                    {creation.date && (
                      <>
                        <span>•</span>
                        <span>{new Date(creation.date).toLocaleDateString()}</span>
                      </>
                    )}
                    {creation.genre && (
                      <>
                        <span>•</span>
                        <span>{creation.genre}</span>
                      </>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
