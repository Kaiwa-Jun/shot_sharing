import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { LikeButton } from "@/components/post-card";
import { useSession } from "@/app/auth/session-provider";
import { toast } from "sonner";

// モックの設定
jest.mock("@/app/auth/session-provider", () => ({
  useSession: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// fetchのグローバルモック
global.fetch = jest.fn();

describe("LikeButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトの認証ユーザー設定
    (useSession as jest.Mock).mockReturnValue({
      authUser: { id: "test-user-id", email: "test@example.com" },
      dbUser: { id: "test-db-user-id" },
    });

    // デフォルトのfetchモック設定
    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      // いいね状態チェックのレスポンス
      if (url.includes("/check")) {
        return {
          ok: true,
          json: async () => ({ isLiked: false }),
        };
      }

      // いいね処理のレスポンス
      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
  });

  it("いいねボタンが正しくレンダリングされること", () => {
    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={false}
        initialLikeCount={10}
      />
    );

    // いいねボタンとカウントの存在確認
    const likeButton = screen.getByRole("button");
    expect(likeButton).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("初期状態が正しく設定されていること", () => {
    // いいねされていない状態でレンダリング
    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={false}
        initialLikeCount={5}
      />
    );

    // いいねされていない状態の確認
    const heartIcon = document.querySelector("svg");
    expect(heartIcon).not.toHaveClass("fill-red-500");
    expect(screen.getByText("5")).toBeInTheDocument();

    // クリーンアップ
    document.body.innerHTML = "";

    // いいねされている状態でレンダリング
    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={true}
        initialLikeCount={5}
      />
    );

    // いいねされている状態の確認
    const filledHeartIcon = document.querySelector("svg");
    expect(filledHeartIcon).toHaveClass("fill-red-500");
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("いいねボタンをクリックするとAPIが呼び出されること", async () => {
    const user = userEvent.setup();

    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={false}
        initialLikeCount={5}
      />
    );

    // いいねボタンをクリック
    const likeButton = screen.getByRole("button");
    await user.click(likeButton);

    // APIが呼ばれたことを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/posts/test-post-id/like"),
        expect.any(Object)
      );
    });

    // いいねカウントが増えたことを確認
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("認証されていない場合はエラーメッセージが表示されること", async () => {
    // 未認証の状態を設定
    (useSession as jest.Mock).mockReturnValue({
      authUser: null,
      dbUser: null,
    });

    const user = userEvent.setup();

    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={false}
        initialLikeCount={5}
      />
    );

    // いいねボタンをクリック
    const likeButton = screen.getByRole("button");
    await user.click(likeButton);

    // エラーメッセージが表示されることを確認
    expect(toast.error).toHaveBeenCalledWith(
      "いいねするにはログインが必要です"
    );

    // APIが呼ばれていないことを確認
    expect(global.fetch).not.toHaveBeenCalled();

    // いいねカウントが変わっていないことを確認
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("いいねを削除するとカウントが減少すること", async () => {
    // いいね済みの状態を設定
    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.includes("/check")) {
        return {
          ok: true,
          json: async () => ({ isLiked: true }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });

    const user = userEvent.setup();

    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={true}
        initialLikeCount={5}
      />
    );

    // いいねボタンをクリック（いいね削除）
    const likeButton = screen.getByRole("button");
    await user.click(likeButton);

    // DELETEリクエストが呼ばれたことを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/posts/test-post-id/like"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    // いいねカウントが減ったことを確認
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("APIエラー時にエラーメッセージが表示されること", async () => {
    // APIエラーを発生させる
    (global.fetch as jest.Mock).mockImplementation(async () => {
      return {
        ok: false,
        json: async () => ({ error: "テストエラー" }),
      };
    });

    const user = userEvent.setup();

    render(
      <LikeButton
        postId="test-post-id"
        initialIsLiked={false}
        initialLikeCount={5}
      />
    );

    // いいねボタンをクリック
    const likeButton = screen.getByRole("button");
    await user.click(likeButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // いいねカウントが元に戻っていることを確認
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
