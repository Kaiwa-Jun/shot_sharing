import { NextRequest } from "next/server";
import { GET } from "@/app/api/posts/[postId]/like/check/route";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// モック設定
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
  })),
}));

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: jest.fn(),
}));

describe("いいね状態チェックAPIエンドポイント", () => {
  // テスト前の共通設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("いいねがされていない場合はfalseを返すこと", async () => {
    // いいねがない場合のモック設定
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    };

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    });

    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

    // URLからユーザーIDを取得するモック
    const mockURL = new URL(
      "http://localhost:3000/api/posts/test-post-id/like/check?userId=test-user-id"
    );
    const mockRequest = {
      url: mockURL.toString(),
      nextUrl: mockURL,
    };

    // レスポンスの取得
    const response = await GET(mockRequest as unknown as NextRequest, {
      params: { postId: "test-post-id" },
    });

    // レスポンスの検証
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.isLiked).toBe(false);

    // Supabaseクライアントが正しく呼ばれたか検証
    expect(mockSupabase.from).toHaveBeenCalledWith("Like");
    expect(mockSelect).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("userId", "test-user-id");
  });

  it("いいねがされている場合はtrueを返すこと", async () => {
    // いいねがある場合のモック設定
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: "test-like-id" },
      error: null,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    };

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    });

    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

    // URLからユーザーIDを取得するモック
    const mockURL = new URL(
      "http://localhost:3000/api/posts/test-post-id/like/check?userId=test-user-id"
    );
    const mockRequest = {
      url: mockURL.toString(),
      nextUrl: mockURL,
    };

    // レスポンスの取得
    const response = await GET(mockRequest as unknown as NextRequest, {
      params: { postId: "test-post-id" },
    });

    // レスポンスの検証
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.isLiked).toBe(true);
  });

  it("ユーザーIDがない場合は400エラーを返すこと", async () => {
    // URLからユーザーIDを取得するモック（ユーザーIDなし）
    const mockURL = new URL(
      "http://localhost:3000/api/posts/test-post-id/like/check"
    );
    const mockRequest = {
      url: mockURL.toString(),
      nextUrl: mockURL,
    };

    // レスポンスの取得
    const response = await GET(mockRequest as unknown as NextRequest, {
      params: { postId: "test-post-id" },
    });

    // 400エラーの検証
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData.error).toBe("ユーザーIDが必要です");
  });

  it("データベースエラーの場合は500エラーを返すこと", async () => {
    // データベースエラーのモック設定
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "データベースエラー" },
    });

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    };

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    });

    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

    // URLからユーザーIDを取得するモック
    const mockURL = new URL(
      "http://localhost:3000/api/posts/test-post-id/like/check?userId=test-user-id"
    );
    const mockRequest = {
      url: mockURL.toString(),
      nextUrl: mockURL,
    };

    // レスポンスの取得
    const response = await GET(mockRequest as unknown as NextRequest, {
      params: { postId: "test-post-id" },
    });

    // 500エラーの検証
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData.error).toBe("いいね状態の確認に失敗しました");
  });
});
