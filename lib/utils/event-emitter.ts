type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  // イベントリスナーを登録
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // イベントリスナーを削除
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  // イベントを発行
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => {
      callback(...args);
    });
  }
}

// シングルトンインスタンスを作成
const eventEmitter = new EventEmitter();

// イベント名を定数として定義
export const EVENTS = {
  COMMENT_ADDED: "comment_added",
};

export default eventEmitter;
