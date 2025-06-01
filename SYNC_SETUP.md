# Gallery Sync Setup Guide

This guide will help you set up the cross-device synchronization feature using Cloudflare Workers and Durable Objects.

## Overview

The sync system allows users to share favorites and liked images across multiple devices using:
- **Cloudflare Workers** with **Durable Objects** for backend synchronization
- **WebSocket** connections for real-time sync
- **8-character device tokens** for easy sharing between devices
- **Automatic conflict resolution** and data merging

## Prerequisites

1. **Cloudflare Account** (free tier works)
2. **Node.js** v18+ and npm
3. **Wrangler CLI** (Cloudflare's development tool)

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with your Cloudflare account.

## Step 3: Set Up the Worker

### 3.1 Navigate to the Worker Directory

```bash
cd cloudflare-worker
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Update wrangler.toml

Edit `wrangler.toml` and update the worker name if desired:

```toml
name = "gallery-sync-worker"  # Change this to your preferred name
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "GALLERY_SYNC"
class_name = "GallerySyncDO"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["GallerySyncDO"]
```

### 3.4 Test Locally (Optional)

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`

## Step 4: Deploy to Cloudflare

### 4.1 Deploy the Worker

```bash
npm run deploy
```

This will:
- Build and deploy your worker
- Create the Durable Object class
- Provide you with a deployment URL

### 4.2 Note Your Worker URL

After deployment, you'll see output like:
```
Published gallery-sync-worker (1.23s)
  https://gallery-sync-worker.your-subdomain.workers.dev
```

**Important:** Save this URL - you'll need it for the frontend configuration.

## Step 5: Configure Frontend

### 5.1 Update WebSocket URL

Edit `frontend/src/lib/sync/SyncService.ts` and update the production WebSocket URL:

```typescript
private getWebSocketUrl(): string {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;

        if (host === 'localhost' || host === '127.0.0.1') {
            return `${protocol}//${host}:8787/ws`;
        } else {
            // Update this with YOUR deployed worker URL
            return `wss://gallery-sync-worker.your-subdomain.workers.dev/ws`;
            //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            //         Replace with your actual worker URL
        }
    }
    return 'ws://localhost:8787/ws';
}
```

### 5.2 Build and Deploy Frontend

```bash
cd frontend
npm run build
```

## Step 6: Test the Sync Feature

### 6.1 Generate a Device Token

1. Open your gallery app in a browser
2. Navigate to sync settings (if you have a UI for it)
3. Generate a new device token - it will be an 8-character code like `ABC12345`

### 6.2 Connect Another Device

1. Open the gallery app on another device/browser
2. Use the same 8-character token to connect
3. Changes made on one device should sync to the other

### 6.3 Test Sync Features

- **Favorites**: Add/remove favorite categories and verify they sync
- **Liked Images**: Like/unlike images and verify they sync
- **Real-time**: Changes should appear immediately on connected devices

## Step 7: Monitor and Debug

### 7.1 View Worker Logs

In the Cloudflare dashboard:
1. Go to **Workers & Pages**
2. Click on your worker
3. Go to the **Logs** tab for real-time debugging

### 7.2 Check Worker Metrics

Monitor usage and performance in the **Metrics** tab.

### 7.3 Debug WebSocket Connections

In your browser's developer console, you can check sync status:

```javascript
// In browser console
console.log(galleryState.getSyncStatus());
```

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Cloudflare dashboard, go to your worker
2. Click **Settings** → **Triggers**
3. Add a custom domain (requires a domain in Cloudflare)

### 8.2 Update Frontend URL

If using a custom domain, update the WebSocket URL in `SyncService.ts`:

```typescript
return `wss://sync.yourdomain.com/ws`;
```

## Troubleshooting

### Common Issues

#### 1. "WebSocket connection failed"
- Check if worker is deployed correctly
- Verify the WebSocket URL in frontend matches your worker URL
- Ensure your worker supports WebSocket upgrades

#### 2. "Invalid device token"
- Tokens must be exactly 8 characters
- Tokens are case-sensitive
- Generate a new token if needed

#### 3. "Sync not working between devices"
- Check if both devices are using the same token
- Verify WebSocket connections in browser dev tools
- Check worker logs for errors

#### 4. "Data not persisting"
- Durable Objects automatically persist data
- Check if the worker has proper storage permissions
- Verify `saveSyncData()` method is being called

### Testing WebSocket Connection

You can test the WebSocket connection directly:

```javascript
// In browser console
const ws = new WebSocket('wss://your-worker.workers.dev/ws?token=ABC12345');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.onerror = (e) => console.error('Error:', e);
```

## Security Considerations

1. **Device tokens** are not encrypted but provide basic access control
2. **No authentication** - anyone with a token can access that sync group
3. **Rate limiting** - Cloudflare provides basic DDoS protection
4. **Data isolation** - Each token gets its own Durable Object instance

For production use with sensitive data, consider:
- Adding user authentication
- Encrypting device tokens
- Implementing rate limiting
- Adding data validation

## Cost Information

**Cloudflare Workers costs** (as of 2024):
- **Free tier**: 100,000 requests/day
- **Paid tier**: $5/month for 10M requests
- **Durable Objects**: $0.15/million requests after free tier

For typical gallery usage, the free tier should be sufficient for most users.

## API Endpoints

Your deployed worker provides these endpoints:

### WebSocket Connection
```
WSS: wss://your-worker.workers.dev/ws?token=ABC12345
```

### Status Check
```
GET: https://your-worker.workers.dev/status
```

### Token Generation (if implemented)
```
POST: https://your-worker.workers.dev/generate-token
```

## Data Structure

The sync service stores data in this format:

```typescript
interface SyncedData {
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
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Check Cloudflare Worker logs
3. Verify your configuration matches this guide
4. Test with a simple WebSocket connection first

This completes the setup for cross-device gallery synchronization!