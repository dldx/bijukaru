import { DurableObject } from 'cloudflare:workers';

export interface Env {
    BIJUKARU_SYNC: DurableObjectNamespace;
}

export interface SyncedData {
    favourites: Record<string, string[]>; // mediaSource -> categoryIds[]
    likedImages: Array<{
        id: string;
        title: string;
        image_url: string;
        link: string;
        description?: string;
        artist_name?: string;
        media_source?: string;
        category_id?: string;
    }>;
}

// Main Worker
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Handle WebSocket connections for sync
        if (url.pathname === '/ws') {
            const upgradeHeader = request.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return new Response('Expected Upgrade: websocket', { status: 426 });
            }

            // Get device token from query params
            const deviceToken = url.searchParams.get('token');
            if (!deviceToken || deviceToken.length !== 8) {
                return new Response('Invalid or missing device token', { status: 400 });
            }

            // Create or get Durable Object for this device token
            const id = env.BIJUKARU_SYNC.idFromName(deviceToken);
            const stub = env.BIJUKARU_SYNC.get(id);

            return stub.fetch(request);
        }

        // Handle device token generation
        if (url.pathname === '/generate-token' && request.method === 'POST') {
            const token = generateDeviceToken();
            return new Response(JSON.stringify({ token }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
                }
            });
        }

        return new Response('Bijukaru Sync Service', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain'
            }
        });
    },
} satisfies ExportedHandler<Env>;

// Utility function to generate device tokens
function generateDeviceToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Durable Object for Bijukaru Sync
export class BijukaruSyncDO {
    private state: DurableObjectState;
    private env: Env;
    private sessions: Set<WebSocket> = new Set();
    private syncData: SyncedData = { favourites: {}, likedImages: [] };

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;

        // Initialize data from storage
        this.state.blockConcurrencyWhile(async () => {
            await this.loadSyncData();
        });
    }

    private async loadSyncData(): Promise<void> {
        try {
            const stored = await this.state.storage.get<SyncedData>('syncData');
            if (stored) {
                this.syncData = stored;
            }
        } catch (error) {
            console.error('Failed to load sync data:', error);
        }
    }

    private async saveSyncData(): Promise<void> {
        try {
            await this.state.storage.put('syncData', this.syncData);
            await this.state.storage.put('lastUpdated', Date.now());
        } catch (error) {
            console.error('Failed to save sync data:', error);
        }
    }

    async fetch(request: Request): Promise<Response> {
        // Handle WebSocket upgrade
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader === 'websocket') {
            return this.handleWebSocketUpgrade(request);
        }

        // Handle HTTP requests for sync status
        const url = new URL(request.url);

        if (url.pathname === '/status') {
            return new Response(JSON.stringify({
                connected: this.sessions.size,
                lastUpdated: await this.state.storage.get('lastUpdated'),
                dataSize: {
                    favourites: Object.keys(this.syncData.favourites).length,
                    likedImages: this.syncData.likedImages.length
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        return new Response('WebSocket upgrade required', { status: 400 });
    }

    private async handleWebSocketUpgrade(request: Request): Promise<Response> {
        // Create WebSocket pair
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // Accept the WebSocket
        this.state.acceptWebSocket(server as WebSocket);
        this.sessions.add(server as WebSocket);

        // Send current data to the new client
        try {
            (server as WebSocket).send(JSON.stringify(this.syncData));
        } catch (error) {
            console.error('Failed to send initial data to client:', error);
        }

        console.log(`WebSocket connected. Total sessions: ${this.sessions.size}`);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        try {
            // Parse the incoming message
            const messageStr = typeof message === 'string' ? message : new TextDecoder().decode(message);
            const data = JSON.parse(messageStr) as SyncedData;

            // Merge the received data with existing data
            this.mergeSyncData(data);

            // Save the updated data
            await this.saveSyncData();

            // Broadcast the merged data to all other connected clients
            const broadcastData = JSON.stringify(this.syncData);
            this.sessions.forEach(session => {
                if (session !== ws && session.readyState === 1) { // WebSocket.READY_STATE_OPEN
                    try {
                        session.send(broadcastData);
                    } catch (error) {
                        console.error('Failed to broadcast to session:', error);
                        this.sessions.delete(session);
                    }
                }
            });

        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    private mergeSyncData(incomingData: SyncedData): void {
        // Merge favourites - combine all category sets per media source
        Object.entries(incomingData.favourites).forEach(([mediaSource, categoryIds]) => {
            if (!this.syncData.favourites[mediaSource]) {
                this.syncData.favourites[mediaSource] = [];
            }

            // Merge category IDs (avoid duplicates)
            const existingIds = new Set(this.syncData.favourites[mediaSource]);
            categoryIds.forEach(id => existingIds.add(id));
            this.syncData.favourites[mediaSource] = Array.from(existingIds);
        });

        // Merge liked images - avoid duplicates by ID
        const existingImageIds = new Set(this.syncData.likedImages.map(img => img.id));
        incomingData.likedImages.forEach(image => {
            if (!existingImageIds.has(image.id)) {
                this.syncData.likedImages.push(image);
                existingImageIds.add(image.id);
            }
        });
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
        this.sessions.delete(ws);
        console.log(`WebSocket disconnected. Total sessions: ${this.sessions.size}`);
    }

    async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        console.error('WebSocket error:', error);
        this.sessions.delete(ws);
    }

    // Cleanup method called periodically
    async alarm(): Promise<void> {
        // Clean up dead connections
        const activeSessions = this.state.getWebSockets();
        this.sessions.clear();
        activeSessions.forEach(ws => this.sessions.add(ws));

        // Save current state
        await this.saveSyncData();

        console.log(`Alarm: cleaned up sessions, ${this.sessions.size} active`);
    }
}