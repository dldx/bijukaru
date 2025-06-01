# Bijukaru Gallery with Cross-Device Sync

A beautiful gallery application with real-time cross-device synchronization for favorites and liked images.

## Features

### Core Gallery Features
- Beautiful image slideshow with multiple media sources
- Category-based browsing
- Search and curation functionality
- Fullscreen viewing with keyboard shortcuts
- Responsive design for mobile and desktop

### Cross-Device Sync Features ✨
- **Real-time synchronization** of favorites and liked images
- **8-character device tokens** for easy sharing between devices
- **Automatic conflict resolution** with data merging
- **Offline support** with local storage fallback
- **Instant updates** when changes are made on any device

## How Sync Works

1. **Generate a device token** on your first device (8-character code like `ABC12345`)
2. **Share the token** with your other devices
3. **All devices** with the same token will automatically sync:
   - Favorite categories
   - Liked images
   - Real-time updates

## Quick Start

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Cloudflare Worker Setup
See [SYNC_SETUP.md](SYNC_SETUP.md) for complete deployment instructions.

```bash
cd cloudflare-worker
npm install
npm run deploy
```

## Using the Sync Feature

### 1. Generate a Device Token
On your first device, generate a new 8-character sync token:
- Go to sync settings in the gallery
- Click "Generate New Token"
- Save the token (e.g., `ABC12345`)

### 2. Connect Other Devices
On each additional device:
- Go to sync settings
- Enter the same 8-character token
- Click "Connect"

### 3. Sync Your Data
Once connected, all devices will automatically sync:
- **Favorites**: Star/unstar categories and see changes on all devices
- **Liked Images**: Like/unlike images and see updates everywhere
- **Real-time**: Changes appear instantly on connected devices

## Architecture

### Frontend (SvelteKit)
- **SyncService**: Manages WebSocket connections and data synchronization
- **GalleryState**: Integrates sync with existing favorites and likes functionality
- **Local Storage**: Provides offline backup of sync data

### Backend (Cloudflare Workers + Durable Objects)
- **WebSocket Server**: Handles real-time connections
- **Durable Objects**: Provides stateful storage per device token
- **Data Merging**: Automatically resolves conflicts between devices

### Data Flow
```
Device A → WebSocket → Cloudflare DO → WebSocket → Device B
    ↓                                                   ↓
Local Storage                                    Local Storage
```

## Sync Data Structure

```typescript
interface SyncedData {
    favourites: Record<string, string[]>; // mediaSource -> categoryIds[]
    likedImages: Array<{
        id: string;
        title: string;
        image_url: string;
        link: string;
        // ... other image properties
    }>;
}
```

## API Reference

### Sync Service Methods

```typescript
// Initialize sync with a device token
await syncService.initializeSync("ABC12345");

// Check connection status
const isConnected = syncService.isConnectedToSync();

// Get sync statistics
const stats = syncService.getSyncStats();

// Manually force a sync
await syncService.forceSync();

// Disconnect from sync
await syncService.disconnect();
```

### Gallery State Sync Integration

```typescript
// Generate and connect with new token
const token = await galleryState.generateAndConnectDeviceToken();

// Connect with existing token
const success = await galleryState.connectWithDeviceToken("ABC12345");

// Get sync status
const status = galleryState.getSyncStatus();

// Disconnect
await galleryState.disconnectSync();
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←/→` | Previous/Next image |
| `↑/↓` | Previous/Next category |
| `S` | Toggle favorite for current category |
| `L` | Like/unlike current image |
| `F` | Toggle fullscreen |
| `P` | Pause/resume slideshow |
| `/` | Open search |
| `H` | Show help |

## Configuration

### Environment Variables
- Development WebSocket: `ws://localhost:8787/ws`
- Production WebSocket: Configure in `SyncService.ts`

### Sync Settings
- **Reconnection**: Automatic with exponential backoff
- **Max Reconnect Attempts**: 5 (configurable)
- **Token Length**: 8 characters (alphanumeric)
- **Data Persistence**: Automatic via Durable Objects

## Security

- **Device tokens** provide basic access control
- **Data isolation** per token group
- **No user authentication** required
- **Local storage backup** for offline access

> ⚠️ **Note**: Device tokens are not encrypted. Anyone with a token can access that sync group. For sensitive data, consider adding authentication.

## Costs (Cloudflare Workers)

- **Free tier**: 100,000 requests/day (sufficient for most users)
- **Paid tier**: $5/month for 10M requests
- **Durable Objects**: $0.15/million requests after free tier

## Troubleshooting

### Sync Not Working?
1. Check browser console for WebSocket errors
2. Verify the device token is exactly 8 characters
3. Ensure both devices use the same token
4. Check Cloudflare Worker logs
5. Test WebSocket connection directly:
   ```javascript
   const ws = new WebSocket('wss://your-worker.workers.dev/ws?token=ABC12345');
   ```

### Performance Issues?
- Sync is optimized for small data sets (favorites and likes)
- Large numbers of liked images may affect performance
- Consider periodic cleanup of old data

## Development

### Project Structure
```
frontend/
├── src/lib/sync/SyncService.ts         # WebSocket sync client
├── src/lib/components/GalleryState.svelte.ts  # Gallery state with sync
└── ...

cloudflare-worker/
├── src/index.ts                        # Worker and Durable Object
├── src/types.d.ts                      # TypeScript declarations
├── wrangler.toml                       # Cloudflare configuration
└── ...
```

### Building
```bash
# Frontend
cd frontend && npm run build

# Worker
cd cloudflare-worker && npm run deploy
```

### Testing
```bash
# Local development
cd cloudflare-worker && npm run dev  # Worker on :8787
cd frontend && npm run dev            # Frontend on :5173
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test sync functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Enjoy synchronized browsing across all your devices!** 🎨✨