# This is Colossal gallery widget

This is an unofficial carousel gallery for [This is Colossal](https://www.thisiscolossal.com), suitable for embedding on other websites or in [Obsidian](https://obsidian.md).

## Usage

Visit [https://colossal-gallery.vercel.app](https://colossal-gallery.vercel.app) to see the gallery in action.

## Embedding on other websites

To embed the gallery on your website, copy the following code and paste it into the HTML body of your page:

```html
<iframe src="https://colossal-gallery.vercel.app" width="100%" height="500px"></iframe>
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



