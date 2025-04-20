import { NextRequest, NextResponse } from "next/server";
import { POST, DELETE } from "@/app/api/posts/[postId]/like/route";
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

describe("いいねAPIエンドポイント", () => {
  // テスト前の共通設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST - いいね追加", () => {
    it("正常にいいねが追加されること", async () => {
      // モック関数の設定
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectAfterInsert = jest.fn().mockResolvedValue({
        data: [{ id: "test-like-id" }],
        error: null,
      });

      // Supabaseクライアントのモック
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "test-user-id", email: "test@example.com" } },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "User") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
              insert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }),
      };

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      mockInsert.mockReturnValue({
        select: mockSelectAfterInsert,
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // URLとリクエストボディのモック
      const mockURL = new URL(
        "http://localhost:3000/api/posts/test-post-id/like?userId=test-user-id"
      );
      const mockRequest = {
        url: mockURL.toString(),
        nextUrl: mockURL,
        method: "POST",
        json: jest.fn().mockResolvedValue({ userId: "test-user-id" }),
        headers: {
          get: jest.fn(),
          forEach: jest.fn(),
        },
      };

      // レスポンスの取得
      const response = await POST(mockRequest as unknown as NextRequest, {
        params: { postId: "test-post-id" },
      });

      // レスポンスの検証
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Supabaseクライアントが正しく呼ばれたか検証
      expect(mockSupabase.from).toHaveBeenCalledWith("Like");
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: "test-user-id",
          postId: "test-post-id",
        }),
      ]);
    });

    it("認証されていない場合は401エラーを返すこと", async () => {
      // 認証エラーのモック設定
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("認証エラー"),
          }),
        },
        from: jest.fn(),
      };

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // URLパラメータなしのリクエスト
      const mockURL = new URL(
        "http://localhost:3000/api/posts/test-post-id/like"
      );
      const mockRequest = {
        url: mockURL.toString(),
        nextUrl: mockURL,
        method: "POST",
        json: jest.fn().mockResolvedValue({}),
        headers: {
          get: jest.fn(),
          forEach: jest.fn(),
        },
      };

      // レスポンスの取得
      const response = await POST(mockRequest as unknown as NextRequest, {
        params: { postId: "test-post-id" },
      });

      // 401エラーの検証
      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBeTruthy();
    });

    it("すでにいいねが存在する場合は400エラーを返すこと", async () => {
      // モック関数の設定
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: "existing-like" },
        error: null,
      });

      // Supabaseクライアントのモック
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "test-user-id", email: "test@example.com" } },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "User") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({
                  data: { id: "test-user-id" },
                  error: null,
                }),
            };
          }
          return {
            select: mockSelect,
          };
        }),
      };

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // URLとリクエストボディのモック
      const mockURL = new URL(
        "http://localhost:3000/api/posts/test-post-id/like?userId=test-user-id"
      );
      const mockRequest = {
        url: mockURL.toString(),
        nextUrl: mockURL,
        method: "POST",
        json: jest.fn().mockResolvedValue({ userId: "test-user-id" }),
        headers: {
          get: jest.fn(),
          forEach: jest.fn(),
        },
      };

      // レスポンスの取得
      const response = await POST(mockRequest as unknown as NextRequest, {
        params: { postId: "test-post-id" },
      });

      // 400エラーの検証
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("すでにいいねしています");
    });
  });

  describe("DELETE - いいね削除", () => {
    it("正常にいいねが削除されること", async () => {
      // モック関数の設定
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSecondEq = jest.fn().mockResolvedValue({
        error: null,
      });

      // Supabaseクライアントのモック
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "test-user-id", email: "test@example.com" } },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "User") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({
                  data: { id: "test-user-id" },
                  error: null,
                }),
            };
          }
          return {
            delete: mockDelete,
          };
        }),
      };

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        eq: mockSecondEq,
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // URLのモック
      const mockURL = new URL(
        "http://localhost:3000/api/posts/test-post-id/like?userId=test-user-id"
      );
      const mockRequest = {
        url: mockURL.toString(),
        nextUrl: mockURL,
        method: "DELETE",
        json: jest.fn().mockResolvedValue({}),
        headers: {
          get: jest.fn(),
          forEach: jest.fn(),
        },
      };

      // レスポンスの取得
      const response = await DELETE(mockRequest as unknown as NextRequest, {
        params: { postId: "test-post-id" },
      });

      // レスポンスの検証
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Supabaseクライアントが正しく呼ばれたか検証
      expect(mockSupabase.from).toHaveBeenCalledWith("Like");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("userId", "test-user-id");
      expect(mockSecondEq).toHaveBeenCalledWith("postId", "test-post-id");
    });

    it("認証されていない場合は401エラーを返すこと", async () => {
      // 認証エラーのモック設定
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("認証エラー"),
          }),
        },
        from: jest.fn(),
      };

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // URLパラメータなしのリクエスト
      const mockURL = new URL(
        "http://localhost:3000/api/posts/test-post-id/like"
      );
      const mockRequest = {
        url: mockURL.toString(),
        nextUrl: mockURL,
        method: "DELETE",
        json: jest.fn().mockResolvedValue({}),
        headers: {
          get: jest.fn(),
          forEach: jest.fn(),
        },
      };

      // レスポンスの取得
      const response = await DELETE(mockRequest as unknown as NextRequest, {
        params: { postId: "test-post-id" },
      });

      // 401エラーの検証
      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBeTruthy();
    });
  });
});
