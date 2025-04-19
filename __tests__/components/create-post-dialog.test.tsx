import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { useSession } from "@/app/auth/session-provider";
import { usePostsContext } from "@/lib/contexts/posts-context";
import userEvent from "@testing-library/user-event";

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

jest.mock("exifr", () => ({
  parse: jest.fn().mockResolvedValue({}),
}));

jest.mock("exif-js", () => ({
  getData: jest.fn((file, callback) => callback()),
  getAllTags: jest.fn(() => ({})),
  getTag: jest.fn(),
}));

// グローバルモック
global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// FileReader モック
global.FileReader = class FileReader {
  onloadend?: () => void;
  result?: string;

  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readAsDataURL() {
    setTimeout(() => {
      if (this.onloadend) {
        this.result = "data:image/jpeg;base64,mock-base64";
        this.onloadend();
      }
    }, 0);
  }
} as unknown as typeof FileReader;

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

// ファイル入力テスト用のカスタムクエリ
function queryByFileInput(): HTMLInputElement | null {
  return document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement | null;
}

// テストセットアップ関数
function setupTest() {
  // Session モック
  (useSession as jest.Mock).mockReturnValue({
    authUser: { id: "mock-user-id", email: "user@example.com" },
    dbUser: { id: "mock-db-user-id" },
  });

  // PostsContext モック
  (usePostsContext as jest.Mock).mockReturnValue({
    addNewPost: jest.fn(),
    refreshPosts: jest.fn(),
  });

  // Fetch モック
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 201,
    json: jest.fn().mockResolvedValue({
      data: { id: "mock-post-id" },
    }),
  });
}

describe("CreatePostDialog", () => {
  beforeEach(() => {
    setupTest();
    jest.clearAllMocks();
  });

  // ダイアログレンダリングのテスト
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

  // 画像のアップロードと説明の入力ができることをテスト
  it("画像のアップロードと説明の入力ができること", async () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    // ファイル入力の取得
    const fileInput = queryByFileInput();
    expect(fileInput).toBeInTheDocument();

    // 画像ファイルの作成とアップロード
    const file = new File(["dummy content"], "test.jpg", {
      type: "image/jpeg",
    });
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    // 説明入力
    const descriptionInput = screen.getByPlaceholderText("説明を入力...");
    fireEvent.change(descriptionInput, { target: { value: "テスト投稿です" } });

    // 入力値の確認
    expect((descriptionInput as HTMLTextAreaElement).value).toBe(
      "テスト投稿です"
    );

    // 画像が表示されることを確認
    await waitFor(() => {
      const image = screen.getByAltText("Preview");
      expect(image).toBeInTheDocument();
    });
  });

  // フォーム送信が正しく動作することをテスト
  it("フォーム送信が正しく動作すること", async () => {
    const mockOnOpenChange = jest.fn();
    const user = userEvent.setup();

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({
        data: { id: "test-post-id" },
      }),
      blob: jest
        .fn()
        .mockResolvedValue(new Blob(["dummy"], { type: "image/jpeg" })),
    });

    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={mockOnOpenChange} />
      </ToastProvider>
    );

    // ファイル入力
    const fileInput = queryByFileInput();
    expect(fileInput).toBeInTheDocument();

    const file = new File(["dummy content"], "test.jpg", {
      type: "image/jpeg",
    });

    await waitFor(() => {
      expect(fileInput).not.toBeNull();
    });

    if (fileInput) {
      fireEvent.change(fileInput as HTMLInputElement, {
        target: { files: [file] },
      });
    }

    // 説明入力
    const descriptionInput = screen.getByPlaceholderText("説明を入力...");
    await user.type(descriptionInput, "テスト投稿です");

    // 送信ボタンをクリック
    const submitButton = screen.getByRole("button", { name: "投稿" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // ダイアログが閉じられることを確認
    await waitFor(
      () => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      },
      { timeout: 3000 }
    );

    // 投稿APIが呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith("/api/posts", expect.any(Object));
  });

  // バリデーションのテスト
  it("画像がない場合は投稿ボタンが無効化されること", () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    const submitButton = screen.getByRole("button", { name: "投稿" });
    expect(submitButton).toBeDisabled();
  });

  it("画像がアップロードされると投稿ボタンが有効になること", async () => {
    render(
      <ToastProvider>
        <CreatePostDialog open={true} onOpenChange={jest.fn()} />
      </ToastProvider>
    );

    // スクリーンからテキスト「クリックして画像をアップロード」を探し、その近くのinput要素を取得
    const uploadText = screen.getByText("クリックして画像をアップロード");
    const fileInput = uploadText
      .closest("div")
      ?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(["dummy content"], "example.jpg", {
      type: "image/jpeg",
    });

    if (fileInput) {
      // TypeScriptのNull検査を通過
      userEvent.upload(fileInput, file);

      // 投稿ボタンが有効になることを確認
      const submitButton = screen.getByText("投稿");
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    }
  });
});
