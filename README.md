# Bijukaru

This is a carousel gallery for art images, supporting multiple media sources including [This is Colossal](https://www.thisiscolossal.com), [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html), [Ukiyo-e.org](https://ukiyo-e.org), and [WikiArt](https://www.wikiart.org). It's suitable for embedding on other websites or in [Obsidian](https://obsidian.md).

## Architecture

Bijukaru consists of two main components:
- **Backend**: A FastAPI application that provides API endpoints for different media sources
- **Frontend**: A Svelte single-page application (SPA) that provides the user interface

## Features

- **Multiple Media Sources**: Switch between different content providers (This is Colossal, Astronomy Picture of the Day, Ukiyo-e.org, Guardian, Reddit, WikiArt)
- **Content Categories**: Filter gallery content by categories (including popular artists for WikiArt)
- **Search Functionality**: Search across all media sources using natural language queries (search is disabled by default, requires authentication token to account for LLM costs)
- **Automatic Slideshow**: Images change automatically with a configurable interval (can be disabled)
- **Visual Progress Bar**: Shows timing between slide transitions
- **Image Prefetching**: Preloads upcoming images for smoother transitions
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Responsive Design**: Works on various screen sizes and devices
- **Image Navigation**: Previous/next controls for manual browsing
- **Category Navigation**: Up/down arrows to switch between categories
- **Keyboard Shortcuts**: Navigation using arrow keys and 'f' for fullscreen
- **Description Display**: Toggle visibility of image descriptions
- **Touch-Friendly Controls**: Optimized for mobile devices
- **Fullscreen Support**: Toggle fullscreen viewing mode
- **URL Parameters**: Configure via URL parameters (media source, category, interval, prefetch, fullscreen)
- **Direct Image Links**: Link to specific images using image ID parameter
- **Image Randomization**: Shuffled display for variety
- **Original Content Links**: Each image links to its original article
- **Error Handling**: Graceful handling of broken images
- **Caching**: Backend caching for improved performance
- **Clean UI**: Minimal interface with image counter and title overlays

## Usage

Visit [https://frames.dldx.org](https://frames.dldx.org) to see the gallery in action.

### URL Parameters

- `category`: Filter by specific category (e.g., `?category=art` or `?category=rene-magritte` for WikiArt artists)
- `image_id`: Display a specific image by ID (e.g., `?image_id=1234abcd`)
- `interval`: Set custom slideshow timing in seconds (e.g., `?interval=5` for 5 seconds, `?interval=0` to disable auto-slideshow)
- `prefetch`: Set number of images to preload (e.g., `?prefetch=5` to prefetch 5 upcoming images)
- `fullscreen`: Start in fullscreen mode (e.g., `?fullscreen=true`)
- `showDescription`: Show image descriptions by default (e.g., `?showDescription=true`)
- `token`: Provide authentication token for search functionality (e.g., `?token=yoursecrettoken`)

### Keyboard Navigation

- **Left/Right Arrow Keys**: Navigate between images
- **Enter Key**: Open original image article in new tab
- **Up/Down Arrow Keys**: Navigate between categories
- **Page Up/Down Keys**: Navigate between media sources
- **F Key**: Toggle fullscreen mode
- **D Key**: Toggle description visibility
- **P Key**: Pause/resume slideshow
- **/ Key**: Open search interface
- **H Key**: Display help with all keyboard shortcuts
- **Escape Key**: Exit fullscreen mode or close search overlay

### Search Functionality

The search feature allows you to find content across all media sources using natural language queries:

1. Authenticate by adding `?token=yoursecrettoken` to the URL once
2. After authentication, the search icon appears in the control bar
3. Click the search icon or press `/` to open the search interface
4. Type queries like "Van Gogh starry night", "show me photos of supernovae", or "analog art"

## Embedding on other websites

To embed the gallery on your website, copy the following code and paste it into the HTML body of your page:

```html
<iframe src="https://frames.dldx.org" width="100%" height="500px"></iframe>
```

For additional customization, you can use URL parameters:

```html
<iframe src="https://frames.dldx.org?category=photography&interval=8&prefetch=3&image_id=1234abcd&fullscreen=true&showDescription=true" width="100%" height="500px"></iframe>
```

To enable search functionality, include the token parameter once:

```html
<iframe src="https://frames.dldx.org?token=yoursecrettoken" width="100%" height="500px"></iframe>
```

You can also specify a particular media source:

```html
<iframe src="https://frames.dldx.org/ukiyo-e?interval=10&fullscreen=true" width="100%" height="500px"></iframe>
```

Or browse WikiArt artists:

```html
<iframe src="https://frames.dldx.org/wikiart?category=edward-hopper" width="100%" height="500px"></iframe>
```

## Embedding in Obsidian

To embed the gallery in Obsidian, install [Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames), add a new frame called "Bijukaru" with the following settings:

**URL**: https://frames.dldx.org

**Additional CSS**:
```css
body {
background-color: rgba(0,0,0, 0) !important;
}
.light-toggle {
display: none !important;
}
```

and copy the following code and paste it into the note where you want the gallery to appear:

```
```custom-frames
frame: Bijukaru
style: background-color: unset; height: 800px;```
```

You can also link to specific images by adding URL parameters to the frame URL:
```
```custom-frames
frame: Bijukaru
url: https://frames.dldx.org?image_id=1234abcd
style: background-color: unset; height: 800px;```
```

Or specify a particular media source:
```
```custom-frames
frame: Bijukaru
url: https://frames.dldx.org/ukiyo-e
style: background-color: unset; height: 800px;```
```

Or browse WikiArt artists:
```
```custom-frames
frame: Bijukaru
url: https://frames.dldx.org/wikiart?category=artist:frida-kahlo
style: background-color: unset; height: 800px;```
```

To enable search in Obsidian, add the token to the URL:
```
```custom-frames
frame: Bijukaru
url: https://frames.dldx.org?token=yoursecrettoken
style: background-color: unset; height: 800px;```
```

## Development

### Prerequisites

- Python 3.7+ for the FastAPI backend
- Node.js 16+ for the Svelte frontend
- [Bun](https://bun.sh/) (recommended) or npm for frontend package management

### Setup

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/yourusername/bijukaru.git
   cd bijukaru
   ```

2. Create a Python virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   bun install  # or npm install
   ```

4. Create a `.env` file in the root directory with required variables:
   ```
   SEARCH_TOKEN=your_secret_token_here
   ```

### Running for Development

1. Start the FastAPI backend (from the root directory):
   ```bash
   python -m uvicorn main:app --reload
   ```

2. In a separate terminal, start the Svelte dev server:
   ```bash
   cd frontend
   bun run dev  # or npm run dev
   ```

3. Open your browser and navigate to http://localhost:5173

### Building for Production

1. Build the Svelte frontend:
   ```bash
   cd frontend
   bun run build:fastapi  # or npm run build:fastapi
   ```

2. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app
   ```

The FastAPI server will serve both the API endpoints and the static Svelte SPA.