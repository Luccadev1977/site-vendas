'use client';
/* eslint-disable @next/next/no-img-element -- Local/IndexedDB/private image sources with native lazy loading. */
import { useEffect, useState } from 'react';
import { assetPath } from '@/lib/deployment';
import { readImage } from '@/lib/local-images';
import { isGitHubPages } from '@/lib/deployment';
import { fileURL, publicImageURL } from '@/lib/browser-platform';
import { useBrowserSession } from './browser-runtime';
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
  const auth = useBrowserSession();
  const privateId = /^\/api\/files\/([0-9a-f-]{36})(?:\?inline=1)?$/.exec(src)?.[1],
    catalogName = /^\/api\/catalog-assets\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(src)?.[1];
  const userId = auth.user?.id;
  const key = privateId ? `${src}:${userId || ''}` : src;
  const [local, setLocal] = useState({ id: '', url: '' });
  useEffect(() => {
    if (!isGitHubPages || (!privateId && !catalogName) || (privateId && !userId)) return;
    let active = true;
    const load = async () => {
      try {
        const url = privateId ? await fileURL(privateId) : await publicImageURL(catalogName!);
        if (active) setLocal({ id: key, url });
      } catch {
        if (active) setLocal({ id: key, url: '' });
      }
    };
    void load();
    const timer = setInterval(load, 45000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [privateId, catalogName, key, userId]);
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
          ? (local.id === key ? local.url : '') || assetPath('/images/abstract.svg')
          : isGitHubPages && (privateId || catalogName)
            ? (local.id === key ? local.url : '') || assetPath('/images/abstract.svg')
            : assetPath(src)
      }
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
