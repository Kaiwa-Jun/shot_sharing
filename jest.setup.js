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

// NextRequestとNextResponseのモック
global.NextResponse = {
  json: jest.fn((data, options) => ({
    status: options?.status || 200,
    json: async () => data,
  })),
};

// NextRequestのモック
jest.mock("next/server", () => {
  return {
    NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
      url,
      method: options.method || "GET",
      headers: {
        get: jest.fn((name) => options.headers?.[name] || ""),
        forEach: jest.fn(),
      },
      cookies: {
        get: jest.fn(),
        getAll: jest.fn(() => []),
        set: jest.fn(),
        delete: jest.fn(),
      },
      json: async () => (options.body ? JSON.parse(options.body) : {}),
      nextUrl: new URL(url),
    })),
    NextResponse: {
      json: (data, options) => ({
        status: options?.status || 200,
        json: async () => data,
      }),
    },
  };
});

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
jest.mock("heic2any", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return Promise.resolve("mock-image-data");
    }),
  };
});
