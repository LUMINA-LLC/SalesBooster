import { describe, it, expect } from 'vitest';
import {
  formatSalesNotificationMessage,
  type NotificationData,
} from '../notificationFormatter';

const baseData: NotificationData = {
  memberName: '山田太郎',
  memberImageUrl: 'https://example.com/avatar.png',
  value: 1_200_000, // YEN 換算前の DB 保存値
  recordDate: new Date('2026-06-04T00:00:00+09:00'),
  createdAt: new Date('2026-06-04T14:30:00+09:00'),
  dataTypeName: '売上',
  unit: 'MAN_YEN',
  customFields: null,
  customFieldDefs: [],
};

describe('formatSalesNotificationMessage', () => {
  describe('テンプレート未設定（デフォルトフォーマット）', () => {
    it('テンプレートが空の場合は従来フォーマットで出力する', () => {
      const msg = formatSalesNotificationMessage(baseData);
      expect(msg).toContain('売上登録');
      expect(msg).toContain('担当: 山田太郎');
      expect(msg).toContain('日付:');
      expect(msg).toContain('登録時刻:');
    });

    it('空白のみのテンプレートもデフォルト扱いになる', () => {
      const msg = formatSalesNotificationMessage(baseData, '   ');
      expect(msg).toContain('売上登録');
    });
  });

  describe('テンプレート設定時', () => {
    it('基本変数を置換する', () => {
      const msg = formatSalesNotificationMessage(
        baseData,
        '{担当}さんが{種別}で{値と単位}を達成！',
      );
      expect(msg).toContain('山田太郎さんが売上で');
      expect(msg).toContain('万円');
    });

    it('値・単位を個別に置換できる', () => {
      const msg = formatSalesNotificationMessage(
        baseData,
        '値={値} 単位={単位}',
      );
      // MAN_YEN: 1,200,000 / 10000 = 120
      expect(msg).toContain('値=120');
      expect(msg).toContain('単位=万円');
    });

    it('未定義の変数はそのまま残す', () => {
      const msg = formatSalesNotificationMessage(baseData, '{担当} / {未定義}');
      expect(msg).toBe('山田太郎 / {未定義}');
    });

    it('カスタムフィールドをフィールド名で置換する', () => {
      const data: NotificationData = {
        ...baseData,
        customFields: { '10': 'ABC商事' },
        customFieldDefs: [{ id: 10, name: '契約先' }],
      };
      const msg = formatSalesNotificationMessage(data, '契約先: {契約先}');
      expect(msg).toBe('契約先: ABC商事');
    });

    it('カスタムフィールドが空文字の場合は置換されず変数が残る', () => {
      const data: NotificationData = {
        ...baseData,
        customFields: { '10': '  ' },
        customFieldDefs: [{ id: 10, name: '契約先' }],
      };
      const msg = formatSalesNotificationMessage(data, '{契約先}');
      expect(msg).toBe('{契約先}');
    });

    it('基本変数名とカスタムフィールド名が衝突した場合は基本変数を優先する', () => {
      const data: NotificationData = {
        ...baseData,
        customFields: { '10': 'カスタム担当' },
        customFieldDefs: [{ id: 10, name: '担当' }],
      };
      const msg = formatSalesNotificationMessage(data, '{担当}');
      expect(msg).toBe('山田太郎');
    });
  });

  describe('カスタムフィールドの末尾自動追記（回帰防止）', () => {
    const dataWithCustom: NotificationData = {
      ...baseData,
      customFields: { '10': 'ABC商事', '11': '初回' },
      customFieldDefs: [
        { id: 10, name: '契約先' },
        { id: 11, name: '商談区分' },
      ],
    };

    it('テンプレートに含まれないカスタム項目は末尾に自動追記される', () => {
      const msg = formatSalesNotificationMessage(dataWithCustom, '{担当}が達成');
      expect(msg).toBe('山田太郎が達成\n契約先: ABC商事\n商談区分: 初回');
    });

    it('テンプレートで参照済みのカスタム項目は末尾追記で重複しない', () => {
      const msg = formatSalesNotificationMessage(
        dataWithCustom,
        '{担当} / 契約先={契約先}',
      );
      // 契約先はテンプレートで使用済み → 末尾には商談区分のみ追記
      expect(msg).toBe('山田太郎 / 契約先=ABC商事\n商談区分: 初回');
    });

    it('デフォルトテンプレート（未設定）でもカスタム項目が末尾に出る', () => {
      const msg = formatSalesNotificationMessage(dataWithCustom);
      expect(msg).toContain('売上登録');
      expect(msg).toContain('担当: 山田太郎');
      expect(msg).toContain('契約先: ABC商事');
      expect(msg).toContain('商談区分: 初回');
    });
  });
});
