'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TEMPLATE } from '@/types/notificationTemplate';
import type { Integration } from './types';

/**
 * 通知テンプレート・顔写真送信フラグの state を、連携 config から初期化・同期する共通フック。
 * 未設定（messageTemplate キーが存在しない）の場合は DEFAULT_TEMPLATE を初期表示する。
 */
export function useNotificationTemplateState(integration: Integration) {
  const initialTemplate = (config: Integration['config']) =>
    config && 'messageTemplate' in config
      ? config.messageTemplate || ''
      : DEFAULT_TEMPLATE;

  const [messageTemplate, setMessageTemplate] = useState(
    initialTemplate(integration.config),
  );
  const [sendMemberImage, setSendMemberImage] = useState(
    integration.config?.sendMemberImage === 'true',
  );

  useEffect(() => {
    setMessageTemplate(initialTemplate(integration.config));
    setSendMemberImage(integration.config?.sendMemberImage === 'true');
  }, [integration]);

  return {
    messageTemplate,
    setMessageTemplate,
    sendMemberImage,
    setSendMemberImage,
  };
}
