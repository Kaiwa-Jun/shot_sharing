import "@testing-library/jest-dom";

// グローバルオブジェクトのモック
global.Request = class Request {};
global.Response = class Response {};
global.Headers = class Headers {};
global.Worker = class Worker {
  constructor() {
    this.onmessage = null;
  }
  postMessage() {}
  terminate() {}
};

// ResizeObserverをモック
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Next.jsのApp Routerをモック
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/",
}));

// heic2anyをモック
jest.mock("heic2any", () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockResolvedValue(new Blob(["test"], { type: "image/jpeg" })),
}));
