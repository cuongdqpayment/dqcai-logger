import RNFS from 'react-native-fs';
import type { ILogTransport, LogEntry } from '../../types/Logger.types';

export default class RNFileTransport implements ILogTransport {
  readonly name = 'file';
  constructor(private fileName: string = 'app.log') {}
  async log(entry: LogEntry) {
    const line = JSON.stringify(entry) + '\n';
    const path = `${RNFS.DocumentDirectoryPath}/${this.fileName}`;
    await RNFS.appendFile(path, line, 'utf8').catch(err =>
      console.error('[RNFileTransport] write error', err)
    );
  }
}
