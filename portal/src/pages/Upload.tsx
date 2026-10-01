import { useState, type ChangeEvent, type DragEvent, type SubmitEvent } from 'react'
import '../style/Upload.css'

type UploadProps = {
  username: string
  onLogout: () => void
}

// TODO: replace with a real upload to Cloudflare R2
async function uploadFile(file: File): Promise<void> {
  console.log('Upload not connected yet:', file.name)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Upload({ username, onLogout }: UploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const selectFile = (selected: File | undefined) => {
    setFile(selected ?? null)
    setMessage('')
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0])
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    selectFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    await uploadFile(file)
    setUploading(false)
    setMessage(`"${file.name}" is ready. Upload to storage isn't connected yet.`)
  }

  return (
    <section className="upload">
      <header className="upload-header">
        <span>Signed in as <strong>{username}</strong></span>
        <button type="button" className="upload-logout" onClick={onLogout}>
          Log out
        </button>
      </header>

      <form className="upload-card" onSubmit={handleSubmit}>
        <h1>Upload a file</h1>

        <label
          className={`upload-drop${dragging ? ' dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" onChange={handleChange} />
          {file ? (
            <span>
              <strong>{file.name}</strong> ({formatSize(file.size)})
            </span>
          ) : (
            <span>Drag a file here or click to choose one</span>
          )}
        </label>

        {message && <p className="upload-message">{message}</p>}

        <button type="submit" className="upload-button" disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </section>
  )
}

export default Upload
