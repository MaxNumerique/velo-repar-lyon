import { Bike, AlertCircle } from 'lucide-react'

export function PhotoGallery({ bikePhotos = [], issuePhotos = [], onPhotoClick }) {
  if (bikePhotos.length === 0 && issuePhotos.length === 0) return null;
  const PhotoCard = ({ url, alt, index, photos }) => (
    <div
      onClick={() => onPhotoClick(photos, index)}
      className="aspect-video relative rounded-2xl overflow-hidden group cursor-zoom-in border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <img 
          src={url} 
          alt={alt} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          loading="lazy"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Voir</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {bikePhotos.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
            <Bike className="w-4 h-4" /> Photos du vélo ({bikePhotos.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {bikePhotos.map((url, i) => (
              <PhotoCard key={i} url={url} alt={`Photo du vélo ${i+1}`} index={i} photos={bikePhotos} />
            ))}
          </div>
        </section>
      )}
      {issuePhotos.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Photos de la panne ({issuePhotos.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {issuePhotos.map((url, i) => (
              <PhotoCard key={i} url={url} alt={`Photo de la panne ${i+1}`} index={i} photos={issuePhotos} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
