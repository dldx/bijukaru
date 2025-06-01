// Cloudflare Workers types that might be missing from @cloudflare/workers-types

declare global {
    interface DurableObjectNamespace {
        idFromName(name: string): DurableObjectId;
        idFromString(id: string): DurableObjectId;
        newUniqueId(): DurableObjectId;
        get(id: DurableObjectId): DurableObjectStub;
    }

    interface DurableObjectId {
        toString(): string;
        equals(other: DurableObjectId): boolean;
    }

    interface DurableObjectStub {
        fetch(request: Request): Promise<Response>;
    }

    interface DurableObjectState {
        storage: DurableObjectStorage;
        id: DurableObjectId;
        blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
        acceptWebSocket(webSocket: WebSocket): void;
        getWebSockets(): WebSocket[];
    }

    interface DurableObjectStorage {
        get<T = any>(key: string): Promise<T | undefined>;
        get<T = any>(keys: string[]): Promise<Map<string, T>>;
        put<T = any>(key: string, value: T): Promise<void>;
        put<T = any>(entries: Record<string, T>): Promise<void>;
        delete(key: string): Promise<boolean>;
        delete(keys: string[]): Promise<number>;
        list(): Promise<Map<string, any>>;
    }

    interface ExecutionContext {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
    }

    interface ExportedHandler<Env = any> {
        fetch?(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
        scheduled?(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void>;
        queue?(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void>;
    }

    interface ScheduledEvent {
        scheduledTime: number;
        cron: string;
    }

    interface MessageBatch {
        readonly queue: string;
        readonly messages: Message[];
        retryAll(): void;
        ackAll(): void;
    }

    interface Message {
        readonly id: string;
        readonly timestamp: Date;
        readonly body: any;
        ack(): void;
        retry(): void;
    }

    const WebSocketPair: {
        new(): {
            0: WebSocket;
            1: WebSocket;
        };
    };
}

export { };