# This is Colossal gallery widget

This is an unofficial carousel gallery for [This is Colossal](https://www.thisiscolossal.com), suitable for embedding on other websites or in [Obsidian](https://obsidian.md).

## Features

- **Content Categories**: Filter gallery content by categories (Art, Craft, Design, Photography, Animation, etc.)
- **Automatic Slideshow**: Images change automatically with a configurable interval
- **Visual Progress Bar**: Shows timing between slide transitions
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Responsive Design**: Works on various screen sizes and devices
- **Image Navigation**: Previous/next controls for manual browsing
- **Fullscreen Support**: Toggle fullscreen viewing mode
- **URL Parameters**: Configure via URL parameters (category, interval)
- **Image Randomization**: Shuffled display for variety
- **Original Content Links**: Each image links to its original article
- **Error Handling**: Graceful handling of broken images
- **Caching**: Backend caching for improved performance
- **Clean UI**: Minimal interface with image counter and title overlays

## Usage

Visit [https://colossal-gallery.vercel.app](https://colossal-gallery.vercel.app) to see the gallery in action.

### URL Parameters

- `category`: Filter by specific category (e.g., `?category=art`)
- `interval`: Set custom slideshow timing in seconds (e.g., `?interval=5` for 5 seconds)

## Embedding on other websites

To embed the gallery on your website, copy the following code and paste it into the HTML body of your page:

```html
<iframe src="https://colossal-gallery.vercel.app" width="100%" height="500px"></iframe>
```

For additional customization, you can use URL parameters:

```html
<iframe src="https://colossal-gallery.vercel.app?category=photography&interval=8" width="100%" height="500px"></iframe>
```

## Embedding in Obsidian

To embed the gallery in Obsidian, install [Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames), add a new frame called "Colossal" with the following settings:

**URL**: https://colossal-gallery.vercel.app

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
frame: Colossal
style: background-color: unset; height: 800px;```
```



