// Simple image cache to prevent re-downloading
const imageCache = new Map<string, HTMLImageElement>();

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (imageCache.has(src)) {
      const cachedImg = imageCache.get(src)!;
      if (cachedImg.complete) {
        resolve(cachedImg);
        return;
      }
    }

    const img = new Image();
    
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(url => preloadImage(url)));
  } catch (error) {
    console.error('Error preloading images:', error);
  }
};

export const getImageFromCache = (src: string): HTMLImageElement | null => {
  return imageCache.get(src) || null;
};
