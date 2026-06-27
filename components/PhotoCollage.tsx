'use client'

const getDriveImageUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`

interface Props {
  photos: string[]
  onPhotoClick: (fileId: string) => void
  onPhotoDelete?: (fileId: string) => void
}

export default function PhotoCollage({ photos, onPhotoClick, onPhotoDelete }: Props) {
  if (photos.length === 0) return null

  const visible = photos.slice(0, 4)
  const extra = photos.length - 4

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    cursor: 'pointer',
  }

  const cellClass = 'relative overflow-hidden'

  const DeleteBtn = ({ fileId }: { fileId: string }) =>
    onPhotoDelete ? (
      <button
        onClick={(e) => { e.stopPropagation(); onPhotoDelete(fileId) }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '16px' }}
      >
        ×
      </button>
    ) : null

  // 1장
  if (photos.length === 1) {
    return (
      <div className={`${cellClass} group rounded-[14px]`} style={{ aspectRatio: '4/3' }}>
        <img src={getDriveImageUrl(photos[0])} alt="" style={imgStyle} onClick={() => onPhotoClick(photos[0])} />
        <DeleteBtn fileId={photos[0]} />
      </div>
    )
  }

  // 2장
  if (photos.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-[14px] overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {photos.map((id) => (
          <div key={id} className={`${cellClass} group`}>
            <img src={getDriveImageUrl(id)} alt="" style={imgStyle} onClick={() => onPhotoClick(id)} />
            <DeleteBtn fileId={id} />
          </div>
        ))}
      </div>
    )
  }

  // 3장: 왼쪽 1장 + 오른쪽 2장
  if (photos.length === 3) {
    return (
      <div className="grid gap-1 rounded-[14px] overflow-hidden" style={{ gridTemplateColumns: '1fr 1fr', aspectRatio: '4/3' }}>
        <div className={`${cellClass} group`} style={{ gridRow: 'span 2' }}>
          <img src={getDriveImageUrl(photos[0])} alt="" style={imgStyle} onClick={() => onPhotoClick(photos[0])} />
          <DeleteBtn fileId={photos[0]} />
        </div>
        {photos.slice(1).map((id) => (
          <div key={id} className={`${cellClass} group`}>
            <img src={getDriveImageUrl(id)} alt="" style={imgStyle} onClick={() => onPhotoClick(id)} />
            <DeleteBtn fileId={id} />
          </div>
        ))}
      </div>
    )
  }

  // 4장+: 2×2 그리드 (4번째에 +N 오버레이)
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[14px] overflow-hidden" style={{ aspectRatio: '1/1' }}>
      {visible.map((id, i) => (
        <div key={id} className={`${cellClass} group`}>
          <img src={getDriveImageUrl(id)} alt="" style={imgStyle} onClick={() => onPhotoClick(id)} />
          <DeleteBtn fileId={id} />
          {i === 3 && extra > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
              onClick={() => onPhotoClick(id)}
            >
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
