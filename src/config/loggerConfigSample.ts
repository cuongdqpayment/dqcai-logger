import {BaseModule, LoggerConfigBuilder, createLogger } from '..';
const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel('error') //phun lỗi toàn cục từ mốc trace->error
  .addModule('SQLiteDAO', true, ['debug','info','warn','error'], ['console'])
  // .addModule('ApiClient', false) // Completely disabled
  // .addModule('AuthService', true, ['error'], ['console','api'])
  .build();

  /**

Công thức ngắn gọn để nhớ khi debug logger này nhé:

Có config riêng (addModule) → theo config đó.
Không có config riêng → dùng defaultLevel.
Thứ tự mức độ:
trace → debug → info → warn → error

(cái gì “≥ defaultLevel” thì sẽ được log).

👉 Muốn bật hết toàn bộ tiến trình: chỉ cần defaultLevel = 'trace'.
👉 Muốn tắt hết toàn bộ: setGlobalEnabled(false).
👉 Muốn chỉ 1 module: dùng setModuleConfig() hoặc helper enableOnly().

Ok, mình tóm gọn cho bạn cách bật log từ API và truyền log về máy chủ nhé 🚀:

🔹 Bước 1: Tạo transport gửi log về server

Ví dụ dùng HTTP POST API:

import { ILogTransport, LogEntry } from './src/logger';

class ApiTransport implements ILogTransport {
  readonly name = 'api';
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.error('Failed to send log to API:', err);
    }
  }
}

🔹 Bước 2: Khởi tạo logger kèm transport
import { createLogger } from './src/logger';

const logger = createLogger();
logger.addTransport(new ApiTransport('https://your-server.com/api/logs'));

🔹 Bước 3: Ghi log trong code
await logger.info('ApiClient', 'Request started', { url: '/api/data' });
await logger.error('DatabaseManager', 'Connection failed', { error });

✅ Vậy là: mọi log sẽ vừa in ra console, vừa gửi về máy chủ qua API.

👉 Có thể batch mode (gom log rồi gửi một lần để tiết kiệm request), hay gửi từng log một?
*/

const logger = createLogger(config);

export {
  BaseModule,
  logger,
};