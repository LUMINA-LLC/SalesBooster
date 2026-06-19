'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DisplayConfig,
  DisplayViewConfig,
  DEFAULT_DISPLAY_CONFIG,
  CustomSlideData,
  createDefaultView,
} from '@/types/display';
import { ViewType } from '@/types';
import { Dialog } from '@/components/common/Dialog';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import CustomSlideModal from './CustomSlideModal';
import ConfigNameModal from './display/ConfigNameModal';
import ViewSettingsSection from './display/ViewSettingsSection';
import PlaybackSettingsSection from './display/PlaybackSettingsSection';
import FilterSettingsSection from './display/FilterSettingsSection';
import DisplayInfoSection from './display/DisplayInfoSection';
import BreakingNewsSection from './display/BreakingNewsSection';
import {
  AUTO_SAVE_DELAY_MS,
  MESSAGE_DISPLAY_MS,
  SLIDE_TYPE_LABELS,
} from '@/const/settings';

interface GroupOption {
  id: number;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface DataTypeOption {
  id: number;
  name: string;
  unit: string;
}

export default function DisplaySettings() {
  const [config, setConfig] = useState<DisplayConfig>(DEFAULT_DISPLAY_CONFIG);
  // 複数設定対応: テナント内の全設定（id/name のみ参照）と選択中の設定ID
  const [configList, setConfigList] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [dataTypes, setDataTypes] = useState<DataTypeOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [customSlides, setCustomSlides] = useState<CustomSlideData[]>([]);
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CustomSlideData | null>(
    null,
  );
  const [deletingSlideId, setDeletingSlideId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  // 設定名入力モーダル（新規作成 / 名前変更）
  const [nameModal, setNameModal] = useState<{
    mode: 'create' | 'rename';
  } | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedConfigRef = useRef<string>('');
  // saveConfig（自動保存含む）から最新の選択中IDを参照するための ref
  const currentConfigIdRef = useRef<number | null>(null);
  currentConfigIdRef.current = currentConfigId;

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(
      () => setMessage(null),
      MESSAGE_DISPLAY_MS,
    );
  }, []);

  const loadCustomSlides = useCallback(async () => {
    try {
      // 現在選択中の設定に帰属するスライドのみ取得（設定ごとに独立）
      const id = currentConfigIdRef.current;
      const url = id
        ? `/api/custom-slides?configId=${id}`
        : '/api/custom-slides';
      const res = await fetch(url);
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
      const list = await fetch('/api/settings/display/list')
        .then((res) => {
          if (!res.ok) throw new Error('API error');
          return res.json();
        })
        .catch(() => null);

      // 一覧から最初の設定を選択。設定が1つも無ければデフォルト（未保存）。
      const configs: DisplayConfig[] = Array.isArray(list) ? list : [];
      setConfigList(
        configs.map((c) => ({ id: c.id ?? 0, name: c.name ?? '' })),
      );

      let loadedConfig: DisplayConfig;
      const first = configs[0];
      if (!first || !first.views || !Array.isArray(first.views)) {
        loadedConfig = DEFAULT_DISPLAY_CONFIG;
        setCurrentConfigId(null);
        currentConfigIdRef.current = null;
      } else {
        loadedConfig = { ...DEFAULT_DISPLAY_CONFIG, ...first };
        setCurrentConfigId(first.id ?? null);
        currentConfigIdRef.current = first.id ?? null;
      }

      // 選択中設定に帰属するスライドのみ取得（configId 確定後に取得）。
      // カスタムスライドは設定ごとに独立するため、孤立スライドの自動紐付けは行わない。
      await loadCustomSlides();

      setConfig(loadedConfig);
      lastSavedConfigRef.current = JSON.stringify(loadedConfig);
      setInitialized(true);
    };

    loadAll();

    fetch('/api/groups')
      .then((res) => res.json())
      .then((data) =>
        setGroups(
          data.map((g: { id: number; name: string }) => ({
            id: g.id,
            name: g.name,
          })),
        ),
      )
      .catch(() => {});

    fetch('/api/members?type=sales')
      .then((res) => res.json())
      .then((data) =>
        setMembers(
          data.map((m: { id: number; name: string }) => ({
            id: m.id,
            name: m.name,
          })),
        ),
      )
      .catch(() => {});

    fetch('/api/data-types')
      .then((res) => res.json())
      .then((data: { id: number; name: string; unit: string }[]) =>
        setDataTypes(
          data.map((dt) => ({ id: dt.id, name: dt.name, unit: dt.unit })),
        ),
      )
      .catch(() => {});
  }, [loadCustomSlides]);

  const saveConfig = useCallback(async (configToSave: DisplayConfig) => {
    // 選択中の設定IDがあればその設定を更新する
    const id = currentConfigIdRef.current;
    const url = id
      ? `/api/settings/display?configId=${id}`
      : '/api/settings/display';
    const res = await fetch(url, {
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

  // グラフ系ビューを末尾に追加（カスタムスライドは専用フローで追加するため対象外）
  const addView = async (viewType: ViewType) => {
    const newView = createDefaultView(viewType, config.views.length);
    const newConfig: DisplayConfig = {
      ...config,
      views: [...config.views, newView],
    };
    setConfig(newConfig);
    try {
      await saveConfig(newConfig);
      // 明示保存済みとして記録し、自動保存useEffectによる二重保存を防ぐ
      lastSavedConfigRef.current = JSON.stringify(newConfig);
    } catch {
      showMessage('error', 'ビューの追加に失敗しました');
    }
  };

  // ビュー（グラフ系）を削除。カスタムスライドは handleDeleteSlide で扱う。
  const removeView = async (index: number) => {
    if (!(await Dialog.confirm('このビューを削除しますか？'))) return;
    const newConfig: DisplayConfig = {
      ...config,
      views: config.views
        .filter((_, i) => i !== index)
        .map((v, i) => ({ ...v, order: i })),
    };
    setConfig(newConfig);
    try {
      await saveConfig(newConfig);
      // 明示保存済みとして記録し、自動保存useEffectによる二重保存を防ぐ
      lastSavedConfigRef.current = JSON.stringify(newConfig);
    } catch {
      showMessage('error', 'ビューの削除に失敗しました');
    }
  };

  const handleSlideCreated = async () => {
    setShowAddSlideModal(false);
    try {
      // 選択中設定に帰属するスライドのみ再取得し、追加されたものをビューに紐付ける
      const slides = await loadCustomSlides();
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
              title:
                latest.title ||
                SLIDE_TYPE_LABELS[latest.slideType] ||
                'カスタムスライド',
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

  const handleSlideUpdated = async () => {
    setEditingSlide(null);
    try {
      await loadCustomSlides();
      showMessage('success', 'スライドを更新しました');
    } catch {
      showMessage('error', 'スライドの更新に失敗しました');
    }
  };

  const handleEditSlide = (slideId: number) => {
    const slide = customSlides.find((s) => s.id === slideId);
    if (slide) setEditingSlide(slide);
  };

  const handleDeleteSlide = async (slideId: number) => {
    if (!(await Dialog.confirm('このスライドを削除しますか？'))) return;
    setDeletingSlideId(slideId);
    try {
      const res = await fetch(`/api/custom-slides/${slideId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCustomSlides((prev) => prev.filter((s) => s.id !== slideId));
        const newConfig: DisplayConfig = {
          ...config,
          views: config.views
            .filter(
              (v) =>
                !(v.viewType === 'CUSTOM_SLIDE' && v.customSlideId === slideId),
            )
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

  // --- 複数設定の管理 ---

  /** 設定一覧を再取得して configList を更新する */
  const reloadConfigList = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/display/list');
      if (!res.ok) return;
      const list: DisplayConfig[] = await res.json();
      setConfigList(
        (Array.isArray(list) ? list : []).map((c) => ({
          id: c.id ?? 0,
          name: c.name ?? '',
        })),
      );
    } catch {
      // 一覧取得失敗は致命的でないため握りつぶす
    }
  }, []);

  /** 別の設定に切り替える（保留中の自動保存を確定させてから切替） */
  const handleSelectConfig = async (id: number) => {
    if (id === currentConfigId) return;
    // 保留中の自動保存をフラッシュ
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
      if (JSON.stringify(config) !== lastSavedConfigRef.current) {
        try {
          await saveConfig(config);
        } catch {
          // 保存失敗時もメッセージ済みのため続行
        }
      }
    }
    try {
      const res = await fetch(`/api/settings/display?configId=${id}`);
      if (!res.ok) throw new Error('load failed');
      const data: DisplayConfig = await res.json();
      const loaded = { ...DEFAULT_DISPLAY_CONFIG, ...data };
      setCurrentConfigId(id);
      currentConfigIdRef.current = id;
      setConfig(loaded);
      lastSavedConfigRef.current = JSON.stringify(loaded);
      // 切替先の設定に帰属するスライドを再取得
      await loadCustomSlides();
    } catch {
      showMessage('error', '設定の読み込みに失敗しました');
    }
  };

  /** 新規設定を作成して切り替える（モーダルで入力した名前を受け取る） */
  const createConfig = async (name: string) => {
    try {
      const res = await fetch('/api/settings/display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEFAULT_DISPLAY_CONFIG, name }),
      });
      if (!res.ok) throw new Error('create failed');
      const created: DisplayConfig = await res.json();
      await reloadConfigList();
      const loaded = { ...DEFAULT_DISPLAY_CONFIG, ...created };
      setCurrentConfigId(created.id ?? null);
      currentConfigIdRef.current = created.id ?? null;
      setConfig(loaded);
      lastSavedConfigRef.current = JSON.stringify(loaded);
      // 新規設定はスライド0件。前設定のスライドが残らないよう再取得
      await loadCustomSlides();
      showMessage('success', '設定を作成しました');
    } catch {
      showMessage('error', '設定の作成に失敗しました');
    }
  };

  /** 選択中の設定をリネームする（モーダルで入力した名前を受け取る） */
  const renameConfig = async (name: string) => {
    if (!currentConfigId) return;
    try {
      const res = await fetch(`/api/settings/display/${currentConfigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('rename failed');
      setConfig((prev) => ({ ...prev, name }));
      lastSavedConfigRef.current = JSON.stringify({ ...config, name });
      await reloadConfigList();
      showMessage('success', '設定名を変更しました');
    } catch {
      showMessage('error', '設定名の変更に失敗しました');
    }
  };

  /** 選択中の設定を削除する（最後の1件は削除不可） */
  const handleDeleteConfig = async () => {
    if (!currentConfigId) return;
    if (configList.length <= 1) {
      showMessage('error', '最後の設定は削除できません');
      return;
    }
    if (!(await Dialog.confirm('この設定を削除しますか？'))) return;
    try {
      const res = await fetch(`/api/settings/display/${currentConfigId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('delete failed');
      const remaining = configList.filter((c) => c.id !== currentConfigId);
      await reloadConfigList();
      // 残った設定の先頭に切り替える
      if (remaining[0]) {
        await handleSelectConfigInternal(remaining[0].id);
      }
      showMessage('success', '設定を削除しました');
    } catch {
      showMessage('error', '設定の削除に失敗しました');
    }
  };

  /** 内部用: 確認・自動保存フラッシュなしで設定を読み込む（削除直後の切替用） */
  const handleSelectConfigInternal = async (id: number) => {
    try {
      const res = await fetch(`/api/settings/display?configId=${id}`);
      if (!res.ok) return;
      const data: DisplayConfig = await res.json();
      const loaded = { ...DEFAULT_DISPLAY_CONFIG, ...data };
      setCurrentConfigId(id);
      currentConfigIdRef.current = id;
      setConfig(loaded);
      lastSavedConfigRef.current = JSON.stringify(loaded);
      await loadCustomSlides();
    } catch {
      // 握りつぶす
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          ディスプレイモード設定
        </h2>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg
                className="w-3 h-3 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              保存中...
            </span>
          )}
          {message && (
            <span
              className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* 複数設定の選択・管理バー */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
        <span className="text-sm font-medium text-gray-600">プリセット:</span>
        {currentConfigId != null && configList.length > 0 ? (
          <Select
            value={String(currentConfigId)}
            onChange={(v) => handleSelectConfig(Number(v))}
            options={configList.map((c) => ({
              value: String(c.id),
              label: c.name || '(無名)',
            }))}
          />
        ) : (
          <span className="text-sm text-gray-400">デフォルト（未保存）</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            label="新規"
            variant="outline"
            size="sm"
            onClick={() => setNameModal({ mode: 'create' })}
          />
          <Button
            label="名前変更"
            variant="outline"
            size="sm"
            onClick={() => setNameModal({ mode: 'rename' })}
            disabled={currentConfigId == null}
          />
          <Button
            label="削除"
            variant="outline"
            color="red"
            size="sm"
            onClick={handleDeleteConfig}
            disabled={currentConfigId == null || configList.length <= 1}
          />
        </div>
      </div>

      <div className="space-y-6">
        <ViewSettingsSection
          config={config}
          customSlides={customSlides}
          deletingSlideId={deletingSlideId}
          dataTypes={dataTypes}
          onUpdateView={updateView}
          onMoveView={moveView}
          onDeleteSlide={handleDeleteSlide}
          onEditSlide={handleEditSlide}
          onAddSlide={() => setShowAddSlideModal(true)}
          onAddView={addView}
          onRemoveView={removeView}
        />

        <PlaybackSettingsSection config={config} onConfigChange={setConfig} />

        <FilterSettingsSection
          config={config}
          groups={groups}
          members={members}
          onConfigChange={setConfig}
        />

        <DisplayInfoSection config={config} onConfigChange={setConfig} />

        <BreakingNewsSection config={config} onConfigChange={setConfig} />

        <CustomSlideModal
          open={showAddSlideModal}
          onClose={() => setShowAddSlideModal(false)}
          onSaved={handleSlideCreated}
          displayConfigId={currentConfigId}
        />

        <CustomSlideModal
          open={!!editingSlide}
          onClose={() => setEditingSlide(null)}
          onSaved={handleSlideUpdated}
          slide={editingSlide}
        />

        {/* 設定名入力モーダル（新規作成 / 名前変更で共用） */}
        <ConfigNameModal
          isOpen={nameModal !== null}
          onClose={() => setNameModal(null)}
          title={
            nameModal?.mode === 'rename' ? '設定名の変更' : '新しい設定の作成'
          }
          initialValue={
            nameModal?.mode === 'rename'
              ? (configList.find((c) => c.id === currentConfigId)?.name ?? '')
              : `設定 ${configList.length + 1}`
          }
          confirmLabel={nameModal?.mode === 'rename' ? '変更' : '作成'}
          onSubmit={nameModal?.mode === 'rename' ? renameConfig : createConfig}
        />
      </div>
    </div>
  );
}
