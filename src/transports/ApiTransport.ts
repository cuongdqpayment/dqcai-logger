import axios, { AxiosInstance } from 'axios';
import { ILogTransport, LogEntry } from '../types/Logger.types';

export class ApiTransport implements ILogTransport {
  readonly name = 'api';
  private client: AxiosInstance;
  private endpoint: string;

  constructor(baseURL: string, endpoint: string = '/logs') {
    this.client = axios.create({ baseURL });
    this.endpoint = endpoint;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      await this.client.post(this.endpoint, entry);
    } catch (err) {
      console.error('[ApiTransport] Gửi log thất bại:', err);
    }
  }
}
