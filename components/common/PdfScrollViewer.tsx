'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface PdfScrollViewerProps {
  fileUrl: string;
  /** 末尾までスクロール時に呼び出される（一度のみ） */
  onScrolledToBottom: () => void;
  /** PDF レンダリング失敗時 */
  onError?: (error: Error) => void;
  /** スクロール末尾検知のしきい値 (px)。サブピクセル誤差を吸収するため大きめに取る。 */
  bottomThreshold?: number;
}

export default function PdfScrollViewer({
  fileUrl,
  onScrolledToBottom,
  onError,
  bottomThreshold = 80,
}: PdfScrollViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const reachedBottomRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ファイルが切り替わった時はステートをリセット
  useEffect(() => {
    reachedBottomRef.current = false;
    setNumPages(0);
  }, [fileUrl]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (reachedBottomRef.current) return;
    const el = e.currentTarget;
    const isAtBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - bottomThreshold;
    if (isAtBottom) {
      reachedBottomRef.current = true;
      onScrolledToBottom();
    }
  };

  const handleLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative h-full overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={(err) => onError?.(err)}
        loading={
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            読み込み中...
          </div>
        }
        error={
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            PDF の読み込みに失敗しました
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-3">
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={`page_${i + 1}`}
              pageNumber={i + 1}
              width={containerWidth ? Math.min(containerWidth - 24, 900) : 800}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="shadow-sm"
            />
          ))}
        </div>
      </Document>
    </div>
  );
}
