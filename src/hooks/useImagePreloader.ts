import { useEffect, useState, useCallback, useMemo } from 'react';
import { preloadImages, getImageFromCache } from './useImageCache';

interface PreloadedImage {
  url: string;
  loaded: boolean;
  error: boolean;
}

export const useImagePreloader = (imageUrls: string[]) => {
  const [images, setImages] = useState<Map<string, PreloadedImage>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Memoize imageUrls to prevent infinite loops
  const memoizedUrls = useMemo(() => {
    return imageUrls.filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates
  }, [imageUrls]);

  useEffect(() => {
    if (!memoizedUrls.length) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const preloadAll = async () => {
      try {
        // Initialize all images as loading
        const initialMap = new Map<string, PreloadedImage>();
        memoizedUrls.forEach(url => {
          initialMap.set(url, { url, loaded: false, error: false });
        });
        
        if (isMounted) {
          setImages(initialMap);
        }

        // Preload all images in parallel
        await preloadImages(memoizedUrls);
        
        // Update status to loaded
        const loadedMap = new Map<string, PreloadedImage>();
        memoizedUrls.forEach(url => {
          const cachedImg = getImageFromCache(url);
          loadedMap.set(url, { 
            url, 
            loaded: cachedImg?.complete || false, 
            error: !cachedImg 
          });
        });
        
        if (isMounted) {
          setImages(loadedMap);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error preloading images:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    preloadAll();

    return () => {
      isMounted = false;
    };
  }, [memoizedUrls]);

  const getImageStatus = useCallback((url: string) => {
    return images.get(url);
  }, [images]);

  return { images, loading, getImageStatus };
};
