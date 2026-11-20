'use client';
/* eslint-disable @next/next/no-img-element -- Local/IndexedDB/private image sources with native lazy loading. */
import { useEffect, useState } from 'react';
import { assetPath } from '@/lib/deployment';
import { readImage } from '@/lib/local-images';
export function PreviewImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [local, setLocal] = useState({ id: '', url: '' });
  useEffect(() => {
    if (!src.startsWith('local-image:')) return;
    let active = true,
      url = '';
    readImage(src)
      .then((blob) => {
        if (blob && active) {
          url = URL.createObjectURL(blob);
          setLocal({ id: src, url });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);
  return (
    <img
      className={className}
      src={
        src.startsWith('local-image:')
          ? (local.id === src ? local.url : '') || assetPath('/images/abstract.svg')
          : assetPath(src)
      }
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
