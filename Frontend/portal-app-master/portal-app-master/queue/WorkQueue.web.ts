import type { QueuedTaskRecord } from '@/services/DatabaseService';
import type { GlobalProviders } from './Providers';

type GlobalProviderNames = GlobalProviders['name'];

type ProvidersSubset<N extends GlobalProviderNames[]> = {
  [K in GlobalProviderNames]: K extends N[number]
    ? Extract<GlobalProviders, { name: K }>['type']
    : never;
};

export abstract class Arguments<TArgs extends unknown[] = unknown[]> {
  constructor(protected readonly args: TArgs) {}

  abstract hash(): string;

  values(): TArgs {
    return this.args;
  }

  equals(other: Arguments<TArgs>): boolean {
    return this.hash() === other.hash();
  }
}

export class JsonArguments<TArgs extends unknown[] = unknown[]> extends Arguments<TArgs> {
  hash(): string {
    return JSON.stringify(this.args);
  }
}

export abstract class Task<A extends unknown[], P extends GlobalProviderNames[], T> {
  private static registry = new Map<
    string,
    TaskConstructor<unknown[], GlobalProviderNames[], unknown>
  >();

  protected readonly args: Arguments<A>;

  constructor(
    protected readonly providerNames: P,
    ...args: A
  ) {
    this.args = new JsonArguments(args);
  }

  abstract taskLogic(providers: ProvidersSubset<P>, ...args: A): Promise<T>;

  async run(): Promise<T> {
    throw new Error('WorkQueue is not supported on web.');
  }

  serialize(): QueuedTaskRecord {
    return {
      id: 0,
      task_name: this.constructor.name,
      arguments: JSON.stringify(this.args.values()),
      added_at: Math.floor(Date.now() / 1000),
      expires_at: null,
      priority: 0,
    };
  }

  static register<A extends unknown[], P extends GlobalProviderNames[], T>(
    instance: new (...args: any[]) => Task<A, P, T>
  ) {
    Task.registry.set(instance.name, instance as TaskConstructor<any[], any, any>);
  }

  static getFromRegistry(
    name: string
  ): TaskConstructor<unknown[], GlobalProviderNames[], unknown> | undefined {
    return Task.registry.get(name);
  }

  static deserialize(_serialized: QueuedTaskRecord): Task<any[], any, any> {
    throw new Error('Task deserialization is not supported on web.');
  }
}

export abstract class TransactionalTask<
  A extends unknown[],
  P extends GlobalProviderNames[],
  T,
> extends Task<A, P, T> {}

export type TaskConstructor<
  A extends unknown[] = unknown[],
  P extends GlobalProviderNames[] = GlobalProviderNames[],
  T = unknown,
> = new (...args: any[]) => Task<A, P, T>;

export class ProviderRepository {
  private static providers = new Map<GlobalProviderNames, any>();

  static register<N extends GlobalProviderNames>(
    provider: Extract<GlobalProviders, { name: N }>['type'],
    name: N
  ) {
    ProviderRepository.providers.set(name, provider);
  }

  static get<N extends GlobalProviderNames>(type: N): ProvidersSubset<[N]>[N] | undefined {
    return ProviderRepository.providers.get(type) as ProvidersSubset<[N]>[N];
  }
}

export async function resumeTasks() {
  // No-op on web.
}

export async function enqueueTask<T>(_task: Task<any[], any, T>): Promise<T> {
  throw new Error('Queued tasks are not supported on web.');
}
