import { getGalleryState } from '$lib/components/GalleryState.svelte';
// Update document title with current image
export function updateDocumentTitle() {
    const ctx = getGalleryState();

    const sourceInfo = ctx.mediaSources.find(s => s.id === ctx.selectedMediaSource);
    const sourceName = sourceInfo ? sourceInfo.name : 'Unknown Source';

    if (ctx.items[ctx.currentIndex]) {
        document.title = `${ctx.items[ctx.currentIndex].title} - ${getCurrentCategoryName()} - ${sourceName} - Bijukaru picture carousel`;
    } else {
        document.title = "Bijukaru - Picture carousel";
    }
}

// Update URL with current parameters
export function updateURL() {
    const ctx = getGalleryState();
    const currentItem = ctx.items[ctx.currentIndex];

    const url = new URL(window.location.href);

    // Set current image ID if available
    if (currentItem && currentItem.id) {
        url.searchParams.set('image_id', currentItem.id);
    } else {
        url.searchParams.delete('image_id');
    }

    // Set category if selected
    if (ctx.selectedCategory) {
        url.searchParams.set('category', ctx.selectedCategory);
    } else {
        url.searchParams.delete('category');
    }

    // Preserve interval parameter if it's not default
    if (ctx.slideInterval !== 10000) {
        // Convert number to string for URL params
        url.searchParams.set('interval', String(ctx.originalInterval / 1000 || ctx.slideInterval / 1000));
    } else if (url.searchParams.has('interval')) {
        url.searchParams.delete('interval');
    }

    // Add paused parameter if paused
    if (ctx.isPaused) {
        url.searchParams.set('paused', 'true');
    } else if (url.searchParams.has('paused')) {
        url.searchParams.delete('paused');
    }

    // Add HD parameter if enabled
    if (ctx.isHD) {
        url.searchParams.set('hd', 'true');
    } else if (url.searchParams.has('hd')) {
        url.searchParams.delete('hd');
    }

    // Preserve prefetch parameter if it's not default
    if (ctx.nToPrefetch !== 2) {
        // Convert number to string for URL params
        url.searchParams.set('prefetch', String(ctx.nToPrefetch));
    } else if (url.searchParams.has('prefetch')) {
        url.searchParams.delete('prefetch');
    }

    // Preserve fullscreen parameter if toolbar is hidden
    if (ctx.hideToolbar) {
        url.searchParams.set('fullscreen', 'true');
    } else if (url.searchParams.has('fullscreen')) {
        url.searchParams.delete('fullscreen');
    }

    // Preserve showDescription parameter
    if (ctx.showDescription) {
        url.searchParams.set('showDescription', 'true');
    } else if (url.searchParams.has('showDescription')) {
        url.searchParams.delete('showDescription');
    }

    // Update URL without reloading the page
    window.history.pushState({}, '', url);
}

// Get previous category name for navigation
export function getPrevCategoryName() {
    const ctx = getGalleryState();

    if (ctx.categories.length === 0) return "";
    const prevIndex = (ctx.categoryIndex - 1 + ctx.categories.length) % ctx.categories.length;
    return ctx.categories[prevIndex]?.name || "";
}

// Get next category name
export function getNextCategoryName() {
    const ctx = getGalleryState();

    if (ctx.categories.length === 0) return "";
    const nextIndex = (ctx.categoryIndex + 1) % ctx.categories.length;
    return ctx.categories[nextIndex]?.name || "";
}

// Get current category name
export function getCurrentCategoryName() {
    const ctx = getGalleryState();

    // Check if we have a direct category reference
    if (typeof ctx.category !== 'undefined' && ctx.category) {
        return ctx.category.name;
    }
    if (!ctx.selectedCategory || ctx.categories.length === 0) return '';

    const foundCategory = ctx.categories.find(c => c.id === ctx.selectedCategory);
    return foundCategory ? foundCategory.name : '';
}

export async function init() {
    const ctx = getGalleryState();

    // Apply dark mode on page load
    applyTheme();

    // Track mouse position
    ctx.mouseX = 0;
    ctx.mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        ctx.mouseX = e.clientX;
        ctx.mouseY = e.clientY;
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(btn => {
            btn.classList.add('visible');
        });
        resetInactivityTimer();
    });

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check for message parameter
    const message = urlParams.get('message');
    if (message) {
        // Display the message overlay
        showUrlMessage(decodeURIComponent(message));

        // Remove the message parameter from the URL without reloading
        urlParams.delete('message');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
    }

    // Fetch media sources
    await loadMediaSources();

    // Fetch categories first
    await loadCategories();

    // Check for category parameter
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        ctx.selectedCategory = categoryParam;
        // Find the index of this category
        ctx.categoryIndex = Math.max(0, ctx.categories.findIndex(c => c.id === categoryParam));
    } else if (ctx.categories.length > 0 && ctx.categories[0].id) {
        // If no category in URL but we have categories, use the first one
        ctx.selectedCategory = ctx.categories[0].id;
        ctx.categoryIndex = 0;
        // Update URL to include the category
        const url = new URL(window.location.href);
        url.searchParams.set('category', ctx.selectedCategory);
        window.history.replaceState({}, '', url);
    }

    // Check for image_id parameter (will be used after loading items)
    ctx.targetImageId = urlParams.get('image_id');

    // Check for interval parameter
    const intervalParam = urlParams.get('interval');
    if (intervalParam && !isNaN(Number(intervalParam))) {
        // Allow interval of 0 to disable auto-sliding
        const parsedInterval = parseInt(intervalParam);
        ctx.slideInterval = parsedInterval > 0 ? parsedInterval * 1000 : 0;
        ctx.originalInterval = ctx.slideInterval;
    }

    // Check for paused parameter
    const pausedParam = urlParams.get('paused');
    if (pausedParam === 'true' || pausedParam === '1') {
        ctx.isPaused = true;
        ctx.originalInterval = ctx.slideInterval;
        ctx.slideInterval = 0;
    }

    // Check for HD parameter
    const hdParam = urlParams.get('hd');
    if (hdParam === 'true' || hdParam === '1') {
        ctx.isHD = true;
    }

    // Check for prefetch parameter
    const prefetchParam = urlParams.get('prefetch');
    if (prefetchParam && !isNaN(Number(prefetchParam))) {
        // Set the number of images to prefetch, with a reasonable limit
        ctx.nToPrefetch = Math.min(10, Math.max(0, parseInt(prefetchParam)));
    }

    // Check for fullscreen parameter and set toolbar visibility if requested
    const fullscreenParam = urlParams.get('fullscreen');
    if (fullscreenParam === 'true' || fullscreenParam === '1') {
        // Simply hide the toolbar without using native fullscreen
        ctx.hideToolbar = true;
    }

    // Check for showDescription parameter
    const showDescParam = urlParams.get('showDescription');
    if (showDescParam === 'true' || showDescParam === '1') {
        ctx.showDescription = true;
    }

    // Add keyboard event listeners
    document.addEventListener('keydown', (e) => {
        // If search overlay is open, only process Escape key and ignore all other shortcuts
        if (ctx.showSearchOverlay) {
            if (e.key === 'Escape') {
                closeSearchOverlay();
            }
            return;
        }

        // Process normal shortcuts when search is closed
        if (e.key === 'Escape' && ctx.isFullscreen) {
            exitFullscreen();
        } else if (e.key === 'ArrowLeft') {
            prevItem();
        } else if (e.key === 'ArrowRight') {
            nextItem();
        } else if (e.key === 'ArrowUp') {
            prevCategory();
        } else if (e.key === 'ArrowDown') {
            nextCategory();
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        } else if (e.key === 'Enter' && ctx.currentItem?.link) {
            // Open the current image's link in a new tab
            window.open(ctx.currentItem.link, '_blank');
        } else if (e.key === 'PageUp') {
            // Navigate to previous media source
            prevMediaSource();
        } else if (e.key === 'PageDown') {
            // Navigate to next media source
            nextMediaSource();
        } else if (e.key === 'h' || e.key === 'H') {
            // Toggle help overlay
            ctx.showHelp = !ctx.showHelp;
        } else if (e.key === 'd' || e.key === 'D') {
            // Toggle description overlay
            ctx.showDescription = !ctx.showDescription;
            console.log('Description visibility toggled:', ctx.showDescription);

            // Update URL when description is toggled
            const url = new URL(window.location.href);
            if (ctx.showDescription) {
                url.searchParams.set('showDescription', 'true');
            } else {
                url.searchParams.delete('showDescription');
            }
            window.history.pushState({}, '', url);
        } else if (e.key === 'p' || e.key === 'P') {
            // Toggle pause/resume with 'p' key
            togglePause();
        } else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
            // Open search overlay with '/' key, ignore if inside input
            if (document.activeElement &&
                document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault(); // Prevent typing '/' in other inputs
                // Only open search if authorized
                if (ctx.isSearchAuthorized) {
                    openSearchOverlay();
                }
            }
        }

        // Any key press resets inactivity timer
        resetInactivityTimer();
    });
    const imageContainer = document.querySelector('.gallery-image');

    // Add touch event for mobile
    if (imageContainer) {
        imageContainer.addEventListener('touchstart', () => {
            // Don't show media source overlay on mobile
            if (ctx.mediaSourceOverlayTimeoutId) {
                clearTimeout(ctx.mediaSourceOverlayTimeoutId);
            }
            if (ctx.mediaSourceOverlayTransitionId) {
                clearTimeout(ctx.mediaSourceOverlayTransitionId);
            }
            ctx.showMediaSourceOverlay = false;

            showControls();
            resetInactivityTimer();
        });

        // Track clicks
        imageContainer.addEventListener('click', () => {
            resetInactivityTimer();
        });

        // Add mouse events for desktop
        imageContainer.addEventListener('mouseenter', () => {
            showControls();
        });

        imageContainer.addEventListener('mouseleave', (e) => {
            // Check if we're moving to a navigation button
            // Get the element the mouse is moving to
            const evt = e as unknown as MouseEvent;
            const relatedTarget = evt.relatedTarget as Element;
            if (relatedTarget &&
                (relatedTarget.classList.contains('category-nav-button') ||
                    relatedTarget.closest('.category-nav-button'))) {
                // Moving to another navigation button, don't hide
                return;
            }
            // Hide after delay
            setTimeout(hideControls, 1000);
        });

        // Add touch events for pausing slideshow while touching the image
        imageContainer.addEventListener('touchstart', () => {
            // Save current state before pausing
            if (!ctx.isPaused) {
                ctx.wasPlayingBeforeTouch = true;
                togglePause();
            }
        });

        imageContainer.addEventListener('touchend', () => {
            // Resume only if it was playing before touch
            if (ctx.wasPlayingBeforeTouch) {
                ctx.wasPlayingBeforeTouch = false;
                togglePause();
            }
        });
    }

    // Add event listeners to category buttons
    document.querySelectorAll('.category-nav-button').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            showControls();
        });

        btn.addEventListener('mouseleave', (e) => {
            // Only hide if not moving to another control
            const evt = e as unknown as MouseEvent;
            const relatedTarget = evt.relatedTarget as Element;
            if (relatedTarget &&
                (relatedTarget.classList.contains('category-nav-button') ||
                    relatedTarget.classList.contains('nav-button') ||
                    relatedTarget.closest('.nav-button') ||
                    relatedTarget.closest('.category-nav-button'))) {
                // Moving to another control, don't hide
                return;
            }
            setTimeout(hideControls, 1000);
        });
    });

    // Load initial feed
    await loadCategory();

    // Check for search token in URL
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
        verifyAndStoreToken(tokenParam);
    } else {
        // Check if token exists in localStorage
        const storedToken = localStorage.getItem('searchToken');
        if (storedToken) {
            ctx.searchToken = storedToken;
            verifyToken(false); // Verify silently
        }
    }
}

async function loadCategories() {
    const ctx = getGalleryState();

    try {
        const response = await fetch(`/api/${ctx.selectedMediaSource}/categories`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        ctx.categories = await response.json();
    } catch (err) {
        console.error('Error loading categories:', err);
        // Fallback to default categories if API fails
        ctx.categories = [
            { id: "", name: "All Posts" },
        ];
    }
}

// Navigate to previous category
function prevCategory() {
    const ctx = getGalleryState();

    if (ctx.categories.length === 0) return;

    ctx.categoryIndex = (ctx.categoryIndex - 1 + ctx.categories.length) % ctx.categories.length;
    ctx.selectedCategory = ctx.categories[ctx.categoryIndex].id;
    loadCategory();
}

// Navigate to next category
function nextCategory() {
    const ctx = getGalleryState();

    if (ctx.categories.length === 0) return;

    ctx.categoryIndex = (ctx.categoryIndex + 1) % ctx.categories.length;
    ctx.selectedCategory = ctx.categories[ctx.categoryIndex].id;
    loadCategory();
}

async function loadCategory() {
    const ctx = getGalleryState();

    ctx.loading = true;
    ctx.error = null;

    // Use stopAutoSlide from the module namespace, not from ctx
    stopAutoSlide();

    ctx.prefetchedImages.clear(); // Clear prefetched images tracking

    // Explicitly reset progress bar
    if (ctx.progressBar) {
        ctx.progressBar.style.width = '0%';
    }

    try {
        // Construct URL with category parameter if selected
        let apiUrl = `/api/${ctx.selectedMediaSource}/feed`;
        if (ctx.selectedCategory) {
            apiUrl += `?category=${ctx.selectedCategory}`;
        }

        // Add HD parameter if enabled
        if (ctx.isHD) {
            apiUrl += (apiUrl.includes('?') ? '&' : '?') + 'hd=true';
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch RSS feed');
        }

        const feed = await response.json();
        ctx.items = feed.items;
        ctx.category = feed.category;

        // Log information about item descriptions
        if (!["apod", "reddit"].includes(ctx.selectedMediaSource)) {
            // Shuffle the items array
            shuffleArray(ctx.items);
        }

        // Default to first image
        ctx.currentIndex = 0;

        // If we have a target image ID, find and use it
        if (ctx.targetImageId && ctx.items.length > 0) {
            const targetIndex = ctx.items.findIndex(item => item.id === ctx.targetImageId);
            if (targetIndex !== -1) {
                ctx.currentIndex = targetIndex;
            }
            // Clear the target ID so we don't try to use it again
            ctx.targetImageId = null;
        }

        if (ctx.items.length === 0) {
            ctx.error = 'No images found in the feed';
        } else {
            // Show temporary category overlay
            showTemporaryMediaSourceOverlay();
            // Update document title with initial image
            updateDocumentTitle();
            // Update URL with initial image ID
            updateURL();
            // Prefetch next images
            prefetchNextImages();
            // Start auto-slideshow
            startAutoSlide();
        }
    } catch (err) {
        console.error('Error:', err);
        ctx.error = 'Failed to load gallery. Please try again later.';
    } finally {
        ctx.loading = false;
    }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function toggleDarkMode() {
    const ctx = getGalleryState();
    ctx.darkMode = !ctx.darkMode;
    applyTheme(false);

    // Save preference to localStorage
    localStorage.setItem('darkMode', String(ctx.darkMode));
}

function applyTheme(checkSaved = true) {
    const ctx = getGalleryState();
    // Check if there's a saved preference (only if not called from toggleDarkMode)
    if (checkSaved) {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            ctx.darkMode = savedTheme === 'true';
        }
    }

    // Apply appropriate class to html element
    if (ctx.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function startAutoSlide() {
    const ctx = getGalleryState();
    // Don't start auto-slide if interval is 0
    if (ctx.slideInterval === 0) {
        return;
    }

    ctx.autoSlideIntervalId = setInterval(() => {
        nextItem();
    }, ctx.slideInterval);

    // Reset and start progress bar animation
    animateProgressBar();
}

function stopAutoSlide() {
    const ctx = getGalleryState();
    if (ctx.autoSlideIntervalId) {
        clearInterval(ctx.autoSlideIntervalId);
    }
    // Reset progress bar animation if exists
    if (ctx.progressBar) {
        ctx.progressBar.style.width = '0%';
        if (ctx.progressAnimation) {
            cancelAnimationFrame(ctx.progressAnimation);
        }
    }
}

function nextItem() {
    const ctx = getGalleryState();

    ctx.direction = 'next';
    ctx.currentIndex = (ctx.currentIndex + 1) % ctx.items.length;
    // Hide category navigation buttons
    const categoryButtons = document.querySelectorAll('.category-nav-button');
    categoryButtons.forEach(btn => {
        btn.classList.remove('visible');
    });
    // Hide media source overlay
    ctx.showMediaSourceOverlay = false;
    // Update document title
    updateDocumentTitle();
    // Update URL with current image ID
    updateURL();
    // Prefetch next images after changing the current image
    prefetchNextImages();
    // Reset progress bar
    if (ctx.progressBar) {
        animateProgressBar();
    }
    // Reset autoslide timer
    stopAutoSlide();
    startAutoSlide();
}

function prevItem() {
    const ctx = getGalleryState();

    // Reset autoslide timer
    stopAutoSlide();
    ctx.direction = 'prev';
    ctx.currentIndex = (ctx.currentIndex - 1 + ctx.items.length) % ctx.items.length;
    // Hide category navigation buttons
    const categoryButtons = document.querySelectorAll('.category-nav-button');
    categoryButtons.forEach(btn => {
        btn.classList.remove('visible');
    });
    // Hide media source overlay
    ctx.showMediaSourceOverlay = false;
    // Update document title
    updateDocumentTitle();
    // Update URL with current image ID
    updateURL();
    // Prefetch next images after changing the current image
    prefetchNextImages();
    // Restart immediately
    startAutoSlide();
}

function animateProgressBar() {
    const ctx = getGalleryState();
    // Reset progress bar
    if (ctx.progressBar) {
        ctx.progressBar.style.width = '0%';

        // If interval is 0, don't animate
        if (ctx.slideInterval === 0) {
            return;
        }

        // Cancel any existing animation
        if (ctx.progressAnimation) {
            cancelAnimationFrame(ctx.progressAnimation);
        }

        const startTime = performance.now();
        const duration = ctx.slideInterval; // Match the interval timing

        // Animation function
        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration * 100, 100);
            ctx.progressBar.style.width = `${progress}%`;

            if (elapsedTime < duration) {
                ctx.progressAnimation = requestAnimationFrame(animate);
            }
        };

        ctx.progressAnimation = requestAnimationFrame(animate);
    }
}

function prefetchNextImages() {
    const ctx = getGalleryState();
    // Clear any existing debounce timer
    if (ctx.prefetchDebounceTimerId) {
        clearTimeout(ctx.prefetchDebounceTimerId);
    }

    // Set a new debounce timer
    ctx.prefetchDebounceTimerId = setTimeout(() => {
        if (!ctx.items.length) return;

        // Prefetch the next images
        for (let i = 1; i <= ctx.nToPrefetch; i++) {
            const nextIndex = (ctx.currentIndex + i) % ctx.items.length;
            const nextItem = ctx.items[nextIndex];

            // Only prefetch if it has an image URL and hasn't been prefetched yet
            if (nextItem && nextItem.image_url && !ctx.prefetchedImages.has(nextItem.image_url)) {
                // Create a new image object to prefetch
                const img = new Image();
                img.src = nextItem.image_url;

                // Add to prefetched set
                ctx.prefetchedImages.add(nextItem.image_url);

                console.log('Prefetched image:', nextItem.image_url);
            }
        }
    }, ctx.prefetchDebounceDelay);
}

function handleImageError(event: Event) {
    // Replace broken images with a placeholder
    (event.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Available';
}

function toggleFullscreen() {
    const ctx = getGalleryState();
    // When user clicks button or presses F, use native browser fullscreen
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().then(() => {
            ctx.isFullscreen = true;
            // Also hide toolbar when entering fullscreen
            ctx.hideToolbar = true;
        }).catch(err => {
            console.error('Failed to enter fullscreen mode:', err);
            // Fallback to hiding toolbar if native fullscreen fails
            ctx.hideToolbar = true;
        });
    } else {
        exitFullscreen();
    }

    // Update URL to reflect toolbar visibility
    updateFullscreenURL();
}

function exitFullscreen() {
    const ctx = getGalleryState();
    // If we're in native fullscreen mode
    if (document.fullscreenElement && document.exitFullscreen) {
        try {
            document.exitFullscreen().then(() => {
                ctx.isFullscreen = false;
            }).catch(err => {
                console.error('Failed to exit fullscreen mode:', err);
                ctx.isFullscreen = false;
            });
        } catch (err) {
            console.error('Error exiting fullscreen:', err);
            ctx.isFullscreen = false;
        }
    }

    // Also exit toolbar-hiding mode
    ctx.hideToolbar = false;

    // Update URL
    updateFullscreenURL();
}

function updateFullscreenURL() {
    // Update all URL parameters
    updateURL();
}

function showControls() {
    const ctx = getGalleryState();
    const exitBtn = document.querySelector('.exit-fullscreen-btn');
    const navButtons = document.querySelectorAll('.nav-button');

    console.log('showControls called, found buttons:', navButtons.length);

    // Show exit button if in fullscreen
    if (ctx.isFullscreen && exitBtn) {
        exitBtn.classList.add('visible');
    }

    // Show navigation buttons
    navButtons.forEach(btn => {
        btn.classList.add('visible');
    });

    resetInactivityTimer();
}

function hideControls() {
    const ctx = getGalleryState();
    const exitBtn = document.querySelector('.exit-fullscreen-btn');
    const navButtons = document.querySelectorAll('.nav-button');

    // Check if mouse is over any navigation buttons
    const isMouseOverButtons = Array.from(navButtons).some(btn => {
        const rect = btn.getBoundingClientRect();
        const mouseX = ctx.mouseX;
        const mouseY = ctx.mouseY;
        return mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom;
    });

    // Only hide if mouse is not over any buttons
    if (!isMouseOverButtons) {
        if (exitBtn) {
            exitBtn.classList.remove('visible');
        }

        navButtons.forEach(btn => {
            btn.classList.remove('visible');
        });
    }
}

function resetInactivityTimer() {
    const ctx = getGalleryState();
    // Clear any existing timeout
    if (ctx.inactivityTimeoutId) {
        clearTimeout(ctx.inactivityTimeoutId);
    }

    // Set new timeout to hide controls after 1 seconds
    ctx.inactivityTimeoutId = setTimeout(() => {
        hideControls();
    }, 1000);
}

async function loadMediaSources() {
    const ctx = getGalleryState();
    try {
        const response = await fetch('/api/media_sources');
        if (!response.ok) {
            throw new Error('Failed to fetch media sources');
        }
        ctx.mediaSources = await response.json();
    } catch (err) {
        console.error('Error loading media sources:', err);
        // Fallback to default sources if API fails
        ctx.mediaSources = [
            { id: "thisiscolossal", name: "This is Colossal" },
            { id: "apod", name: "Astronomy Picture of the Day" },
            { id: "ukiyo-e", name: "Ukiyo-e" },
            { id: "guardian", name: "Guardian" },
            { id: "reddit", name: "Reddit" },
            { id: "wikiart", name: "WikiArt" }
        ];
    }
}

// Change media source
async function changeMediaSource() {
    const ctx = getGalleryState();
    // Show loading state
    ctx.loading = true;
    ctx.error = null;

    try {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        // Remove image_id and category parameters when changing sources
        urlParams.delete('image_id');
        urlParams.delete('category');
        // Reset category-related variables
        ctx.selectedCategory = "";
        ctx.categoryIndex = 0;
        ctx.targetImageId = null;
        // Check if HD is supported
        const sourceWithHd = ctx.mediaSources.find(source => source.id === ctx.selectedMediaSource);
        ctx.hdSupported = sourceWithHd?.hdSupported !== undefined ? sourceWithHd.hdSupported : false;

        // Preserve interval parameter if it exists
        if (ctx.slideInterval !== 10000) {
            urlParams.set('interval', String(ctx.slideInterval / 1000));
        }

        // Preserve HD parameter if enabled
        if (ctx.isHD) {
            urlParams.set('hd', 'true');
        }

        // Preserve prefetch parameter
        if (ctx.nToPrefetch !== 2) {
            urlParams.set('prefetch', String(ctx.nToPrefetch));
        }

        // Preserve fullscreen parameter if toolbar is hidden
        if (ctx.hideToolbar) {
            urlParams.set('fullscreen', 'true');
        }

        // Preserve showDescription parameter
        if (ctx.showDescription) {
            urlParams.set('showDescription', 'true');
        }

        // Update URL without reloading
        const newUrl = `/${ctx.selectedMediaSource}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);

        // Update document title
        const sourceInfo = ctx.mediaSources.find(s => s.id === ctx.selectedMediaSource);
        if (sourceInfo) {
            document.title = `${sourceInfo.name} - Bijukaru picture carousel`;
        }

        // Load categories for new source
        await loadCategories();

        // Load feed for new source
        await loadCategory();

        // Update URL with current state
        updateURL();
    } catch (err) {
        console.error('Error changing media source:', err);
        ctx.error = 'Failed to change media source. Please try again later.';
    } finally {
        ctx.loading = false;
    }
}

// Show temporary media source overlay
function showTemporaryMediaSourceOverlay() {
    const ctx = getGalleryState();
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        return; // Don't show overlay on mobile
    }

    // Clear any existing timeouts
    if (ctx.mediaSourceOverlayTimeoutId) {
        clearTimeout(ctx.mediaSourceOverlayTimeoutId);
    }
    if (ctx.mediaSourceOverlayTransitionId) {
        clearTimeout(ctx.mediaSourceOverlayTransitionId);
    }

    // Set the media source name with HTML formatting
    const sourceName = ctx.mediaSources.find(source => source.id === ctx.selectedMediaSource)?.name;
    const categoryName = getCurrentCategoryName();
    ctx.mediaSourceOverlayText = `
                        <div class="mb-1 font-bold text-2xl">${sourceName}</div>
                        <div class="opacity-75 text-sm">${categoryName}</div>
                    `;

    // First transition to visible state
    ctx.showMediaSourceOverlay = true;

    // Hide after 2 seconds with a fade-out transition
    ctx.mediaSourceOverlayTimeoutId = setTimeout(() => {
        // Start fade-out transition
        ctx.mediaSourceOverlayTransitionId = setTimeout(() => {
            ctx.showMediaSourceOverlay = false;
        }, 300);
    }, 2000);
}

// Navigate to previous media source
function prevMediaSource() {
    const ctx = getGalleryState();
    if (ctx.mediaSources.length <= 1) return;

    // Find current index
    const currentIndex = ctx.mediaSources.findIndex(source => source.id === ctx.selectedMediaSource);
    // Calculate previous index with wrap-around
    const prevIndex = (currentIndex - 1 + ctx.mediaSources.length) % ctx.mediaSources.length;

    // Set new media source and navigate
    ctx.selectedMediaSource = ctx.mediaSources[prevIndex].id;
    changeMediaSource();
}

// Navigate to next media source
function nextMediaSource() {
    const ctx = getGalleryState();
    if (ctx.mediaSources.length <= 1) return;

    // Find current index
    const currentIndex = ctx.mediaSources.findIndex(source => source.id === ctx.selectedMediaSource);
    // Calculate next index with wrap-around
    const nextIndex = (currentIndex + 1) % ctx.mediaSources.length;

    // Set new media source and navigate
    ctx.selectedMediaSource = ctx.mediaSources[nextIndex].id;
    changeMediaSource();
}

function togglePause() {
    const ctx = getGalleryState();
    ctx.isPaused = !ctx.isPaused;

    if (ctx.isPaused) {
        // Store current interval and pause
        ctx.originalInterval = ctx.slideInterval;
        ctx.slideInterval = 0;
        stopAutoSlide();
    } else {
        // Restore original interval and resume
        ctx.slideInterval = ctx.originalInterval;
        startAutoSlide();
    }

    // Update URL
    updateURL();
}

// Toggle HD images
function toggleHD() {
    const ctx = getGalleryState();
    // Store current image ID before toggling
    const currentImageId = ctx.currentItem?.id;

    ctx.isHD = !ctx.isHD;

    // Reload the feed with HD parameter
    loadCategory().then(() => {
        // After reloading, try to find the same image
        if (currentImageId) {
            const newIndex = ctx.items.findIndex(item => item.id === currentImageId);
            if (newIndex !== -1) {
                ctx.currentIndex = newIndex;
                // Update document title and URL
                updateDocumentTitle();
                updateURL();
            }
        }
    });

    // Update URL
    updateURL();
}

// Refresh random artist category
function refreshRandomArtist() {
    const ctx = getGalleryState();
    if (ctx.selectedCategory === 'random-artist') {
        loadCategory();
    }
}

// Open search overlay
function openSearchOverlay() {
    const ctx = getGalleryState();
    ctx.showSearchOverlay = true;
    ctx.error = null; // Clear previous errors
    ctx.tokenError = null; // Clear token errors

    // For Svelte 5, we no longer use $nextTick or $refs
    setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        const tokenInput = document.getElementById('token-input');
        if (ctx.isSearchAuthorized && searchInput) {
            searchInput.focus();
        } else if (tokenInput) {
            tokenInput.focus();
        }
    }, 0);
}

// Close search overlay
function closeSearchOverlay() {
    const ctx = getGalleryState();
    ctx.showSearchOverlay = false;
    ctx.searchQuery = ""; // Clear query on close
    ctx.error = null; // Clear errors on close
    ctx.tokenError = null; // Clear token errors
}

// Perform search
async function performSearch() {
    const ctx = getGalleryState();
    if (!ctx.isSearchAuthorized) {
        // If not authorized, try to verify token first
        const verified = await verifyToken();
        if (!verified) return;
    }

    if (!ctx.searchQuery.trim()) return;

    ctx.loading = true;
    ctx.error = null;

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(ctx.searchQuery)}&token=${encodeURIComponent(ctx.searchToken)}`);
        const result = await response.json();

        if (response.ok) {
            // Close search overlay immediately
            closeSearchOverlay();

            // Check if we received direct feed results
            if (result.feed && result.source) {
                console.log("Search successful, received direct feed results");

                // Switch to the appropriate media source if needed
                if (result.source !== ctx.selectedMediaSource) {
                    ctx.selectedMediaSource = result.source;
                    await loadCategories();
                }

                // Create a virtual search results category if it doesn't exist
                const searchCategory = { id: "search-results", name: "Search Results" };
                if (!ctx.categories.some(c => c.id === "search-results")) {
                    ctx.categories.push(searchCategory);
                }

                // Switch to search results category
                ctx.selectedCategory = "search-results";
                ctx.categoryIndex = ctx.categories.findIndex(c => c.id === "search-results");

                // Replace the items with search results
                ctx.items = result.feed.items;
                ctx.currentIndex = 0;

                // Show message if provided
                if (result.userfriendly_message) {
                    ctx.overlayMessage = result.userfriendly_message;
                    ctx.showMessageOverlay = true;
                    setTimeout(() => {
                        ctx.showMessageOverlay = false;
                    }, 5000);
                }

                // Update URL for bookmarking
                window.history.pushState({}, '', result.url);

                // Update title and start slideshow
                updateDocumentTitle();
                startAutoSlide();
            }
            // Handle URL-based results (existing functionality)
            else if (result.url) {
                console.log("Search successful, received URL:", result.url);

                // Parse the URL to extract parameters
                const urlObj = new URL(window.location.origin + result.url);
                const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                const searchParams = urlObj.searchParams;

                // Extract media source from the path
                let newMediaSource = pathSegments[0] || ctx.selectedMediaSource;
                const hdParam = searchParams.get('hd') === 'true';
                const categoryParam = searchParams.get('category');
                const imageIdParam = searchParams.get('image_id');

                // Show message if provided
                if (result.userfriendly_message) {
                    ctx.overlayMessage = result.userfriendly_message;
                    ctx.showMessageOverlay = true;
                    setTimeout(() => {
                        ctx.showMessageOverlay = false;
                    }, 5000);
                }

                // Apply search results by updating component state
                let mediaSourceChanged = false;

                // Change media source if needed
                if (newMediaSource !== ctx.selectedMediaSource) {
                    ctx.selectedMediaSource = newMediaSource;
                    mediaSourceChanged = true;

                    // Load categories for the new media source
                    await loadCategories();
                }

                // Update HD settings if specified
                if (hdParam !== undefined) {
                    ctx.isHD = hdParam;
                }

                // Update category if specified
                if (categoryParam) {
                    ctx.selectedCategory = categoryParam;
                    // Find index of this category
                    ctx.categoryIndex = Math.max(0, ctx.categories.findIndex(c => c.id === categoryParam));
                }

                // Set target image ID to jump to after loading
                if (imageIdParam) {
                    ctx.targetImageId = imageIdParam;
                }

                // Load the appropriate content
                await loadCategory();

                // Update the URL without refreshing
                window.history.pushState({}, '', result.url);

                // Update document title
                updateDocumentTitle();
            } else {
                throw new Error('Search returned invalid results');
            }
        } else {
            throw new Error(result.error || 'Search failed');
        }
    } catch (err: any) {
        console.error('Search error:', err);
        ctx.error = err.message || 'An error occurred during the search.';
    } finally {
        ctx.loading = false;
    }
}

// Show URL message
function showUrlMessage(message: string) {
    const ctx = getGalleryState();
    ctx.overlayMessage = message;
    ctx.showMessageOverlay = true;
    setTimeout(() => {
        ctx.showMessageOverlay = false;
    }, 5000);
}

// Verify and store token from URL parameter
async function verifyAndStoreToken(token: string) {
    const ctx = getGalleryState();
    ctx.searchToken = token;
    await verifyToken();

    // If token is correct, store it in localStorage
    if (ctx.isSearchAuthorized) {
        localStorage.setItem('searchToken', token);

        // Remove token from URL without refreshing
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url);

        // Show success message
        ctx.overlayMessage = "Search feature unlocked!";
        ctx.showMessageOverlay = true;
        setTimeout(() => {
            ctx.showMessageOverlay = false;
        }, 3000);
    }
}

// Verify token with the API
async function verifyToken(showError = true) {
    const ctx = getGalleryState();
    if (!ctx.searchToken) {
        if (showError) {
            ctx.tokenError = "Token is required";
        }
        return false;
    }

    try {
        const response = await fetch(`/api/verify_token?token=${encodeURIComponent(ctx.searchToken)}`);
        const result = await response.json();

        if (response.ok && result.authorized) {
            ctx.isSearchAuthorized = true;
            ctx.tokenError = null;
            return true;
        } else {
            ctx.isSearchAuthorized = false;
            if (showError) {
                ctx.tokenError = result.error || "Invalid token";
            }
            return false;
        }
    } catch (err) {
        console.error('Token verification error:', err);
        ctx.isSearchAuthorized = false;
        if (showError) {
            ctx.tokenError = "Failed to verify token";
        }
        return false;
    }
}

// Handle keyboard shortcuts
export function handleKeyDown(e: KeyboardEvent) {
    const ctx = getGalleryState();
    // Skip if modifiers are used
    if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
    }

    // Skip if typing in an input/textarea/select
    if (document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'SELECT')) {
        return;
    }

    if (e.key === 'ArrowRight') {
        nextItem();
    } else if (e.key === 'ArrowLeft') {
        prevItem();
    } else if (e.key === 'ArrowUp') {
        prevCategory();
    } else if (e.key === 'ArrowDown') {
        nextCategory();
    } else if (e.key === ' ') {
        togglePause();
        e.preventDefault();
    } else if (e.key === 'f') {
        toggleFullscreen();
    } else if (e.key === 'Escape' && ctx.isFullscreen) {
        exitFullscreen();
    } else if (e.key === 'h' || e.key === '?') {
        ctx.showHelp = !ctx.showHelp;
    } else if (e.key === '/' && ctx.isSearchAuthorized) {
        openSearchOverlay();
        e.preventDefault();
    } else if (e.key === 'd') {
        toggleDarkMode();
    } else if (e.key === 's' && ctx.selectedMediaSource !== 'random-artist') {
        nextMediaSource();
    } else if (e.key === 'a' && ctx.selectedMediaSource !== 'random-artist') {
        prevMediaSource();
    } else if (e.key === 'r' && ctx.selectedCategory === 'random-artist') {
        refreshRandomArtist();
    } else if (e.key === 'i') {
        ctx.isHD = !ctx.isHD;
        toggleHD();
    }

    // Any key press resets inactivity timer
    resetInactivityTimer();
}

// Export all needed functions excluding handleKeyDown which is already exported
export {
    loadCategories,
    loadCategory,
    prevCategory,
    nextCategory,
    togglePause,
    toggleHD,
    refreshRandomArtist,
    openSearchOverlay,
    closeSearchOverlay,
    performSearch,
    showUrlMessage,
    verifyAndStoreToken,
    verifyToken,
    toggleFullscreen,
    exitFullscreen,
    nextItem,
    prevItem,
    shuffleArray,
    toggleDarkMode,
    applyTheme,
    startAutoSlide,
    stopAutoSlide,
    prefetchNextImages,
    handleImageError,
    updateFullscreenURL,
    showControls,
    hideControls,
    resetInactivityTimer,
    loadMediaSources
};