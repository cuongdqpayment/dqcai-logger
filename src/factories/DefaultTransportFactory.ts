// factories/DefaultTransportFactory.ts - Default Transport Factory
import { ITransportFactory, ILogTransport } from '../types/Logger.types';
import { ConsoleTransport } from '../transports/ConsoleTransport';

export class DefaultTransportFactory implements ITransportFactory {
  private transportCreators: Map<string, (config: any) => ILogTransport> = new Map();

  constructor() {
    // Register built-in transports
    this.registerTransport('console', (config) => new ConsoleTransport(config));
  }

  public registerTransport(name: string, creator: (config: any) => ILogTransport): void {
    this.transportCreators.set(name, creator);
  }

  public create(name: string, config: any): ILogTransport | null {
    const creator = this.transportCreators.get(name);
    return creator ? creator(config) : null;
  }

  public getAvailableTransports(): string[] {
    return Array.from(this.transportCreators.keys());
  }
}
