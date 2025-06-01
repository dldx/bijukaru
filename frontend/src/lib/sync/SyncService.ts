// Simplified sync service without TinyBase for now - we'll implement basic WebSocket sync
export interface SyncConfig {
    deviceToken: string;
    wsUrl: string;
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

export class SyncService {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private currentToken: string | null = null;
    private syncListeners: Array<() => void> = [];
    private wsUrl: string;
    private localData: SyncedData = { favourites: {}, likedImages: [] };
    private reconnectTimeout: number | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor() {
        // Determine WebSocket URL based on environment
        this.wsUrl = this.getWebSocketUrl();
    }

    private getWebSocketUrl(): string {
        // In development, use localhost
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;

            if (host === 'localhost' || host === '127.0.0.1') {
                return `${protocol}//${host}:8787/ws`;
            } else {
                // In production, use your deployed Cloudflare Worker URL
                // Update this with your actual worker subdomain
                return `wss://bijukaru-sync-worker.durand.workers.dev/ws`;
            }
        }
        return 'ws://localhost:8787/ws';
    }

    async initializeSync(deviceToken: string): Promise<boolean> {
        try {
            if (this.isConnected && this.currentToken === deviceToken) {
                return true; // Already connected with this token
            }

            // Disconnect existing connection if any
            await this.disconnect();

            this.currentToken = deviceToken;
            this.reconnectAttempts = 0;

            // Create WebSocket connection
            const wsUrl = `${this.wsUrl}?token=${encodeURIComponent(deviceToken)}`;
            this.ws = new WebSocket(wsUrl);

            return new Promise((resolve) => {
                if (!this.ws) {
                    resolve(false);
                    return;
                }

                const connectTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        console.warn('WebSocket connection timeout');
                        resolve(false);
                    }
                }, 10000);

                this.ws.onopen = () => {
                    console.log('Sync connection opened');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    clearTimeout(connectTimeout);
                    resolve(true);
                };

                this.ws.onclose = (event) => {
                    console.log('Sync connection closed:', event.code, event.reason);
                    this.isConnected = false;
                    clearTimeout(connectTimeout);
                    this.scheduleReconnect();
                    if (!this.isConnected) {
                        resolve(false);
                    }
                };

                this.ws.onerror = (error: Event) => {
                    console.error('Sync connection error:', error);
                    this.isConnected = false;
                    clearTimeout(connectTimeout);
                    resolve(false);
                };

                this.ws.onmessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data) as SyncedData;
                        this.handleSyncMessage(data);
                    } catch (error) {
                        console.error('Error parsing sync message:', error);
                    }
                };
            });
        } catch (error) {
            console.error('Failed to initialize sync:', error);
            this.isConnected = false;
            return false;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached, giving up');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        this.reconnectAttempts++;

        this.reconnectTimeout = window.setTimeout(() => {
            if (this.currentToken && !this.isConnected) {
                console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.initializeSync(this.currentToken);
            }
        }, delay);
    }

    private handleSyncMessage(data: SyncedData): void {
        // Merge received data with local data
        this.localData = data;
        this.notifySyncListeners();
    }

    async disconnect(): Promise<void> {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.currentToken = null;
        this.reconnectAttempts = 0;
    }

    isConnectedToSync(): boolean {
        return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    addSyncListener(listener: () => void): void {
        this.syncListeners.push(listener);
    }

    removeSyncListener(listener: () => void): void {
        const index = this.syncListeners.indexOf(listener);
        if (index > -1) {
            this.syncListeners.splice(index, 1);
        }
    }

    private notifySyncListeners(): void {
        this.syncListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in sync listener:', error);
            }
        });
    }

    updateFavourites(favourites: Map<string, Set<string>>): void {
        try {
            // Convert Map to object
            const favouritesObj: Record<string, string[]> = {};
            favourites.forEach((categoryIds, mediaSource) => {
                favouritesObj[mediaSource] = Array.from(categoryIds);
            });

            this.localData.favourites = favouritesObj;
            this.sendToServer({ favourites: favouritesObj, likedImages: this.localData.likedImages });
        } catch (error) {
            console.error('Error updating favourites:', error);
        }
    }

    updateLikedImages(likedImages: any[]): void {
        try {
            this.localData.likedImages = likedImages;
            this.sendToServer({ favourites: this.localData.favourites, likedImages });
        } catch (error) {
            console.error('Error updating liked images:', error);
        }
    }

    private sendToServer(data: SyncedData): void {
        if (this.ws && this.isConnectedToSync()) {
            try {
                this.ws.send(JSON.stringify(data));
            } catch (error) {
                console.error('Error sending data to server:', error);
            }
        } else {
            console.warn('Cannot send data: WebSocket not connected');
        }
    }

    getFavourites(): Map<string, Set<string>> {
        try {
            const favourites = new Map<string, Set<string>>();

            Object.entries(this.localData.favourites).forEach(([mediaSource, categoryIds]) => {
                favourites.set(mediaSource, new Set(categoryIds));
            });

            return favourites;
        } catch (error) {
            console.error('Error getting favourites:', error);
            return new Map();
        }
    }

    getLikedImages(): any[] {
        try {
            return this.localData.likedImages || [];
        } catch (error) {
            console.error('Error getting liked images:', error);
            return [];
        }
    }

    // Force sync with server
    async forceSync(): Promise<void> {
        if (this.ws && this.isConnectedToSync()) {
            try {
                // Send current local data to force sync
                this.sendToServer(this.localData);
            } catch (error) {
                console.error('Error forcing sync:', error);
            }
        }
    }

    // Get sync statistics
    getSyncStats() {
        return {
            isConnected: this.isConnectedToSync(),
            currentToken: this.currentToken,
            favouritesCount: Object.keys(this.localData.favourites).length,
            likedImagesCount: this.localData.likedImages.length,
            reconnectAttempts: this.reconnectAttempts,
            wsUrl: this.wsUrl
        };
    }

    // Reset reconnection attempts (useful for manual reconnect)
    resetReconnection(): void {
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

// Create singleton instance
export const syncService = new SyncService();