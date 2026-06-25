'use client';

import { Suspense } from 'react';
import DisplayContainer from '@/components/display/DisplayContainer';
import DisplaySpinner from '@/components/display/DisplaySpinner';

export default function DisplayPage() {
  // useSearchParams は Suspense 境界が必要
  return (
    <Suspense fallback={<DisplaySpinner />}>
      <DisplayContainer />
    </Suspense>
  );
}
