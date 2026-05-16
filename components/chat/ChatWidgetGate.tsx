'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from './ChatWidget';

/** ディスプレイモードや非認証ページでは表示しない */
const HIDDEN_PATH_PREFIXES = ['/display', '/login', '/admin/login'];

/**
 * パスに応じて ChatWidget を出すかどうかを制御する薄いゲートコンポーネント。
 * layout.tsx で ChatWidget を直接 render すると、除外対象パスでも
 * ChatWidget 内の useSession / useAiChat / useEffect が実行されてしまうため、
 * このゲートで早期に判定して ChatWidget 自体をマウントしないようにする。
 */
export default function ChatWidgetGate() {
  const pathname = usePathname();
  if (pathname && HIDDEN_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }
  return <ChatWidget />;
}
