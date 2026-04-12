import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getImageFromCache } from '@/hooks/useImageCache';

interface PreloadedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const PreloadedImage = ({ 
  src, 
  alt, 
  className, 
  onClick,
  placeholder = "bg-muted/20",
  style
}: PreloadedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check cache first
    const cachedImg = getImageFromCache(src);
    if (cachedImg?.complete) {
      setLoaded(true);
      setError(false);
      return;
    }

    setLoaded(false);
    setError(false);

    const img = new Image();
    
    img.onload = () => {
      setLoaded(true);
    };
    
    img.onerror = () => {
      setError(true);
    };
    
    img.src = src;
  }, [src]);

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/30",
        className
      )}>
        <div className="text-center p-4">
          <div className="text-muted-foreground text-sm">Không tìm náp hình</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && (
        <div className={cn(
          "absolute inset-0 rounded-lg animate-pulse",
          placeholder
        )} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-100",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onClick={onClick}
        style={{ 
          display: loaded ? 'block' : 'none',
          ...style 
        }}
      />
    </div>
  );
};
