import { getContext, setContext } from "svelte";
import { pushState, replaceState } from "$app/navigation";

// Define types
interface ImageItem {
    id: string;
    title: string;
    image_url: string;
    link: string;
    description?: string;
    sourceCategory?: string; // Display string like "Source Name - Category Name"
    artist_name?: string;
    media_source?: string;   // This should be the media source ID
    category_id?: string;    // Actual category ID for this item
}

interface MediaSource {
    id: string;
    name: string;
    hdSupported?: boolean;
}

interface Category {
    id: string;
    name: string;
}

interface ArchivedCuratedFeed {
    id: string; // ID of the curated feed (e.g., from result.category.id)
    name: string; // Name/title of the curated feed (e.g., from result.category.name)
    originalQuery: string; // The user's query that generated this feed
    items: ImageItem[]; // The actual items (images) in the feed
    userfriendly_message?: string; // Optional message to display when loaded
}

// Define the GalleryState interface
interface GalleryState {
    loading: boolean;
    error: string | null;
    items: ImageItem[];
    currentIndex: number;
    autoSlideIntervalId: any;
    slideInterval: number;
    originalInterval: number;
    isPaused: boolean;
    isHD: boolean;
    direction: string;
    darkMode: boolean;
    selectedCategory: string;
    isFullscreen: boolean;
    hideToolbar: boolean;
    exitBtnTimeoutId: any;
    buttonsTimeoutId: any;
    categories: Category[];
    categoryIndex: number;
    inactivityTimeoutId: any;
    prefetchedImages: Set<string>;
    nToPrefetch: number;
    mediaSources: MediaSource[];
    selectedMediaSource: string;
    showHelp: boolean;
    showDescription: boolean;
    targetImageId: string | null;
    prefetchDebounceTimerId: any;
    prefetchDebounceDelay: number;
    wasPlayingBeforeTouch: boolean;
    hdSupported: string | boolean;
    showMediaSourceOverlay: boolean;
    mediaSourceOverlayText: string;
    mediaSourceOverlayTimeoutId: any;
    mediaSourceOverlayTransitionId: any;
    mouseX: number;
    mouseY: number;
    isMobile: boolean;
    searchQuery: string;
    showSearchOverlay: boolean;
    overlayMessage: string;
    showMessageOverlay: boolean;
    overlayTimeoutId: any;
    searchToken: string;
    isSearchAuthorized: boolean;
    tokenError: string | null;
    progressBar: HTMLElement | null;
    progressAnimation: number | null;
    controlsTimeoutId: any;
    progressIntervalId: any;
    category?: Category;
    currentItem?: ImageItem | null;
    currentSourceName: string;
    currentCategoryName: string;
    favourites: Map<string, Set<string>>;
    showFavourites: boolean;
    likedImages: ImageItem[];
    showLikedImages: boolean;
    // Add method signatures
    updateDocumentTitle: () => void;
    updateURL: () => void;
    getPrevCategoryName: () => string;
    getNextCategoryName: () => string;
    getCurrentCategoryName: () => string;
    prevCategory: () => void;
    nextCategory: () => void;
    nextItem: () => void;
    prevItem: () => void;
    startAutoSlide: () => void;
    stopAutoSlide: () => void;
    animateProgressBar: () => void;
    togglePause: () => void;
    toggleFullscreen: () => void;
    exitFullscreen: () => void;
    prefetchNextImages: () => void;
    toggleDarkMode: () => void;
    applyTheme: (checkSaved?: boolean) => void;
    showControls: () => void;
    hideControls: () => void;
    resetInactivityTimer: () => void;
    loadCategories: () => Promise<void>;
    loadCategory: () => Promise<void>;
    handleKeyDown: (e: KeyboardEvent) => void;
    init: () => Promise<void>;
    showUrlMessage: (message: string) => void;
    loadMediaSources: () => Promise<void>;
    verifyAndStoreToken: (token: string) => Promise<void>;
    verifyToken: (showError?: boolean) => Promise<boolean>;
    openSearchOverlay: () => void;
    closeSearchOverlay: () => void;
    performSearch: () => Promise<void>;
    handleImageError: (event: Event) => void;
    refreshRandomArtist: () => void;
    toggleHD: () => void;
    changeMediaSource: (newSourceId?: string) => void;
    showTemporaryMediaSourceOverlay: () => void;
    shuffleArray: (array: any[]) => any[];
    toggleFavourite: (categoryIdInput?: string, mediaSourceIdInput?: string) => void;
    isFavourite: (categoryIdInput?: string, mediaSourceIdInput?: string) => boolean;
    loadFavourites: () => void;
    saveFavourites: () => void;
    loadFavouritesCategory: () => Promise<void>;
    toggleShowFavourites: () => void;
    loadAllFavourites: () => Promise<void>;
    toggleLikeImage: () => void;
    isImageLiked: () => boolean;
    loadLikedImages: () => void;
    saveLikedImages: () => void;
    loadLikedImagesView: () => Promise<void>;
    toggleShowLikedImages: () => void;
    updateProgressBar: () => void;
    loadArchivedCuratedFeeds: () => void;
    saveArchivedCuratedFeeds: () => void;
    hasFavourites: () => boolean;
    hasLikedImages: () => boolean;
}

export const FAVOURITES_CATEGORY_ID = 'favourites';
export const LIKED_CATEGORY_ID = 'liked';
export const BIJUKARU_CUSTOM_SOURCE_ID = 'bijukaru';
export const DEFAULT_MEDIA_SOURCE_ID = 'thisiscolossal';

export class GalleryStateClass implements GalleryState {
    loading = $state(true);
    error = $state<string | null>(null);
    items = $state<ImageItem[]>([]);
    currentIndex = $state(0);
    autoSlideIntervalId = $state<number | null>(null);
    slideInterval = $state(10000);
    originalInterval = $state(10000);
    isPaused = $state(false);
    isHD = $state(false);
    direction = $state('next');
    darkMode = $state(true);
    selectedCategory = $state("");
    isFullscreen = $state(false);
    hideToolbar = $state(false);
    exitBtnTimeoutId = $state<number | null>(null);
    buttonsTimeoutId = $state<number | null>(null);
    categories = $state<Category[]>([]);
    categoryIndex = $state(0);
    inactivityTimeoutId = $state<number | null>(null);
    prefetchedImages = $state(new Set<string>());
    nToPrefetch = $state(2);
    mediaSources = $state<MediaSource[]>([]);
    selectedMediaSource = $state(DEFAULT_MEDIA_SOURCE_ID);
    showHelp = $state(false);
    showDescription = $state(false);
    targetImageId = $state<string | null>(null);
    prefetchDebounceTimerId = $state<number | null>(null);
    prefetchDebounceDelay = $state(300);
    wasPlayingBeforeTouch = $state(false);
    hdSupported = $state(false);
    showMediaSourceOverlay = $state(false);
    mediaSourceOverlayText = $state("");
    mediaSourceOverlayTimeoutId = $state<number | null>(null);
    mediaSourceOverlayTransitionId = $state<number | null>(null);
    mouseX = $state(0);
    mouseY = $state(0);
    isMobile = $state(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    searchQuery = $state("");
    showSearchOverlay = $state(false);
    overlayMessage = $state("");
    showMessageOverlay = $state(false);
    overlayTimeoutId = $state<number | null>(null);
    searchToken = $state("");
    isSearchAuthorized = $state(false);
    tokenError = $state<string | null>(null);
    progressBar = $state<HTMLElement | null>(null);
    progressAnimation = $state<number | null>(null);
    controlsTimeoutId = $state<number | null>(null);
    progressIntervalId = $state<number | null>(null);
    category = $state<Category | undefined>(undefined);
    favourites = $state<Map<string, Set<string>>>(new Map());
    showFavourites = $state(false);
    likedImages = $state<ImageItem[]>([]);
    showLikedImages = $state(false);

    // State to remember the last selected source/category before viewing custom feeds
    previousSelectedMediaSource = $state<string | null>(null);
    previousSelectedCategory = $state<string | null>(null);

    // State for storing previously generated curated feeds
    archivedCuratedFeeds = $state<ArchivedCuratedFeed[]>([]);

    // Computed property for current item
    get currentItem() {
        return this.items[this.currentIndex] || null;
    }

    get currentCategoryName() {
        // If we're viewing favourites and have a current item with sourceCategory, use that
        if (this.showFavourites && this.currentItem?.sourceCategory) {
            return this.currentItem.sourceCategory;
        }
        if (this.showLikedImages) return 'Liked Images';
        // Handle curated stories - assuming title is stored in a way accessible here
        if (this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID && this.category?.id && ![FAVOURITES_CATEGORY_ID, LIKED_CATEGORY_ID].includes(this.category.id)) {
            return this.category.name || 'Curated Story';
        }
        return this.category ? this.category.name : (this.categories.find(c => c.id === this.selectedCategory)?.name || this.selectedCategory || 'Loading...');
    }

    get currentSourceName() {
        return this.mediaSources.find(s => s.id === this.selectedMediaSource)?.name || 'Unknown Source';
    }

    // Initialize gallery
    init = async () => {
        // Apply dark mode on page load
        this.applyTheme();

        // Load favourites from localStorage
        this.loadFavourites();

        // Load archived curated feeds from localStorage
        this.loadArchivedCuratedFeeds();
        // Ensure categories are up to date if custom source is selected
        if (this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID) {
            await this.loadCategories();
        }

        // Track mouse position
        this.mouseX = 0;
        this.mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            const navButtons = document.querySelectorAll('.nav-button');
            navButtons.forEach(btn => {
                btn.classList.add('visible');
            });
            this.resetInactivityTimer();
        });

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        // Check for message stored in localStorage from search redirect
        const storedMessage = localStorage.getItem('bijukaru_message');
        if (storedMessage) {
            this.showUrlMessage(storedMessage);
            localStorage.removeItem('bijukaru_message'); // Clear after showing
        }

        // Check for message parameter (for direct link sharing)
        const message = urlParams.get('message');
        if (message) {
            // Display the message overlay
            this.showUrlMessage(decodeURIComponent(message));

            // Remove the message parameter from the URL without reloading
            urlParams.delete('message');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            replaceState(newUrl.toString(), {});
        }

        // Fetch media sources
        await this.loadMediaSources();
        // Check for media source parameter
        const mediaSourceParam = urlParams.get('media_source');
        if (mediaSourceParam) {
            this.selectedMediaSource = mediaSourceParam;
        }

        // Fetch categories first
        await this.loadCategories();

        // Check for category parameter
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
            this.selectedCategory = categoryParam;
            // Find the index of this category
            this.categoryIndex = Math.max(0, this.categories.findIndex(c => c.id === categoryParam));
        } else if (this.categories.length > 0 && this.categories[0].id) {
            // If no category in URL but we have categories, use the first one
            this.selectedCategory = this.categories[0].id;
            this.categoryIndex = 0;
            // Update URL to include the category
            const url = new URL(window.location.href);
            url.searchParams.set('category', this.selectedCategory);
            replaceState(url.toString(), {});
        }

        // Check for image_id parameter (will be used after loading items)
        this.targetImageId = urlParams.get('image_id');

        // Check for interval parameter
        const intervalParam = urlParams.get('interval');
        if (intervalParam && !isNaN(Number(intervalParam))) {
            // Allow interval of 0 to disable auto-sliding
            const parsedInterval = parseInt(intervalParam);
            this.slideInterval = parsedInterval > 0 ? parsedInterval * 1000 : 0;
            this.originalInterval = this.slideInterval;
        }

        // Check for paused parameter
        const pausedParam = urlParams.get('paused');
        if (pausedParam === 'true' || pausedParam === '1') {
            this.isPaused = true;
            this.originalInterval = this.slideInterval;
            this.slideInterval = 0;
        }

        // Check for HD parameter
        const hdParam = urlParams.get('hd');
        if (hdParam === 'true' || hdParam === '1') {
            this.isHD = true;
        }

        // Check for prefetch parameter
        const prefetchParam = urlParams.get('prefetch');
        if (prefetchParam && !isNaN(Number(prefetchParam))) {
            // Set the number of images to prefetch, with a reasonable limit
            this.nToPrefetch = Math.min(10, Math.max(0, parseInt(prefetchParam)));
        }

        // Check for fullscreen parameter and set toolbar visibility if requested
        const fullscreenParam = urlParams.get('fullscreen');
        if (fullscreenParam === 'true' || fullscreenParam === '1') {
            // Simply hide the toolbar without using native fullscreen
            this.hideToolbar = true;
        }

        // Check for showDescription parameter
        const showDescParam = urlParams.get('showDescription');
        if (showDescParam === 'true' || showDescParam === '1') {
            this.showDescription = true;
        }

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => {
            // If search overlay is open, only process Escape key and ignore all other shortcuts
            if (this.showSearchOverlay) {
                if (e.key === 'Escape') {
                    this.closeSearchOverlay();
                }
                return;
            }

            // Process normal shortcuts when search is closed
            this.handleKeyDown(e);
        });

        const imageContainer = document.querySelector('.gallery-image');

        // Add touch event for mobile
        if (imageContainer) {
            imageContainer.addEventListener('touchstart', () => {
                // Don't show media source overlay on mobile
                if (this.mediaSourceOverlayTimeoutId) {
                    clearTimeout(this.mediaSourceOverlayTimeoutId);
                }
                if (this.mediaSourceOverlayTransitionId) {
                    clearTimeout(this.mediaSourceOverlayTransitionId);
                }
                this.showMediaSourceOverlay = false;

                this.showControls();
                this.resetInactivityTimer();
            });

            // Track clicks
            imageContainer.addEventListener('click', () => {
                this.resetInactivityTimer();
            });

            // Add mouse events for desktop
            imageContainer.addEventListener('mouseenter', () => {
                this.showControls();
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
                setTimeout(this.hideControls, 1000);
            });

            // Add touch events for pausing slideshow while touching the image
            imageContainer.addEventListener('touchstart', () => {
                // Save current state before pausing
                if (!this.isPaused) {
                    this.wasPlayingBeforeTouch = true;
                    this.togglePause();
                }
            });

            imageContainer.addEventListener('touchend', () => {
                // Resume only if it was playing before touch
                if (this.wasPlayingBeforeTouch) {
                    this.wasPlayingBeforeTouch = false;
                    this.togglePause();
                }
            });
        }

        // Add event listeners to category buttons
        document.querySelectorAll('.category-nav-button').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.showControls();
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
                setTimeout(this.hideControls, 1000);
            });
        });

        // Load initial feed
        await this.loadCategory();

        // Check for search token in URL
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
            this.verifyAndStoreToken(tokenParam);
        } else {
            // Check if token exists in localStorage
            const storedToken = localStorage.getItem('searchToken');
            if (storedToken) {
                this.searchToken = storedToken;
                this.verifyToken(false); // Verify silently
            }
        }

        // Load liked images from localStorage
        this.loadLikedImages();

        // Load archived curated feeds from localStorage
        this.loadArchivedCuratedFeeds();

    }
    handleImageError = (event: Event) => {

        (event.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Available';
    }

    // Update document title with current image
    updateDocumentTitle = () => {
        let title = 'Bijukaru picture carousel';

        // Get media source name
        const sourceInfo = this.mediaSources.find(s => s.id === this.selectedMediaSource);
        if (sourceInfo) {
            title = `${sourceInfo.name} - ${title}`;
        }

        // Add favourites or liked images indicator
        if (this.showFavourites) {
            title = `⭐ Favourites - ${title}`;
        } else if (this.showLikedImages) {
            title = `❤️ Liked Images - ${title}`;
        }
        // Add current image title
        else if (this.currentItem) {
            title = `${this.currentItem.title} - ${title}`;
        }

        document.title = title;
    }

    // Update URL with current parameters
    updateURL = () => {
        try {
            // Update the URL with current state
            const url = new URL(window.location.href);

            // Set media source
            url.searchParams.set('media_source', this.selectedMediaSource);

            // Set category unless we're in favourites view
            if (!this.showFavourites && this.selectedCategory) {
                url.searchParams.set('category', this.selectedCategory);
            } else {
                url.searchParams.delete('category');
            }

            // Set image ID
            if (this.currentItem?.id) {
                url.searchParams.set('image_id', this.currentItem.id);
            } else {
                url.searchParams.delete('image_id');
            }

            // Set interval if different from default
            if (this.slideInterval !== 10000) {
                url.searchParams.set('interval', String(this.slideInterval / 1000));
            } else {
                url.searchParams.delete('interval');
            }

            // Set HD parameter if enabled
            if (this.isHD) {
                url.searchParams.set('hd', 'true');
            } else {
                url.searchParams.delete('hd');
            }

            // Set fullscreen parameter if enabled
            if (this.hideToolbar) {
                url.searchParams.set('fullscreen', 'true');
            } else {
                url.searchParams.delete('fullscreen');
            }

            // Set description visibility
            if (this.showDescription) {
                url.searchParams.set('showDescription', 'true');
            } else {
                url.searchParams.delete('showDescription');
            }

            // Update the browser URL without refreshing
            pushState(url.toString(), {
                mediaSource: this.selectedMediaSource,
                category: this.selectedCategory,
                imageId: this.currentItem?.id
            });
        } catch (e) {
            console.error('Error updating URL:', e);
        }
    }

    // Get previous category name for navigation
    getPrevCategoryName = () => {
        if (this.categories.length === 0) return "";
        const prevIndex = (this.categoryIndex - 1 + this.categories.length) % this.categories.length;
        return this.categories[prevIndex]?.name || "";
    }

    // Get next category name
    getNextCategoryName = () => {
        if (this.categories.length === 0) return "";
        const nextIndex = (this.categoryIndex + 1) % this.categories.length;
        return this.categories[nextIndex]?.name || "";
    }

    // Get current category name
    getCurrentCategoryName = () => {
        // If we're viewing favourites and have a current item with sourceCategory, use that
        if (this.showFavourites && this.currentItem?.sourceCategory) {
            return this.currentItem.sourceCategory;
        }

        // Check if we have a direct category reference
        if (this.category) {
            return this.category.name;
        }
        if (!this.selectedCategory || this.categories.length === 0) return '';

        const foundCategory = this.categories.find(c => c.id === this.selectedCategory);
        return foundCategory ? foundCategory.name : '';
    }

    // Navigate to next item
    nextItem = () => {
        this.direction = 'next';
        this.currentIndex = (this.currentIndex + 1) % this.items.length;

        // Hide category navigation buttons
        const categoryButtons = document.querySelectorAll('.category-nav-button');
        categoryButtons.forEach(btn => {
            btn.classList.remove('visible');
        });

        // Hide media source overlay
        this.showMediaSourceOverlay = false;

        // Update document title
        this.updateDocumentTitle();

        // Update URL with current image ID
        this.updateURL();

        // Prefetch next images after changing the current image
        this.prefetchNextImages();

        // Reset autoslide timer. startAutoSlide will handle the progress bar.
        this.stopAutoSlide();
        this.startAutoSlide();
    }

    // Navigate to previous item
    prevItem = () => {
        // Reset autoslide timer
        this.stopAutoSlide();
        this.direction = 'prev';
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;

        // Hide category navigation buttons
        const categoryButtons = document.querySelectorAll('.category-nav-button');
        categoryButtons.forEach(btn => {
            btn.classList.remove('visible');
        });

        // Hide media source overlay
        this.showMediaSourceOverlay = false;

        // Update document title
        this.updateDocumentTitle();

        // Update URL with current image ID
        this.updateURL();

        // Prefetch next images after changing the current image
        this.prefetchNextImages();

        // Restart immediately
        this.startAutoSlide();
    }

    // Start auto slideshow
    startAutoSlide = () => {
        // Always clear any existing interval before starting a new one.
        // This ensures only one timer is active.
        if (this.autoSlideIntervalId) {
            clearInterval(this.autoSlideIntervalId);
            this.autoSlideIntervalId = null;
        }

        // Do not start if paused or if the interval is 0.
        if (this.isPaused || this.slideInterval === 0) {
            // Ensure progress bar is also stopped/reset if we are not starting.
            if (this.progressBar) {
                this.progressBar.style.width = '0%';
                if (this.progressAnimation) {
                    cancelAnimationFrame(this.progressAnimation);
                    this.progressAnimation = null;
                }
            }
            return;
        }

        this.autoSlideIntervalId = setInterval(() => {
            this.nextItem();
        }, this.slideInterval) as unknown as number;

        // Reset and start progress bar animation.
        this.animateProgressBar();
    }

    // Stop auto slideshow
    stopAutoSlide = () => {
        if (this.autoSlideIntervalId) {
            clearInterval(this.autoSlideIntervalId);
            this.autoSlideIntervalId = null;
        }
        // Reset progress bar animation if exists
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            if (this.progressAnimation) {
                cancelAnimationFrame(this.progressAnimation);
                this.progressAnimation = null;
            }
        }
    }

    // Animate progress bar
    animateProgressBar = () => {
        // Reset progress bar
        if (this.progressBar) {
            this.progressBar.style.width = '0%';

            // If interval is 0, don't animate
            if (this.slideInterval === 0) {
                return;
            }

            // Cancel any existing animation
            if (this.progressAnimation) {
                cancelAnimationFrame(this.progressAnimation);
                this.progressAnimation = null;
            }

            const startTime = performance.now();
            const duration = this.slideInterval; // Match the interval timing

            // Animation function
            const animate = (currentTime: number) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration * 100, 100);
                if (this.progressBar) {
                    this.progressBar.style.width = `${progress}%`;
                }

                if (elapsedTime < duration) {
                    this.progressAnimation = requestAnimationFrame(animate);
                }
            };

            this.progressAnimation = requestAnimationFrame(animate);
        }
    }

    // Toggle pause/resume
    togglePause = () => {
        this.isPaused = !this.isPaused;

        if (this.isPaused) { // PAUSING
            // If slideshow was running (slideInterval > 0), store its interval.
            if (this.slideInterval > 0) {
                this.originalInterval = this.slideInterval;
            }
            this.stopAutoSlide(); // Stop the timer and reset progress bar.
            this.slideInterval = 0; // Reflect that no auto-sliding should happen.
        } else { // UNPAUSING
            // Restore the interval that was active before pausing, or default.
            this.slideInterval = this.originalInterval > 0 ? this.originalInterval : 10000; // Default to 10s
            this.startAutoSlide(); // Start the timer with the restored interval.
        }

        // Update URL
        this.updateURL();
    }

    // Toggle fullscreen
    toggleFullscreen = () => {
        // When user clicks button or presses F, use native browser fullscreen
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                // Also hide toolbar when entering fullscreen
                this.hideToolbar = true;
            }).catch(err => {
                console.error('Failed to enter fullscreen mode:', err);
                // Fallback to hiding toolbar if native fullscreen fails
                this.hideToolbar = true;
            });
        } else {
            this.exitFullscreen();
        }

        // Update URL to reflect toolbar visibility
        this.updateURL();
    }

    // Exit fullscreen
    exitFullscreen = () => {
        // If we're in native fullscreen mode
        if (document.fullscreenElement && document.exitFullscreen) {
            try {
                document.exitFullscreen().then(() => {
                    this.isFullscreen = false;
                }).catch(err => {
                    console.error('Failed to exit fullscreen mode:', err);
                    this.isFullscreen = false;
                });
            } catch (err) {
                console.error('Error exiting fullscreen:', err);
                this.isFullscreen = false;
            }
        }

        // Also exit toolbar-hiding mode
        this.hideToolbar = false;

        // Update URL
        this.updateURL();
    }

    // Prefetch next images
    prefetchNextImages = () => {
        // Clear any existing debounce timer
        if (this.prefetchDebounceTimerId) {
            clearTimeout(this.prefetchDebounceTimerId);
        }

        // Set a new debounce timer
        this.prefetchDebounceTimerId = setTimeout(() => {
            if (!this.items.length) return;

            // Prefetch the next images
            for (let i = 1; i <= this.nToPrefetch; i++) {
                const nextIndex = (this.currentIndex + i) % this.items.length;
                const nextItem = this.items[nextIndex];

                // Only prefetch if it has an image URL and hasn't been prefetched yet
                if (nextItem && nextItem.image_url && !this.prefetchedImages.has(nextItem.image_url)) {
                    // Create a new image object to prefetch
                    const img = new Image();
                    img.src = nextItem.image_url;

                    // Add to prefetched set
                    this.prefetchedImages.add(nextItem.image_url);

                    console.log('Prefetched image:', nextItem.image_url);
                }
            }
        }, this.prefetchDebounceDelay) as unknown as number;
    }

    // Toggle dark mode
    toggleDarkMode = () => {
        this.darkMode = !this.darkMode;
        this.applyTheme(false);

        // Save preference to localStorage
        localStorage.setItem('darkMode', String(this.darkMode));
    }

    // Apply theme based on dark mode state
    applyTheme = (checkSaved = true) => {
        // Check if there's a saved preference (only if not called from toggleDarkMode)
        if (checkSaved) {
            const savedTheme = localStorage.getItem('darkMode');
            if (savedTheme !== null) {
                this.darkMode = savedTheme === 'true';
            }
        }

        // Apply appropriate class to html element
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // Show navigation controls
    showControls = () => {
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        const navButtons = document.querySelectorAll('.nav-button');

        console.log('showControls called, found buttons:', navButtons.length);

        // Show exit button if in fullscreen
        if (this.isFullscreen && exitBtn) {
            exitBtn.classList.add('visible');
        }

        // Show navigation buttons
        navButtons.forEach(btn => {
            btn.classList.add('visible');
        });

        this.resetInactivityTimer();
    }

    // Hide navigation controls
    hideControls = () => {
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        const navButtons = document.querySelectorAll('.nav-button');

        // Check if mouse is over any navigation buttons
        const isMouseOverButtons = Array.from(navButtons).some(btn => {
            const rect = btn.getBoundingClientRect();
            const mouseX = this.mouseX;
            const mouseY = this.mouseY;
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

    // Reset inactivity timer
    resetInactivityTimer = () => {
        // Clear any existing timeout
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
        }

        // Set new timeout to hide controls after 1 seconds
        this.inactivityTimeoutId = setTimeout(() => {
            this.hideControls();
        }, 1000) as unknown as number;
    }

    // Load categories
    loadCategories = async (): Promise<void> => {
        this.error = null;
        this.loading = true;

        try {
            if (this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID) {
                // Build categories for "All Sources"
                const customCategories: Category[] = [
                    { id: FAVOURITES_CATEGORY_ID, name: 'Favourites' },
                    { id: LIKED_CATEGORY_ID, name: 'Liked Images' },
                    // Add archived curated feeds (map to Category for dropdown)
                    ...this.archivedCuratedFeeds.map(feed => ({ id: feed.id, name: feed.name }))
                ];
                this.categories = customCategories;

                // Default to Favourites if no specific custom view is active or set
                if (!this.showFavourites && !this.showLikedImages && (!this.selectedCategory || !customCategories.find(c => c.id === this.selectedCategory))) {
                    this.selectedCategory = FAVOURITES_CATEGORY_ID;
                } else if (this.showFavourites) {
                    this.selectedCategory = FAVOURITES_CATEGORY_ID;
                } else if (this.showLikedImages) {
                    this.selectedCategory = LIKED_CATEGORY_ID;
                }
                // If a curated story was just loaded, selectedCategory would be its ID, which is fine.

                this.categoryIndex = Math.max(0, this.categories.findIndex(c => c.id === this.selectedCategory));
                this.category = this.categories[this.categoryIndex];

            } else {
                // Fetch categories for regular media sources
                const response = await fetch(`/api/${this.selectedMediaSource}/categories`);
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                this.categories = await response.json();
                if (this.categories.length > 0 && (!this.selectedCategory || !this.categories.find(c => c.id === this.selectedCategory))) {
                    this.selectedCategory = this.categories[0].id; // Default to first category for regular sources
                    this.categoryIndex = 0;
                    this.category = this.categories[0];
                }
            }
        } catch (err: any) {
            console.error('Error loading categories:', err);
            this.error = err.message || "Error loading categories";
            this.categories = [{ id: "", name: "Error" }]; // Fallback
        } finally {
            this.loading = false;
        }
    }

    // Load category content
    loadCategory = async () => {
        // Clear error
        this.error = null;

        // Handle custom source selections first
        if (this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID) {
            if (this.selectedCategory === FAVOURITES_CATEGORY_ID) {
                this.showFavourites = true; // Ensure flag is set
                this.showLikedImages = false;
                return this.loadAllFavourites();
            } else if (this.selectedCategory === LIKED_CATEGORY_ID) {
                this.showLikedImages = true; // Ensure flag is set
                this.showFavourites = false;
                return this.loadLikedImagesView();
            } else {
                // If a curated feed, ensure both are unselected
                this.showLikedImages = false;
                this.showFavourites = false;
                // This branch will handle loading specific curated feeds by ID in the future
                // For now, if it's a curated feed that was just loaded by performSearch,
                // items and category are already set. If user re-selects from dropdown,
                // we might need to re-load/re-fetch it.
                // If no items for a curated category, show error or clear.
                if (this.items.length === 0 && this.category?.id === this.selectedCategory) {
                    // This means a curated category is selected but has no items (e.g., reselected from dropdown after navigating away)
                    // Find the feed and try to reload it
                    const feedToReload = this.archivedCuratedFeeds.find(f => f.id === this.selectedCategory);
                    if (feedToReload) {
                        console.log(`Reloading curated feed: ${feedToReload.name}`);
                        return this._loadSpecificCuratedFeed(feedToReload);
                    } else {
                        console.warn(`Selected category ${this.selectedCategory} looks like a curated feed ID, but not found in archive.`);
                        this.error = `Cannot load curated feed: ${this.selectedCategory}`;
                        this.loading = false;
                        return;
                    }
                } else if (this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID &&
                    ![FAVOURITES_CATEGORY_ID, LIKED_CATEGORY_ID].includes(this.selectedCategory)) {
                    this.showLikedImages = false;
                    this.showFavourites = false;
                    const feedToLoad = this.archivedCuratedFeeds.find(f => f.id === this.selectedCategory);
                    if (feedToLoad) {
                        // Found an archived feed matching the selected category ID
                        console.log(`Loading archived curated feed: ${feedToLoad.name}`);
                        // Directly load from the archive, no async needed here
                        this._loadSpecificCuratedFeed(feedToLoad);
                        return; // Loading handled, exit
                    } else {
                        // The selected ID looks like a curated one, but wasn't found in the archive
                        console.warn(`Selected category ${this.selectedCategory} not found in archived feeds.`);
                        this.error = `Could not load archived feed: ${this.selectedCategory}`;
                        this.items = []; // Clear items
                        this.loading = false;
                        return;
                    }
                }
            }
        } else {
            // If switching to a regular media source, always unselect favourites/liked
            this.showFavourites = false;
            this.showLikedImages = false;
        }

        // Show loading state
        this.loading = true;

        // Stop auto slide
        this.stopAutoSlide();

        this.prefetchedImages.clear(); // Clear prefetched images tracking

        // Explicitly reset progress bar
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }

        // Set the category to the first category if no category is selected
        if (!this.selectedCategory) {
            this.selectedCategory = this.categories[0].id;
        }

        try {
            // Construct URL with category parameter if selected
            let apiUrl = `/api/${this.selectedMediaSource}/feed`;
            if (this.selectedCategory) {
                apiUrl += `?category=${this.selectedCategory}`;
            }

            // Add HD parameter if enabled
            if (this.isHD) {
                apiUrl += (apiUrl.includes('?') ? '&' : '?') + 'hd=true';
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch RSS feed');
            }

            const feed = await response.json();
            this.items = feed.items;
            this.category = feed.category;

            // Log information about item descriptions
            if (!["apod", "reddit"].includes(this.selectedMediaSource)) {
                // Shuffle the items array
                this.shuffleArray(this.items);
            }

            // Default to first image
            this.currentIndex = 0;

            // If we have a target image ID, find and use it
            if (this.targetImageId && this.items.length > 0) {
                const targetIndex = this.items.findIndex(item => item.id === this.targetImageId);
                if (targetIndex !== -1) {
                    this.currentIndex = targetIndex;
                }
                // Clear the target ID so we don't try to use it again
                this.targetImageId = null;
            }

            if (this.items.length === 0) {
                this.error = 'No images found in the feed';
            } else {
                // Show temporary category overlay
                this.showTemporaryMediaSourceOverlay();
                // Update document title with initial image
                this.updateDocumentTitle();
                // Update URL with initial image ID
                this.updateURL();
                // Prefetch next images
                this.prefetchNextImages();
                // Start auto-slideshow
                this.startAutoSlide();
            }
        } catch (err) {
            console.error('Error:', err);
            this.error = 'Failed to load gallery. Please try again later.';
        } finally {
            this.loading = false;
        }
    }

    // Show temporary media source overlay
    showTemporaryMediaSourceOverlay = () => {
        // Check if we're on a mobile device
        if (this.isMobile) {
            return; // Don't show overlay on mobile
        }

        // Clear any existing timeouts
        if (this.mediaSourceOverlayTimeoutId) {
            clearTimeout(this.mediaSourceOverlayTimeoutId);
        }
        if (this.mediaSourceOverlayTransitionId) {
            clearTimeout(this.mediaSourceOverlayTransitionId);
        }

        // Set the media source name with HTML formatting
        const sourceName = this.mediaSources.find(source => source.id === this.selectedMediaSource)?.name;
        const categoryName = this.getCurrentCategoryName();
        this.mediaSourceOverlayText = `

                    `;

        // First transition to visible state
        this.showMediaSourceOverlay = true;

        // Hide after 2 seconds with a fade-out transition
        this.mediaSourceOverlayTimeoutId = setTimeout(() => {
            // Start fade-out transition
            this.mediaSourceOverlayTransitionId = setTimeout(() => {
                this.showMediaSourceOverlay = false;
            }, 300) as unknown as number;
        }, 2000) as unknown as number;
    }

    // Fisher-Yates shuffle algorithm
    shuffleArray = (array: any[]): any[] => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Handle keyboard shortcuts
    handleKeyDown = (e: KeyboardEvent) => {
        // Don't process key events if search is active or if an input element is focused
        if (this.showSearchOverlay || (document.activeElement && ['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase()))) {
            // Still process Escape to close search overlay
            if (e.key === 'Escape' && this.showSearchOverlay) {
                this.closeSearchOverlay();
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation
            }
            return;
        }

        // If help screen is visible, Escape should close it
        if (this.showHelp && e.key === 'Escape') {
            this.showHelp = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        switch (e.key) {
            case 'ArrowRight':
                this.nextItem();
                break;
            case 'ArrowLeft':
                this.prevItem();
                break;
            case 'Enter':
                if (this.currentItem && this.currentItem.link) {
                    window.open(this.currentItem.link, '_blank');
                }
                break;
            case 'ArrowUp':
                this.prevCategory();
                break;
            case 'ArrowDown':
                this.nextCategory();
                break;
            case 'PageUp':
                this.prevMediaSource();
                break;
            case 'PageDown':
                this.nextMediaSource();
                break;
            case 'h':
            case 'H':
                this.showHelp = !this.showHelp;
                break;
            case 'p':
            case 'P':
                this.togglePause();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'd':
            case 'D':
                this.showDescription = !this.showDescription;
                break;
            case 'Escape':
                this.exitFullscreen();
                break;
            case '/':
                if (this.isSearchAuthorized) {
                    this.openSearchOverlay();
                    e.preventDefault(); // Prevent typing '/' in the input
                }
                break;
            case 's':
            case 'S':
                this.toggleFavourite();
                break;
            case 'l':
            case 'L':
                this.toggleLikeImage();
                break;
            default:
                break;
        }
    }

    // Navigate to previous category
    prevCategory = () => {
        if (this.categories.length === 0) return "";

        this.categoryIndex = (this.categoryIndex - 1 + this.categories.length) % this.categories.length;
        this.selectedCategory = this.categories[this.categoryIndex].id;
        this.loadCategory();
    }

    // Navigate to next category
    nextCategory = () => {
        if (this.categories.length === 0) return "";

        this.categoryIndex = (this.categoryIndex + 1) % this.categories.length;
        this.selectedCategory = this.categories[this.categoryIndex].id;
        this.loadCategory();
    }

    // Show URL message
    showUrlMessage = (message: string) => {
        this.overlayMessage = message;
        this.showMessageOverlay = true;
        setTimeout(() => {
            this.showMessageOverlay = false;
        }, 5000);
    }

    // Method stubs for remaining methods referenced in init()
    loadMediaSources = async () => {
        this.loading = true;
        this.error = null;
        try {
            const response = await fetch('/api/media_sources');
            if (!response.ok) {
                throw new Error(`Failed to load media sources: ${response.statusText}`);
            }
            const sources: MediaSource[] = await response.json();
            this.mediaSources = [
                ...sources,
                { id: BIJUKARU_CUSTOM_SOURCE_ID, name: 'All Sources', hdSupported: true } // Add custom source
            ];

            // Check if the current selectedMediaSource from URL is valid, if not, default
            const urlParams = new URLSearchParams(window.location.search);
            const sourceFromUrl = urlParams.get('media_source');
            if (sourceFromUrl && this.mediaSources.find(s => s.id === sourceFromUrl)) {
                this.selectedMediaSource = sourceFromUrl;
            } else if (this.mediaSources.length > 0 && !this.mediaSources.find(s => s.id === this.selectedMediaSource)) {
                // If current selection is invalid (e.g. after custom view), and no valid URL param, pick first non-custom
                const firstValidSource = this.mediaSources.find(s => s.id == DEFAULT_MEDIA_SOURCE_ID)
                this.selectedMediaSource = firstValidSource ? firstValidSource.id : (this.mediaSources[0]?.id || '');
            } else if (this.mediaSources.length > 0 && this.selectedMediaSource === BIJUKARU_CUSTOM_SOURCE_ID && !sourceFromUrl) {
                // If coming from a custom view, default to the first non-custom source
                const firstValidSource = this.mediaSources.find(s => s.id == DEFAULT_MEDIA_SOURCE_ID);
                this.selectedMediaSource = firstValidSource ? firstValidSource.id : (this.mediaSources[0]?.id || '');
            }

            this.hdSupported = this.mediaSources.find(s => s.id === this.selectedMediaSource)?.hdSupported || false;

        } catch (err: any) {
            this.error = err.message;
            this.mediaSources = [{ id: BIJUKARU_CUSTOM_SOURCE_ID, name: 'All Sources', hdSupported: true }]; // Ensure custom source is always available
        } finally {
            this.loading = false;
        }
    };

    verifyAndStoreToken = async (token: string) => {
        this.searchToken = token;
        await this.verifyToken(true);
        // If token is correct, store it in localStorage
        if (this.isSearchAuthorized) {
            localStorage.setItem('searchToken', token);

            // Remove token from URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url);

            // Show success message
            this.overlayMessage = "Search feature unlocked!";
            this.showMessageOverlay = true;
            setTimeout(() => {
                this.showMessageOverlay = false;
            }, 3000);
        }
    }

    verifyToken = async (showError = true) => {
        if (!this.searchToken) {
            if (showError) {
                this.tokenError = "Token is required";
            }
            return false;
        }

        try {
            const response = await fetch(`/api/verify_token?token=${encodeURIComponent(this.searchToken)}`);
            const result = await response.json();

            if (response.ok && result.authorized) {
                this.isSearchAuthorized = true;
                this.tokenError = null;
                return true;
            } else {
                this.isSearchAuthorized = false;
                if (showError) {
                    this.tokenError = result.error || "Invalid token";
                }
                return false;
            }
        } catch (err) {
            console.error('Token verification error:', err);
            this.isSearchAuthorized = false;
            if (showError) {
                this.tokenError = "Failed to verify token";
            }
            return false;
        }
    }


    openSearchOverlay = () => {
        this.showSearchOverlay = true;
        this.error = null; // Clear previous errors
        this.tokenError = null; // Clear token errors

        // For Svelte 5, we no longer use $nextTick or $refs
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            const tokenInput = document.getElementById('token-input');
            if (this.isSearchAuthorized && searchInput) {
                searchInput.focus();
            } else if (tokenInput) {
                tokenInput.focus();
            }
        }, 0);
    }
    closeSearchOverlay = () => {
        this.showSearchOverlay = false;
        this.searchQuery = ""; // Clear query on close
        this.error = null; // Clear errors on close
        this.tokenError = null; // Clear token errors

    }
    nextMediaSource = () => {

        if (this.mediaSources.length <= 1) return;

        // Find current index
        const currentIndex = this.mediaSources.findIndex(source => source.id === this.selectedMediaSource);
        // Calculate next index with wrap-around
        const nextIndex = (currentIndex + 1) % this.mediaSources.length;

        // Set new media source and navigate
        this.selectedMediaSource = this.mediaSources[nextIndex].id;
        this.changeMediaSource();

    }
    prevMediaSource = () => {

        if (this.mediaSources.length <= 1) return;

        // Find current index
        const currentIndex = this.mediaSources.findIndex(source => source.id === this.selectedMediaSource);
        // Calculate previous index with wrap-around
        const prevIndex = (currentIndex - 1 + this.mediaSources.length) % this.mediaSources.length;

        // Set new media source and navigate
        this.selectedMediaSource = this.mediaSources[prevIndex].id;
        this.changeMediaSource();

    }
    performSearch = async () => {
        if (!this.isSearchAuthorized) {
            // If not authorized, try to verify token first
            const verified = await this.verifyToken();
            if (!verified) return;
        }

        if (!this.searchQuery.trim()) return;

        this.loading = true;
        this.error = null;

        try {
            // Determine if it's a curation query
            const keywords = ["story", "narrative", "curate", "tell me about", "life of", "teach me about"];
            const isCurationQuery = keywords.some(keyword => this.searchQuery.toLowerCase().includes(keyword));
            const token = localStorage.getItem('searchToken') || this.searchToken;

            let url;
            if (isCurationQuery) {
                console.log("Performing curation query...");
                url = `/api/curate?query=${encodeURIComponent(this.searchQuery)}&token=${encodeURIComponent(token)}`;
            } else {
                console.log("Performing standard search query...");
                url = `/api/search?query=${encodeURIComponent(this.searchQuery)}&token=${encodeURIComponent(token)}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error ${response.status}`);
            }

            // Close search overlay immediately
            this.closeSearchOverlay();

            if (isCurationQuery) {
                // Handle CuratedFeed response
                console.log("Received curated feed:", result);
                if (result.items && result.category) {
                    // Store previous state if not already in a custom view
                    if (this.selectedMediaSource !== BIJUKARU_CUSTOM_SOURCE_ID) {
                        this.previousSelectedMediaSource = this.selectedMediaSource;
                        this.previousSelectedCategory = this.selectedCategory;
                    }

                    // Set custom source and load items
                    this.selectedMediaSource = BIJUKARU_CUSTOM_SOURCE_ID;
                    this.items = result.items; // Load items from curated feed

                    const currentQuery = this.searchQuery; // Capture before it might be cleared
                    // Ensure the new category is available and selected
                    const newCategory: Category = { id: result.category.id, name: result.category.name };
                    this.category = newCategory; // Update the state's category object

                    // Set categories array for the dropdown
                    this.categories = [newCategory];
                    this.categoryIndex = 0;

                    // Save this curated feed to archived list
                    const existingArchivedIndex = this.archivedCuratedFeeds.findIndex(f => f.id === newCategory.id);
                    const archivedFeedEntry: ArchivedCuratedFeed = {
                        id: newCategory.id,
                        name: newCategory.name,
                        originalQuery: currentQuery,
                        items: result.items, // Store the items directly
                        userfriendly_message: result.userfriendly_message // Store the message
                    };
                    if (existingArchivedIndex > -1) {
                        this.archivedCuratedFeeds[existingArchivedIndex] = archivedFeedEntry; // Update if exists
                    } else {
                        this.archivedCuratedFeeds.push(archivedFeedEntry); // Add new
                    }
                    this.archivedCuratedFeeds = [...this.archivedCuratedFeeds]; // Ensure reactivity for Svelte 5
                    this.saveArchivedCuratedFeeds();

                    // Set selectedCategory to the curated category ID for potential URL updates or state consistency
                    this.selectedCategory = newCategory.id;

                    // Reset view states
                    this.showFavourites = false;
                    this.showLikedImages = false;

                    this.currentIndex = 0;
                    if (this.items.length === 0) {
                        this.error = 'Curated feed is empty.';
                    } else {
                        this.error = null;
                    }

                    this.updateProgressBar();
                    if (result.userfriendly_message) {
                        this.showUrlMessage(result.userfriendly_message); // Use existing overlay logic
                    }
                    if (result.llm_thinking) {
                        console.log("LLM Thinking:", result.llm_thinking);
                    }

                    // Update URL and title, start slideshow
                    this.updateURL();
                    this.updateDocumentTitle();
                    this.prefetchNextImages();
                    this.startAutoSlide();

                } else {
                    throw new Error("Invalid curated feed response from server.");
                }
            } else {
                // Handle regular search response (URL redirect)
                console.log("Search successful, received URL:", result.url);
                if (result.url) {
                    // Store message to show on next page load
                    if (result.userfriendly_message) {
                        localStorage.setItem('bijukaru_message', result.userfriendly_message);
                    }
                    // Navigate using SvelteKit's goto or directly setting window.location
                    // Using window.location ensures parameters are processed by init on reload
                    window.location.href = result.url;
                } else {
                    throw new Error("Invalid search response from server.");
                }
            }

        } catch (err: any) {
            console.error('Search/Curation error:', err);
            this.error = err.message || 'An error occurred during the search/curation.';
        } finally {
            this.loading = false;
        }
    }
    changeMediaSource = async (newSourceId?: string) => {
        const targetSourceId = newSourceId ?? this.selectedMediaSource; // The source we are switching *to*
        const currentSourceId = this.selectedMediaSource; // The source we are switching *from*

        // If switching away from a custom view, clear relevant flags
        if (currentSourceId === BIJUKARU_CUSTOM_SOURCE_ID && targetSourceId !== BIJUKARU_CUSTOM_SOURCE_ID) {
            console.log("Switching FROM custom source TO regular source:", targetSourceId);
            this.showFavourites = false;
            this.showLikedImages = false;
            // If we have a previously saved state, restore it
            if (this.previousSelectedMediaSource && this.previousSelectedCategory) {
                console.log("Restoring previous state:", this.previousSelectedMediaSource, this.previousSelectedCategory);
                this.selectedMediaSource = this.previousSelectedMediaSource;
                this.selectedCategory = this.previousSelectedCategory;
                this.previousSelectedMediaSource = null; // Clear saved state
                this.previousSelectedCategory = null;
                // Need to call loadCategory to refresh based on restored state
                await this.loadCategory();
                return; // Exit early as loadCategory handles loading/URL updates
            } else {
                console.log("No previous state to restore, proceeding with target:", targetSourceId);
                // If no saved state, proceed with the targetSourceId (likely selected from dropdown)
                this.selectedMediaSource = targetSourceId;
            }
        } else if (targetSourceId === BIJUKARU_CUSTOM_SOURCE_ID && currentSourceId !== BIJUKARU_CUSTOM_SOURCE_ID) {
            // Switching TO the custom source manually from a regular source
            console.log("Switching TO custom source FROM regular source:", currentSourceId);
            // Store the state we are leaving
            this.previousSelectedMediaSource = currentSourceId;
            this.previousSelectedCategory = this.selectedCategory;

            this.selectedMediaSource = BIJUKARU_CUSTOM_SOURCE_ID;
            // Clear flags that might be incorrectly set
            this.showFavourites = false;
            this.showLikedImages = false;
            // `loadCategories` will set the default custom category (e.g., Favourites)
            await this.loadCategories(); // This will setup categories: Favourites, Liked
            await this.loadCategory();   // This will load the default (Favourites)
            this.updateURL();
            return; // Exit after handling manual switch TO custom source
        }
        // If we reach here, it's either:
        // 1. Switching between two regular sources
        // 2. Switching away from custom source without saved state (handled by fallthrough)
        // 3. An internal state update (e.g. from toggleShowFavourites setting source) - less likely via this func
        console.log("Proceeding with regular source change or fallthrough:", targetSourceId);
        this.selectedMediaSource = targetSourceId;

        // Show loading state
        this.loading = true;
        this.error = null;

        try {
            // Get the URL parameters
            const urlParams = new URLSearchParams(window.location.search);

            // Remove image_id and category parameters when changing sources
            urlParams.delete('image_id');
            urlParams.delete('category');
            urlParams.delete('media_source');
            // Reset category-related variables
            this.selectedCategory = "";
            this.categoryIndex = 0;
            this.targetImageId = null;
            // Check if HD is supported
            const sourceWithHd = this.mediaSources.find(source => source.id === this.selectedMediaSource);
            this.hdSupported = sourceWithHd?.hdSupported !== undefined ? sourceWithHd.hdSupported : false;

            // Preserve interval parameter if it exists
            if (this.slideInterval !== 10000) {
                urlParams.set('interval', String(this.slideInterval / 1000));
            }

            // Preserve HD parameter if enabled
            if (this.isHD) {
                urlParams.set('hd', 'true');
            }

            // Preserve prefetch parameter
            if (this.nToPrefetch !== 2) {
                urlParams.set('prefetch', String(this.nToPrefetch));
            }

            // Preserve fullscreen parameter if toolbar is hidden
            if (this.hideToolbar) {
                urlParams.set('fullscreen', 'true');
            }

            // Preserve showDescription parameter
            if (this.showDescription) {
                urlParams.set('showDescription', 'true');
            }

            // Update URL without reloading
            const newUrl = `/?media_source=${targetSourceId}&${urlParams.toString()}`;
            pushState(newUrl, { mediaSource: this.selectedMediaSource });

            // Update document title
            const sourceInfo = this.mediaSources.find(s => s.id === this.selectedMediaSource);
            if (sourceInfo) {
                document.title = `${sourceInfo.name} - Bijukaru picture carousel`;
            }

            // Load categories for new source
            await this.loadCategories();

            // Load feed for new source
            await this.loadCategory();

            // Update URL with current state
            this.updateURL();
        } catch (err) {
            console.error('Error changing media source:', err);
            this.error = 'Failed to change media source. Please try again later.';
        } finally {
            this.loading = false;
        }
    }
    refreshRandomArtist = () => {
        if (this.selectedCategory === 'random-artist') {
            this.loadCategory();
        }

    }
    toggleHD = () => {
        // Store current image ID before toggling
        const currentImageId = this.currentItem?.id;

        this.isHD = !this.isHD;

        // Reload the feed with HD parameter
        this.loadCategory().then(() => {
            // After reloading, try to find the same image
            if (currentImageId) {
                const newIndex = this.items.findIndex(item => item.id === currentImageId);
                if (newIndex !== -1) {
                    this.currentIndex = newIndex;
                    // Update document title and URL
                    this.updateDocumentTitle();
                    this.updateURL();
                }
            }
        });

        // Update URL
        this.updateURL();
    }

    // Favourites methods
    loadFavourites = () => {
        try {
            const favouritesData = localStorage.getItem('galleryFavourites');
            if (favouritesData) {
                // Convert the serialized data back to a Map<string, Set<string>>
                const parsed = JSON.parse(favouritesData);
                const favouritesMap = new Map();

                Object.keys(parsed).forEach(mediaSource => {
                    favouritesMap.set(mediaSource, new Set(parsed[mediaSource]));
                });

                this.favourites = favouritesMap;
            }
        } catch (error) {
            console.error('Error loading favourites:', error);
        }
    }

    saveFavourites = () => {
        try {
            // Convert Map<string, Set<string>> to a serializable object
            const serializedFavourites: Record<string, string[]> = {};

            this.favourites.forEach((categories, mediaSource) => {
                serializedFavourites[mediaSource] = Array.from(categories);
            });

            localStorage.setItem('galleryFavourites', JSON.stringify(serializedFavourites));
        } catch (error) {
            console.error('Error saving favourites:', error);
        }
    }

    toggleFavourite = (categoryIdInput?: string, mediaSourceIdInput?: string) => {
        const mediaSource = mediaSourceIdInput || (this.showFavourites && this.currentItem?.media_source) || this.selectedMediaSource;
        const category = categoryIdInput || (this.showFavourites && this.currentItem?.category_id) || this.selectedCategory;

        if (!category || !mediaSource) {
            console.warn("ToggleFavourite: category or mediaSource missing", category, mediaSource);
            return;
        }

        if (!this.favourites.has(mediaSource)) {
            this.favourites.set(mediaSource, new Set());
        }

        const sourceCategories = this.favourites.get(mediaSource)!;
        // let isNowFavourite = false; // This variable was declared but its value never read.

        if (sourceCategories.has(category)) {
            sourceCategories.delete(category);
            this.showUrlMessage('Removed from favourites');
            // isNowFavourite = false; // This variable was declared but its value never read.

            if (this.showFavourites) {
                const categoryIdToRemove = category;
                const mediaSourceIdToRemove = mediaSource;

                this.items = this.items.filter(item =>
                    !(item.category_id === categoryIdToRemove && item.media_source === mediaSourceIdToRemove)
                );

                if (this.items.length === 0) { // Current favourites view is empty
                    // Check if *any* favourites remain in the this.favourites map across all sources
                    let noFavouritesLeftAtAll = true;
                    this.favourites.forEach(set => {
                        if (set.size > 0) {
                            noFavouritesLeftAtAll = false;
                        }
                    });

                    if (noFavouritesLeftAtAll) {
                        // All favourites are gone from the system. Redirect to a non-custom source.
                        this.showFavourites = false;
                        this.showLikedImages = false; // Ensure this is also off

                        const firstNonCustomSource = this.mediaSources.find(s => s.id !== BIJUKARU_CUSTOM_SOURCE_ID);
                        if (firstNonCustomSource) {
                            this.selectedMediaSource = firstNonCustomSource.id;
                            this.selectedCategory = ""; // Will be set by loadCategories to the first of the new source
                            this.previousSelectedMediaSource = null; // Clear previous state
                            this.previousSelectedCategory = null;

                            // Asynchronously load categories and then the content for the new source/category.
                            (async () => {
                                await this.loadCategories();
                                await this.loadCategory();
                            })();
                        } else {
                            // Highly unlikely fallback: No non-custom sources exist.
                            this.items = [];
                            this.error = "No media sources available to display.";
                            this.loading = false;
                            this.updateURL();
                            this.updateDocumentTitle();
                            this.stopAutoSlide();
                        }
                        return; // Exit toggleFavourite as we've handled the redirection
                    } else {
                        // Favourites still exist elsewhere in the system, but this specific view became empty.
                        this.toggleShowFavourites(); // This will handle restoring previous state or defaulting.
                        return; // Exit toggleFavourite
                    }
                } else {
                    // Items still remain in the current favourites view, just update the current item.
                    this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.items.length - 1));
                    this.updateDocumentTitle();
                    this.updateURL();
                    this.stopAutoSlide();
                    this.startAutoSlide();
                }
            }
        } else {
            sourceCategories.add(category);
            this.showUrlMessage('Added to favourites');
            // isNowFavourite = true; // This variable was declared but its value never read.
        }

        this.favourites = new Map(this.favourites);
        this.saveFavourites();
    }

    isFavourite = (categoryIdInput?: string, mediaSourceIdInput?: string) => {
        const mediaSource = mediaSourceIdInput || (this.showFavourites && this.currentItem?.media_source) || this.selectedMediaSource;
        const category = categoryIdInput || (this.showFavourites && this.currentItem?.category_id) || this.selectedCategory;

        if (!category || !mediaSource) return false;

        return this.favourites.has(mediaSource) &&
            this.favourites.get(mediaSource)!.has(category);
    }

    loadAllFavourites = async () => {
        // Store if we're showing favourites before potentially clearing it
        const wasShowingFavourites = this.showFavourites;

        this.loading = true;
        this.error = null;

        try {
            // Get all media sources that have favourites
            const mediaSourcesWithFavourites = Array.from(this.favourites.keys());
            if (mediaSourcesWithFavourites.length === 0) {
                // Show message without switching to favourites view
                this.showUrlMessage('No favourite categories found. Add categories to your favourites by pressing "s" key or the star icon.');
                return;
            }

            // Only set showFavourites to true if we have favourites to show
            this.showFavourites = true;
            this.items = [];

            let allItems: ImageItem[] = [];

            // For each media source with favourites
            for (const mediaSourceId of mediaSourcesWithFavourites) { // mediaSourceId is the ID
                let categoriesForCurrentSource: Category[] = [];
                if (mediaSourceId === BIJUKARU_CUSTOM_SOURCE_ID) {
                    categoriesForCurrentSource = [{ id: LIKED_CATEGORY_ID, name: 'Liked' }];
                    if (Array.from(this.favourites.get(BIJUKARU_CUSTOM_SOURCE_ID)!).includes(LIKED_CATEGORY_ID)) {
                        allItems = [...allItems, ...this.likedImages.map(item => ({
                            ...item,
                            sourceCategory: 'Bijukaru - Liked',
                            media_source: BIJUKARU_CUSTOM_SOURCE_ID,
                            category_id: LIKED_CATEGORY_ID
                        }))];
                    }
                } else {
                    try {
                        const catResponse = await fetch(`/api/${mediaSourceId}/categories`);
                        if (catResponse.ok) {
                            categoriesForCurrentSource = await catResponse.json();
                        } else {
                            console.warn(`Could not fetch categories for source ${mediaSourceId} during favourite loading. Status: ${catResponse.status}`);
                        }
                    } catch (e) {
                        console.warn(`Error fetching categories for source ${mediaSourceId} in loadAllFavourites:`, e);
                    }

                    const favouriteCategories = Array.from(this.favourites.get(mediaSourceId)!);

                    // For each favourite category in this media source
                    for (const categoryId of favouriteCategories) { // categoryId is the ID
                        const endpoint = `/api/${mediaSourceId}/feed?category=${categoryId}${this.isHD ? '&hd=true' : ''}`;
                        const response = await fetch(endpoint);

                        if (!response.ok) {
                            console.warn(`Failed to load favourites from ${mediaSourceId}/${categoryId}: ${response.statusText}`);
                            continue; // Skip this category but continue with others
                        }

                        const data = await response.json();
                        if (data.items && Array.isArray(data.items)) {
                            // Add properties to track source and category
                            const resolvedSourceName = this.mediaSources.find(s => s.id === mediaSourceId)?.name || mediaSourceId;
                            // Use categoriesForCurrentSource to find the name
                            const resolvedCategoryName = categoriesForCurrentSource.find(c => c.id === categoryId)?.name || categoryId;
                            const itemsWithSourceInfo = data.items.map((item: ImageItem) => ({
                                ...item,
                                sourceCategory: `${resolvedSourceName} - ${resolvedCategoryName}`, // For display
                                media_source: mediaSourceId, // Store the actual media source ID
                                category_id: categoryId      // Store the actual category ID
                            }));

                            allItems = [...allItems, ...itemsWithSourceInfo];
                        }
                    }
                }
            }

            if (allItems.length === 0) {
                // Show message without keeping favourites view
                this.showUrlMessage('No favourite categories found. Add categories to your favourites by pressing "s" key or the star icon.');
                this.showFavourites = wasShowingFavourites; // Restore previous state
                return;
            }

            // Shuffle items to mix sources and categories
            this.items = this.shuffleArray(allItems);
            this.currentIndex = 0;

            // Start auto slide if not paused
            if (!this.isPaused) {
                this.startAutoSlide();
            }

            // Update document title
            this.updateDocumentTitle();
        } catch (error: any) {
            console.error('Error loading all favourites:', error);
            this.error = error.message || 'Failed to load favourites';
            this.showFavourites = wasShowingFavourites; // Restore previous state
        } finally {
            this.loading = false;
        }
    }

    toggleShowFavourites = () => {
        const activating = !this.showFavourites;

        if (activating) {
            // Check if there are any favourites before activating
            const hasAnyFavourites = this.favourites.size > 0 && Array.from(this.favourites.values()).some(set => set.size > 0);

            if (!hasAnyFavourites) {
                // Show message without switching to favourites view
                this.showUrlMessage('No favourite categories found. Add categories to your favourites by pressing "s" key or the star icon.');
                return;
            }

            // Store previous state if not already in a custom view
            if (this.selectedMediaSource !== BIJUKARU_CUSTOM_SOURCE_ID) {
                this.previousSelectedMediaSource = this.selectedMediaSource;
                this.previousSelectedCategory = this.selectedCategory;
            }

            this.showFavourites = true;
            this.showLikedImages = false; // Can't show both

            this.selectedMediaSource = BIJUKARU_CUSTOM_SOURCE_ID;
            // Set categories and selected category for the dropdown
            this.categories = [{ id: FAVOURITES_CATEGORY_ID, name: 'Favourites' }];
            this.selectedCategory = FAVOURITES_CATEGORY_ID;
            this.category = this.categories[0]; // Update internal category reference
            this.categoryIndex = 0;
            // Load items from all favourited categories across all sources
            this.loadAllFavourites();
        } else {
            this.showFavourites = false;
            // Restore previous state
            this.selectedMediaSource = this.previousSelectedMediaSource || this.mediaSources.find(s => s.id !== BIJUKARU_CUSTOM_SOURCE_ID)?.id || this.mediaSources[0]?.id || '';
            this.selectedCategory = this.previousSelectedCategory || '';
            this.previousSelectedMediaSource = null;
            this.previousSelectedCategory = null;
            this.loadCategory(); // Reload original category/source
        }
        this.updateURL();
    }

    loadLikedImages = () => {
        try {
            const likedImagesData = localStorage.getItem('galleryLikedImages');
            if (likedImagesData) {
                this.likedImages = JSON.parse(likedImagesData);
            }
        } catch (error) {
            console.error('Error loading liked images:', error);
        }
    }

    saveLikedImages = () => {
        try {
            localStorage.setItem('galleryLikedImages', JSON.stringify(this.likedImages));
        } catch (error) {
            console.error('Error saving liked images:', error);
        }
    }

    toggleLikeImage = () => {
        if (!this.currentItem) return;

        const isLiked = this.isImageLiked();
        if (isLiked) {
            // Remove from liked images
            this.likedImages = this.likedImages.filter(img => img.id !== this.currentItem?.id);
            this.saveLikedImages();

            // If we're viewing liked images, remove from current view
            if (this.showLikedImages) {
                this.items = this.items.filter(item => item.id !== this.currentItem?.id);
                if (this.items.length === 0) {
                    // If no more liked images, exit liked images view
                    this.showLikedImages = false;
                    this.updateURL();
                    this.updateDocumentTitle();
                } else {
                    // Adjust current index if needed
                    this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
                }
            }
        } else {
            // Add to liked images with source information
            if (this.currentItem) {
                const likedImage = {
                    ...this.currentItem,
                    sourceCategory: this.getCurrentCategoryName(),
                    media_source: this.selectedMediaSource
                };
                this.likedImages.push(likedImage);
                this.saveLikedImages();
            }
        }
    }

    isImageLiked = () => {
        if (!this.currentItem) return false;
        return this.likedImages.some(img => img.id === this.currentItem?.id);
    }

    loadLikedImagesView = async () => {
        // Store if we're showing liked images before potentially clearing it
        const wasShowingLikedImages = this.showLikedImages;
        this.showLikedImages = true;

        this.loading = true;
        this.error = null;

        try {
            if (this.likedImages.length === 0) {
                throw new Error('No liked images found');
            }

            // Use the stored liked images directly
            // this.items = this.shuffleArray([...this.likedImages]);
            this.items = [...this.likedImages];
            this.currentIndex = 0;

            // Start auto slide if not paused
            if (!this.isPaused) {
                this.startAutoSlide();
            }

            // Update document title
            this.updateDocumentTitle();
        } catch (error: any) {
            console.error('Error loading liked images:', error);
            this.error = error.message || 'Failed to load liked images';
            this.showLikedImages = wasShowingLikedImages; // Restore previous state
        } finally {
            this.loading = false;
        }
    }

    toggleShowLikedImages = () => {
        const activating = !this.showLikedImages;
        this.showLikedImages = activating;
        this.showFavourites = false; // Can't show both

        if (activating) {
            // Store previous state if not already in a custom view
            if (this.selectedMediaSource !== BIJUKARU_CUSTOM_SOURCE_ID) {
                this.previousSelectedMediaSource = this.selectedMediaSource;
                this.previousSelectedCategory = this.selectedCategory;
            }
            this.selectedMediaSource = BIJUKARU_CUSTOM_SOURCE_ID;
            // Set categories and selected category for the dropdown
            this.categories = [{ id: LIKED_CATEGORY_ID, name: 'Liked Images' }];
            this.selectedCategory = LIKED_CATEGORY_ID;
            this.category = this.categories[0]; // Update internal category reference
            this.categoryIndex = 0;
            this.loadLikedImagesView(); // Load the liked items
        } else {
            // Restore previous state
            this.selectedMediaSource = this.previousSelectedMediaSource || this.mediaSources.find(s => s.id !== BIJUKARU_CUSTOM_SOURCE_ID)?.id || this.mediaSources[0]?.id || '';
            this.selectedCategory = this.previousSelectedCategory || '';
            this.previousSelectedMediaSource = null;
            this.previousSelectedCategory = null;
            this.loadCategory(); // Reload original category/source
        }
        this.updateURL();
    }

    updateProgressBar = () => {
        // Since animateProgressBar handles reset and animation, just call it.
        this.animateProgressBar();
    }

    loadArchivedCuratedFeeds = () => {
        const saved = localStorage.getItem('galleryArchivedCuratedFeeds');
        if (saved) {
            try {
                this.archivedCuratedFeeds = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse archived curated feeds', e);
            }
        }
    };

    saveArchivedCuratedFeeds = () => {
        localStorage.setItem('galleryArchivedCuratedFeeds', JSON.stringify(this.archivedCuratedFeeds));
    };

    hasFavourites = () => {
        // Check if the favourites map has any entries
        if (!this.favourites) return false;
        return this.favourites.size > 0;
    };

    hasLikedImages = () => {
        // Check if there are any liked images
        if (!this.likedImages) return false;
        return this.likedImages.length > 0;
    };

    // Internal method to load a specific archived curated feed from stored data
    _loadSpecificCuratedFeed = (feed: ArchivedCuratedFeed) => {
        console.log(`Loading archived curated feed: ${feed.name} from stored items.`);
        this.loading = true;
        this.error = null;
        this.items = []; // Clear current items
        this.showFavourites = false; // Ensure these are off
        this.showLikedImages = false;

        try {
            if (feed.items && feed.id && feed.name) {
                this.items = [...feed.items]; // Use a copy of the stored items
                this.category = { id: feed.id, name: feed.name };
                this.selectedCategory = this.category.id; // Ensure selectedCategory matches the loaded feed ID
                this.currentIndex = 0;

                if (this.items.length === 0) {
                    this.error = 'Archived curated feed is empty.';
                } else {
                    this.error = null;
                }

                // Ensure the categories dropdown still reflects the custom source options + this loaded one
                const customCategories: Category[] = [
                    { id: FAVOURITES_CATEGORY_ID, name: 'Favourites' },
                    { id: LIKED_CATEGORY_ID, name: 'Liked Images' },
                    ...this.archivedCuratedFeeds.map(f => ({ id: f.id, name: f.name }))
                ];
                this.categories = customCategories;
                this.categoryIndex = Math.max(0, this.categories.findIndex(c => c.id === this.selectedCategory));

                this.updateProgressBar();
                this.updateURL();
                this.updateDocumentTitle();
                this.prefetchNextImages();
                this.startAutoSlide();

                // Display user-friendly message if it exists
                if (feed.userfriendly_message) {
                    this.showUrlMessage(feed.userfriendly_message);
                }
            } else {
                throw new Error("Invalid archived curated feed data.");
            }
        } catch (err: any) {
            console.error('Error loading archived curated feed:', err);
            this.error = err.message || 'An error occurred while loading the archived curated feed.';
            this.items = []; // Clear items on error
        } finally {
            this.loading = false;
        }
    }
}

// Create a context key
const GALLERY_CONTEXT = 'gallery';

export const getGalleryState = (key = GALLERY_CONTEXT) => {
    return getContext<GalleryState>(key);
};

export const setGalleryState = (key = GALLERY_CONTEXT) => {
    const galleryState = new GalleryStateClass();
    return setContext(key, galleryState);
};
