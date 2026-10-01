import { useEffect, useState } from 'react'
import '../style/Media.css'

type MediaItem = {
  name: string
  url: string
  type: string
  size: number
}

// TODO: replace with a real list of files from Cloudflare R2
async function listMedia(): Promise<MediaItem[]> {
  console.log('Media listing not connected yet')
  return []
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Preview({ item }: { item: MediaItem }) {
  if (item.type.startsWith('image/')) {
    return <img src={item.url} alt={item.name} />
  }
  if (item.type.startsWith('video/')) {
    return <video src={item.url} controls />
  }
  if (item.type.startsWith('audio/')) {
    return <audio src={item.url} controls />
  }
  return <div className="media-file-icon">File</div>
}

function Media() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMedia().then((media) => {
      setItems(media)
      setLoading(false)
    })
  }, [])

  return (
    <section className="media">
      <h1>Media</h1>

      {loading ? (
        <p className="media-empty">Loading...</p>
      ) : items.length === 0 ? (
        <p className="media-empty">
          No media yet. Storage isn't connected, so uploaded files won't show up here.
        </p>
      ) : (
        <ul className="media-grid">
          {items.map((item) => (
            <li key={item.url} className="media-card">
              <div className="media-preview">
                <Preview item={item} />
              </div>
              <div className="media-info">
                <strong>{item.name}</strong>
                <span>{formatSize(item.size)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Media
