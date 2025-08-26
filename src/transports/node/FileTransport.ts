import fs from 'fs';
import type { ILogTransport, LogEntry } from '../../types/Logger.types';

export default class NodeFileTransport implements ILogTransport {
  readonly name = 'file';
  constructor(private filePath: string = './app.log') {}
  async log(entry: LogEntry) {
    fs.appendFile(this.filePath, JSON.stringify(entry) + '\n', e => {
      if (e) console.error('[NodeFileTransport] write error', e);
    });
  }
}
