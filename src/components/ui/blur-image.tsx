import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional low-res placeholder or dominant color (defaults to muted bg) */
  placeholderColor?: string;
  /** Explicit WebP source URL. Auto-derived for Unsplash URLs if omitted. */
  webpSrc?: string;
}

/** Try to derive a WebP variant for known CDN patterns */
const deriveWebpSrc = (src?: string): string | undefined => {
  if (!src) return undefined;
  // Unsplash: append &fm=webp
  if (src.includes("images.unsplash.com")) {
    return src.includes("fm=") ? src.replace(/fm=\w+/, "fm=webp") : `${src}&fm=webp`;
  }
  // Supabase storage: already serves original format, no transform available
  return undefined;
};

/**
 * Image component with native lazy loading, fade-in on load,
 * WebP format with fallback via <picture>, and a blurred
 * placeholder background until the image is ready.
 */
const BlurImage = ({
  className,
  placeholderColor,
  webpSrc,
  alt = "",
  loading = "lazy",
  decoding = "async",
  onLoad,
  src,
  ...props
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const resolvedWebpSrc = useMemo(() => webpSrc || deriveWebpSrc(src), [webpSrc, src]);

  const imgElement = (
    <img
      {...props}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding as any}
      onLoad={handleLoad}
      className={cn(
        "w-full h-full object-cover transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0"
      )}
    />
  );

  return (
    <div
      className={cn("relative overflow-hidden bg-muted/40", className)}
      style={placeholderColor ? { backgroundColor: placeholderColor } : undefined}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60" />
      )}
      {resolvedWebpSrc ? (
        <picture>
          <source srcSet={resolvedWebpSrc} type="image/webp" />
          {imgElement}
        </picture>
      ) : (
        imgElement
      )}
    </div>
  );
};

export default BlurImage;
