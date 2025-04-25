# Bijukaru

This is a carousel gallery for art images, supporting multiple media sources including [This is Colossal](https://www.thisiscolossal.com), [Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html), and [Ukiyo-e.org](https://ukiyo-e.org). It's suitable for embedding on other websites or in [Obsidian](https://obsidian.md).

## Features

- **Multiple Media Sources**: Switch between different content providers (This is Colossal, Astronomy Picture of the Day, Ukiyo-e.org)
- **Content Categories**: Filter gallery content by categories
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

Visit [https://bijukaru.vercel.app](https://bijukaru.vercel.app) to see the gallery in action.

### URL Parameters

- `category`: Filter by specific category (e.g., `?category=art`)
- `image_id`: Display a specific image by ID (e.g., `?image_id=1234abcd`)
- `interval`: Set custom slideshow timing in seconds (e.g., `?interval=5` for 5 seconds, `?interval=0` to disable auto-slideshow)
- `prefetch`: Set number of images to preload (e.g., `?prefetch=5` to prefetch 5 upcoming images)
- `fullscreen`: Start in fullscreen mode (e.g., `?fullscreen=true`)
- `showDescription`: Show image descriptions by default (e.g., `?showDescription=true`)

### Keyboard Navigation

- **Left/Right Arrow Keys**: Navigate between images
- **Up/Down Arrow Keys**: Navigate between categories
- **F Key**: Toggle fullscreen mode
- **D Key**: Toggle description visibility
- **Escape Key**: Exit fullscreen mode
- **Enter Key**: Open original article in new tab

## Embedding on other websites

To embed the gallery on your website, copy the following code and paste it into the HTML body of your page:

```html
<iframe src="https://bijukaru.vercel.app" width="100%" height="500px"></iframe>
```

For additional customization, you can use URL parameters:

```html
<iframe src="https://bijukaru.vercel.app?category=photography&interval=8&prefetch=3&image_id=1234abcd&fullscreen=true&showDescription=true" width="100%" height="500px"></iframe>
```

You can also specify a particular media source:

```html
<iframe src="https://bijukaru.vercel.app/ukiyo-e?interval=10&fullscreen=true" width="100%" height="500px"></iframe>
```

## Embedding in Obsidian

To embed the gallery in Obsidian, install [Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames), add a new frame called "Bijukaru" with the following settings:

**URL**: https://bijukaru.vercel.app

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
url: https://bijukaru.vercel.app?image_id=1234abcd
style: background-color: unset; height: 800px;```
```

Or specify a particular media source:
```
```custom-frames
frame: Bijukaru
url: https://bijukaru.vercel.app/ukiyo-e
style: background-color: unset; height: 800px;```
```



