'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DisplayConfig, DisplayViewConfig, DEFAULT_DISPLAY_CONFIG, CustomSlideData } from '@/types/display';
import AddCustomSlideModal from './AddCustomSlideModal';
import ViewSettingsSection from './display/ViewSettingsSection';
import PlaybackSettingsSection from './display/PlaybackSettingsSection';
import FilterSettingsSection from './display/FilterSettingsSection';
import DisplayInfoSection from './display/DisplayInfoSection';

const AUTO_SAVE_DELAY_MS = 800;
const MESSAGE_DISPLAY_MS = 3000;

interface GroupOption {
  id: number;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

const SLIDE_TYPE_LABELS: Record<string, string> = {
  IMAGE: '画像',
  YOUTUBE: 'YouTube',
  TEXT: 'テキスト',
};

export default function DisplaySettings() {
  const [config, setConfig] = useState<DisplayConfig>(DEFAULT_DISPLAY_CONFIG);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customSlides, setCustomSlides] = useState<CustomSlideData[]>([]);
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedConfigRef = useRef<string>('');

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), MESSAGE_DISPLAY_MS);
  }, []);

  const loadCustomSlides = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-slides');
      const data = await res.json();
      const slides: CustomSlideData[] = Array.isArray(data) ? data : [];
      setCustomSlides(slides);
      return slides;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      const [configData, slides] = await Promise.all([
        fetch('/api/settings/display')
          .then((res) => {
            if (!res.ok) throw new Error('API error');
            return res.json();
          })
          .catch(() => null),
        loadCustomSlides(),
      ]);

      let loadedConfig: DisplayConfig;
      if (!configData || !configData.views || !Array.isArray(configData.views)) {
        loadedConfig = DEFAULT_DISPLAY_CONFIG;
      } else {
        loadedConfig = { ...DEFAULT_DISPLAY_CONFIG, ...configData };
      }

      // 孤立したカスタムスライド（ビューに紐付いていないもの）をビューに追加
      const linkedSlideIds = new Set(
        loadedConfig.views
          .filter((v) => v.viewType === 'CUSTOM_SLIDE' && v.customSlideId)
          .map((v) => v.customSlideId)
      );
      const orphanSlides = slides.filter((s) => !linkedSlideIds.has(s.id));
      if (orphanSlides.length > 0) {
        const newViews = [
          ...loadedConfig.views,
          ...orphanSlides.map((s, i) => ({
            viewType: 'CUSTOM_SLIDE' as const,
            enabled: true,
            duration: 15,
            order: loadedConfig.views.length + i,
            title: s.title || SLIDE_TYPE_LABELS[s.slideType] || 'カスタムスライド',
            customSlideId: s.id,
          })),
        ];
        loadedConfig = { ...loadedConfig, views: newViews };
        fetch('/api/settings/display', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loadedConfig),
        }).catch(() => {});
      }

      setConfig(loadedConfig);
      lastSavedConfigRef.current = JSON.stringify(loadedConfig);
      setInitialized(true);
    };

    loadAll();

    fetch('/api/groups')
      .then((res) => res.json())
      .then((data) => setGroups(data.map((g: { id: number; name: string }) => ({ id: g.id, name: g.name }))))
      .catch(() => {});

    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data.map((m: { id: number; name: string }) => ({ id: m.id, name: m.name }))))
      .catch(() => {});
  }, [loadCustomSlides]);

  const saveConfig = useCallback(async (configToSave: DisplayConfig) => {
    const res = await fetch('/api/settings/display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configToSave),
    });
    if (!res.ok) throw new Error('保存に失敗しました');
  }, []);

  // 自動保存: config変更を検知してデバウンス付きで保存（初期ロードと同一内容はスキップ）
  useEffect(() => {
    if (!initialized) return;

    const configJson = JSON.stringify(config);
    if (configJson === lastSavedConfigRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveConfig(config);
        lastSavedConfigRef.current = configJson;
        showMessage('success', '自動保存しました');
      } catch {
        showMessage('error', '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [config, initialized, saveConfig, showMessage]);

  const updateView = (index: number, updates: Partial<DisplayViewConfig>) => {
    setConfig((prev) => ({
      ...prev,
      views: prev.views.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    }));
  };

  const handleSlideCreated = async () => {
    setShowAddSlideModal(false);
    try {
      const res = await fetch('/api/custom-slides');
      const slides: CustomSlideData[] = await res.json();
      setCustomSlides(slides);
      const latest = slides[slides.length - 1];
      if (latest) {
        const newConfig: DisplayConfig = {
          ...config,
          views: [
            ...config.views,
            {
              viewType: 'CUSTOM_SLIDE' as const,
              enabled: true,
              duration: 15,
              order: config.views.length,
              title: latest.title || SLIDE_TYPE_LABELS[latest.slideType] || 'カスタムスライド',
              customSlideId: latest.id,
            },
          ],
        };
        setConfig(newConfig);
        await saveConfig(newConfig);
        showMessage('success', 'スライドを追加しました');
      }
    } catch {
      showMessage('error', 'スライドの追加に失敗しました');
    }
  };

  const handleDeleteSlide = async (slideId: number) => {
    if (!confirm('このスライドを削除しますか？')) return;
    setDeletingSlideId(slideId);
    try {
      const res = await fetch(`/api/custom-slides/${slideId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomSlides((prev) => prev.filter((s) => s.id !== slideId));
        const newConfig: DisplayConfig = {
          ...config,
          views: config.views
            .filter((v) => !(v.viewType === 'CUSTOM_SLIDE' && v.customSlideId === slideId))
            .map((v, i) => ({ ...v, order: i })),
        };
        setConfig(newConfig);
        await saveConfig(newConfig);
        showMessage('success', 'スライドを削除しました');
      }
    } catch {
      showMessage('error', 'スライドの削除に失敗しました');
    } finally {
      setDeletingSlideId(null);
    }
  };

  const moveView = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.views.length) return;

    setConfig((prev) => {
      const newViews = [...prev.views];
      const temp = newViews[index];
      newViews[index] = newViews[targetIndex];
      newViews[targetIndex] = temp;
      return {
        ...prev,
        views: newViews.map((v, i) => ({ ...v, order: i })),
      };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">ディスプレイモード設定</h2>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              保存中...
            </span>
          )}
          {message && (
            <span className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <ViewSettingsSection
          config={config}
          customSlides={customSlides}
          deletingSlideId={deletingSlideId}
          onUpdateView={updateView}
          onMoveView={moveView}
          onDeleteSlide={handleDeleteSlide}
          onAddSlide={() => setShowAddSlideModal(true)}
        />

        <PlaybackSettingsSection config={config} onConfigChange={setConfig} />

        <FilterSettingsSection config={config} groups={groups} members={members} onConfigChange={setConfig} />

        <DisplayInfoSection config={config} onConfigChange={setConfig} />

        <AddCustomSlideModal
          open={showAddSlideModal}
          onClose={() => setShowAddSlideModal(false)}
          onCreated={handleSlideCreated}
        />
      </div>
    </div>
  );
}
