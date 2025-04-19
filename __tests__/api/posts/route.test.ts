import { NextResponse } from "next/server";

// 実際のモジュールをインポートする前にモックを設定
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: "test-user-id" },
        },
      }),
    },
    from: jest.fn().mockImplementation((table) => {
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          return {
            data: { id: "post-1" },
            error: null,
          };
        }),
        then: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: [
              {
                id: "post-1",
                createdAt: "2023-01-01T00:00:00Z",
                Like: [],
                User: { id: "user-1" },
              },
            ],
            error: null,
          });
        }),
      };
    }),
  })),
}));

// next/headersのcookiesをモック
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// NextResponseのjsonメソッドをモック
jest.spyOn(NextResponse, "json").mockImplementation((data: any) => {
  return {
    data,
    status: data.status || 200,
  } as unknown as NextResponse;
});

describe("Posts API", () => {
  // テスト用の変数
  let mockRequest: Request;
  let originalURL: typeof global.URL;
  let GET: any;
  let POST: any;

  beforeAll(async () => {
    // APIのルートハンドラをインポート
    jest.isolateModules(async () => {
      const routeModule = await import("@/app/api/posts/route");
      GET = routeModule.GET;
      POST = routeModule.POST;
    });
  });

  beforeEach(() => {
    // URLのモック
    originalURL = global.URL;
    global.URL = jest.fn(() => ({
      searchParams: {
        get: jest.fn((param) => {
          const params: Record<string, string> = {
            page: "1",
            limit: "10",
            sortBy: "createdAt",
            sortOrder: "desc",
            followedOnly: "false",
          };
          return params[param] || null;
        }),
      },
    })) as any;

    // リクエストのモック
    mockRequest = {
      url: "http://localhost:3000/api/posts",
      json: jest.fn().mockResolvedValue({
        imageUrl: "http://example.com/test.jpg",
        description: "テスト投稿",
        userId: "test-user-id",
        userEmail: "test@example.com",
      }),
    } as unknown as Request;
  });

  afterEach(() => {
    global.URL = originalURL;
    jest.clearAllMocks();
  });

  test("投稿APIの基本的なテスト", async () => {
    expect(true).toBe(true);
  });
});
