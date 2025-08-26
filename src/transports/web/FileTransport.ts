import type { ILogTransport, LogEntry } from '../../types/Logger.types';
const KEY = 'unilog';

export default class WebFileTransport implements ILogTransport {
  readonly name = 'file';
  async log(entry: LogEntry) {
    try {
      const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      arr.push(entry);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {
      // fallback console
      console.error('[WebFileTransport] persist error', e);
    }
  }
}
