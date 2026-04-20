'use client';

import Image from 'next/image';
import { DisplayViewConfig, CustomSlideData } from '@/types/display';
import { extractYouTubeId } from '@/lib/youtube';

interface SlideThumbnailProps {
  view: DisplayViewConfig;
  customSlides: CustomSlideData[];
}

export default function SlideThumbnail({
  view,
  customSlides,
}: SlideThumbnailProps) {
  if (view.viewType !== 'CUSTOM_SLIDE') return null;
  const slide = customSlides.find((s) => s.id === view.customSlideId);
  if (!slide) return null;

  if (slide.slideType === 'IMAGE' && slide.imageUrl) {
    return (
      <Image
        src={slide.imageUrl}
        alt={slide.title || 'スライド画像'}
        width={40}
        height={40}
        className="object-cover rounded border border-gray-200 shrink-0"
      />
    );
  }

  if (slide.slideType === 'YOUTUBE' && slide.content) {
    const videoId = extractYouTubeId(slide.content);
    if (videoId) {
      return (
        <Image
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt={slide.title || 'YouTube'}
          width={40}
          height={40}
          className="object-cover rounded border border-gray-200 shrink-0"
        />
      );
    }
  }

  return null;
}
