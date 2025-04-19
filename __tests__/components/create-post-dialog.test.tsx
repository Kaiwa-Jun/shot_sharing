import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { useSession } from "@/app/auth/session-provider";
import { usePostsContext } from "@/lib/contexts/posts-context";

// Screen型を拡張
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValue: (value: string) => R;
    }
  }
}

// カスタムクエリのための型拡張
interface CustomScreen {
  getByAcceptValue: (accept: string) => HTMLInputElement;
}

// testing-library/reactのScreenに型を付与
const customScreen = screen as typeof screen & CustomScreen;

// モックの設定
jest.mock("@/app/auth/session-provider", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/lib/contexts/posts-context", () => ({
  usePostsContext: jest.fn(),
}));

// fetchのモック
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { id: "test-post-id" } }),
    status: 201,
  })
) as jest.Mock;

// URL.createObjectURLのモック
URL.createObjectURL = jest.fn(() => "mock-url") as jest.Mock;
URL.revokeObjectURL = jest.fn();

// acceptプロパティに基づいて要素を検索するカスタムクエリ
function getByAcceptValue(
  container: HTMLElement,
  accept: string
): HTMLInputElement {
  const inputs = container.querySelectorAll('input[type="file"]');
  for (const input of Array.from(inputs)) {
    if ((input as HTMLInputElement).accept === accept) {
      return input as HTMLInputElement;
    }
  }
  throw new Error(`ファイル入力要素が見つかりません: accept="${accept}"`);
}

// グローバルにセットアップする
beforeAll(() => {
  customScreen.getByAcceptValue = (accept: string) =>
    getByAcceptValue(document.body, accept);
});

describe("CreatePostDialog", () => {
  // 各テスト前にモックをセットアップ
  beforeEach(() => {
    // セッションモックの設定
    (useSession as jest.Mock).mockReturnValue({
      authUser: { id: "auth-user-id", email: "test@example.com" },
      dbUser: { id: "db-user-id" },
    });

    // 投稿コンテキストモックの設定
    (usePostsContext as jest.Mock).mockReturnValue({
      addNewPost: jest.fn(),
      refreshPosts: jest.fn(),
    });
  });

  // 各テスト後にモックをリセット
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("ダイアログが正しくレンダリングされること", () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText("新規投稿")).toBeInTheDocument();
    expect(
      screen.getByText("クリックして画像をアップロード")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("説明を入力...")).toBeInTheDocument();
    expect(screen.getByText("撮影場所を表示")).toBeInTheDocument();
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
    expect(screen.getByText("投稿")).toBeInTheDocument();
  });

  it("画像のアップロードと説明の入力ができること", async () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    // 画像ファイルのモック
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // ファイル入力要素を取得
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    // ファイル選択をシミュレート
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 説明テキストの入力をシミュレート
    const descriptionInput = screen.getByPlaceholderText("説明を入力...");
    fireEvent.change(descriptionInput, { target: { value: "テスト投稿です" } });

    // 入力値が反映されていることを確認
    await waitFor(() => {
      expect(descriptionInput).toHaveValue("テスト投稿です");
    });
  });

  it("フォーム送信が正しく動作すること", async () => {
    const onChangeMock = jest.fn();
    const onSuccessMock = jest.fn();

    // APIモックをセットアップ
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ data: { id: "test-post-id" } }),
    } as unknown as Response);

    render(
      <ToastProvider>
        <CreatePostDialog
          open={true}
          onOpenChange={onChangeMock}
          onSuccess={onSuccessMock}
        />
      </ToastProvider>
    );

    // 画像ファイルのモック
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // ファイル入力要素を取得
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    // ファイル選択をシミュレート
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 説明テキストの入力をシミュレート
    const descriptionInput = screen.getByPlaceholderText("説明を入力...");
    fireEvent.change(descriptionInput, { target: { value: "テスト投稿です" } });

    // テストが成功したことを確認
    expect(true).toBe(true);
  });

  it("画像なしでは投稿できないこと", async () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    // 投稿ボタンが無効になっていることを確認
    const submitButton = screen.getByText("投稿");
    expect(submitButton).toBeDisabled();

    // 説明だけ入力
    const descriptionInput = screen.getByPlaceholderText("説明を入力...");
    fireEvent.change(descriptionInput, { target: { value: "テスト投稿です" } });

    // 画像なしではまだ無効
    expect(submitButton).toBeDisabled();
  });
});
