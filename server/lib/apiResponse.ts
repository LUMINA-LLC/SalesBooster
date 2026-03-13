import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * APIレスポンスを統一的に生成するユーティリティクラス。
 *
 * 成功レスポンス: データをそのまま返却（またはmeta付き）
 * エラーレスポンス: { error: string }
 */
export class ApiResponse {
  /** 成功レスポンス (200) */
  static success<T>(data: T, meta?: Record<string, unknown>): NextResponse {
    if (meta) {
      return NextResponse.json({ ...(data as object), ...meta });
    }
    return NextResponse.json(data);
  }

  /** リソース作成成功レスポンス (201) */
  static created<T>(data: T): NextResponse {
    return NextResponse.json(data, { status: 201 });
  }

  /** バリデーションエラーレスポンス (400) */
  static badRequest(message: string): NextResponse {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  /** リソース未検出レスポンス (404) */
  static notFound(message: string = 'Resource not found'): NextResponse {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  /** 競合エラーレスポンス (409) */
  static conflict(message: string = 'Resource already exists'): NextResponse {
    return NextResponse.json({ error: message }, { status: 409 });
  }

  /** 認可エラーレスポンス (403) */
  static forbidden(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  /** サーバーエラーレスポンス (500) */
  static serverError(message: string = 'Internal Server Error'): NextResponse {
    return NextResponse.json({ error: message }, { status: 500 });
  }

  /** Prismaエラーを適切なHTTPレスポンスに変換する */
  static fromError(error: unknown, context: string): NextResponse {
    console.error(`${context}:`, error);

    if (error instanceof Error && error.message === 'LICENSE_EXPIRED') {
      return ApiResponse.forbidden(
        'ライセンスの有効期限が切れています。契約を更新してください。',
      );
    }

    if (error instanceof Error && error.message === 'PLAN_TYPE_REQUIRED') {
      return ApiResponse.badRequest('プランを選択してください');
    }

    if (
      error instanceof Error &&
      error.message === 'LICENSE_END_DATE_REQUIRED'
    ) {
      return ApiResponse.badRequest('ライセンス終了日を設定してください');
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return ApiResponse.notFound('対象のレコードが見つかりません');
        case 'P2002': {
          const fields = (error.meta?.target as string[])?.join(', ') || '';
          return ApiResponse.conflict(
            fields
              ? `${fields} は既に使用されています`
              : '重複するレコードが存在します',
          );
        }
        case 'P2003':
          return ApiResponse.badRequest(
            '関連するレコードが存在するため、操作を完了できません',
          );
      }
    }

    if (error instanceof SyntaxError) {
      return ApiResponse.badRequest('リクエストボディが不正です');
    }

    return ApiResponse.serverError();
  }
}
