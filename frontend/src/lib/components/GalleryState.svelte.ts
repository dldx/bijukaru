import { getContext, setContext } from "svelte";
import { pushState, replaceState } from "$app/navigation";

// Define types
interface ImageItem {
    id: string;
    title: string;
    image_url: string;
    link: string;
    description?: string;
    sourceCategory?: string;
    artist_name?: string;
    media_source?: string;
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
    favorites: Map<string, Set<string>>;
    showFavorites: boolean;
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
    changeMediaSource: () => void;
    showTemporaryMediaSourceOverlay: () => void;
    shuffleArray: (array: any[]) => any[];
    toggleFavorite: (categoryId?: string) => void;
    isFavorite: (categoryId?: string) => boolean;
    loadFavorites: () => void;
    saveFavorites: () => void;
    loadFavoritesCategory: () => Promise<void>;
    toggleShowFavorites: () => void;
    loadAllFavorites: () => Promise<void>;
    toggleLikeImage: () => void;
    isImageLiked: () => boolean;
    loadLikedImages: () => void;
    saveLikedImages: () => void;
    loadLikedImagesView: () => Promise<void>;
    toggleShowLikedImages: () => void;
}

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
    selectedMediaSource = $state("apod");
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
    favorites = $state<Map<string, Set<string>>>(new Map());
    showFavorites = $state(false);
    likedImages = $state<ImageItem[]>([]);
    showLikedImages = $state(false);

    // Computed property for current item
    get currentItem() {
        return this.items[this.currentIndex] || null;
    }

    get currentCategoryName() {
        return this.category ? this.category.name : this.getCurrentCategoryName();
    }

    get currentSourceName() {
        return this.mediaSources.find(s => s.id === this.selectedMediaSource)?.name || 'Unknown Source';
    }

    // Initialize gallery
    init = async () => {
        // Apply dark mode on page load
        this.applyTheme();

        // Load favorites from localStorage
        this.loadFavorites();

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

        // Check for message parameter
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

        // Check for favorites view parameter
        const favoritesParam = urlParams.get('favorites');
        if (favoritesParam === 'true') {
            this.showFavorites = true;
        }

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

        // Check for liked images view parameter
        const likedParam = urlParams.get('liked');
        if (likedParam === 'true') {
            this.showLikedImages = true;
        }
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

        // Add favorites or liked images indicator
        if (this.showFavorites) {
            title = `⭐ Favorites - ${title}`;
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

            // Set category unless we're in favorites view
            if (!this.showFavorites && this.selectedCategory) {
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

            // Set favorites view parameter
            if (this.showFavorites) {
                url.searchParams.set('favorites', 'true');
            } else {
                url.searchParams.delete('favorites');
            }

            // Set liked images view parameter
            if (this.showLikedImages) {
                url.searchParams.set('liked', 'true');
            } else {
                url.searchParams.delete('liked');
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
        // If we're viewing favorites and have a current item with sourceCategory, use that
        if (this.showFavorites && this.currentItem?.sourceCategory) {
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

        // Reset progress bar
        if (this.progressBar) {
            this.animateProgressBar();
        }

        // Reset autoslide timer
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
        // Don't start auto-slide if interval is 0
        if (this.slideInterval === 0) {
            return;
        }

        this.autoSlideIntervalId = setInterval(() => {
            this.nextItem();
        }, this.slideInterval) as unknown as number;

        // Reset and start progress bar animation
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

        if (this.isPaused) {
            // Store current interval and pause
            this.originalInterval = this.slideInterval;
            this.slideInterval = 0;
            this.stopAutoSlide();
        } else {
            // Restore original interval and resume
            this.slideInterval = this.originalInterval;
            this.startAutoSlide();
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
    loadCategories = async () => {
        try {
            const response = await fetch(`/api/${this.selectedMediaSource}/categories`);
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            this.categories = await response.json();
        } catch (err) {
            console.error('Error loading categories:', err);
            // Fallback to default categories if API fails
            this.categories = [
                { id: "", name: "All Posts" },
            ];
        }
    }

    // Load category content
    loadCategory = async () => {
        // Clear error
        this.error = null;

        // Check if we should load favorites instead
        if (this.showFavorites) {
            return this.loadFavoritesCategory();
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
            }
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
                }
                break;
            case 's':
            case 'S':
                this.toggleFavorite();
                break;
            case 'v':
            case 'V':
                this.toggleShowFavorites();
                break;
            case 'l':
            case 'L':
                this.toggleLikeImage();
                break;
            case 'i':
            case 'I':
                this.toggleShowLikedImages();
                break;
            default:
                break;
        }
    }

    // Navigate to previous category
    prevCategory = () => {
        if (this.categories.length === 0) return;

        this.categoryIndex = (this.categoryIndex - 1 + this.categories.length) % this.categories.length;
        this.selectedCategory = this.categories[this.categoryIndex].id;
        this.loadCategory();
    }

    // Navigate to next category
    nextCategory = () => {
        if (this.categories.length === 0) return;

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
        try {
            const response = await fetch('/api/media_sources');
            if (!response.ok) {
                throw new Error('Failed to fetch media sources');
            }
            this.mediaSources = await response.json();
        } catch (err) {
            console.error('Error loading media sources:', err);
            // Fallback to default sources if API fails
            this.mediaSources = [
                { id: "thisiscolossal", name: "This is Colossal" },
                { id: "apod", name: "Astronomy Picture of the Day" },
                { id: "ukiyo-e", name: "Ukiyo-e" },
                { id: "guardian", name: "Guardian" },
                { id: "reddit", name: "Reddit" },
                { id: "wikiart", name: "WikiArt" }
            ];
        }
    }

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
            const response = await fetch(`/api/search?query=${encodeURIComponent(this.searchQuery)}&token=${encodeURIComponent(this.searchToken)}`);
            const result = await response.json();

            if (response.ok) {
                // Close search overlay immediately
                this.closeSearchOverlay();

                // Check if we received direct feed results
                if (result.feed && result.media_source) {
                    console.log("Search successful, received direct feed results");

                    // Switch to the appropriate media source if needed
                    console.log(result.media_source, this.selectedMediaSource);
                    if (result.media_source !== this.selectedMediaSource) {
                        this.selectedMediaSource = result.media_source;
                        this.changeMediaSource();
                        await this.loadCategories();
                    }

                    // Create a virtual search results category if it doesn't exist
                    const searchCategory = { id: "search-results", name: "Search Results" };
                    if (!this.categories.some(c => c.id === "search-results")) {
                        this.categories.push(searchCategory);
                    }

                    // Switch to search results category
                    this.selectedCategory = "search-results";
                    this.categoryIndex = this.categories.findIndex(c => c.id === "search-results");

                    // Replace the items with search results
                    this.items = result.feed.items;
                    this.currentIndex = 0;

                    // Show message if provided
                    if (result.userfriendly_message) {
                        this.overlayMessage = result.userfriendly_message;
                        this.showMessageOverlay = true;
                        setTimeout(() => {
                            this.showMessageOverlay = false;
                        }, 5000);
                    }

                    // Update URL for bookmarking
                    pushState(result.url.toString(), {});

                    // Update title and start slideshow
                    this.updateDocumentTitle();
                    this.startAutoSlide();
                }
                // Handle URL-based results (existing functionality)
                else if (result.url) {
                    console.log("Search successful, received URL:", result.url);

                    // Parse the URL to extract parameters
                    const urlObj = new URL(window.location.origin + result.url);
                    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                    const searchParams = urlObj.searchParams;

                    // Extract media source from the path
                    let newMediaSource = searchParams.get('media_source') || this.selectedMediaSource;
                    const hdParam = searchParams.get('hd') === 'true';
                    const categoryParam = searchParams.get('category');
                    const imageIdParam = searchParams.get('image_id');

                    // Show message if provided
                    if (result.userfriendly_message) {
                        this.overlayMessage = result.userfriendly_message;
                        this.showMessageOverlay = true;
                        setTimeout(() => {
                            this.showMessageOverlay = false;
                        }, 5000);
                    }

                    // Apply search results by updating component state
                    let mediaSourceChanged = false;

                    // Change media source if needed
                    if (newMediaSource !== this.selectedMediaSource) {
                        this.selectedMediaSource = newMediaSource;
                        mediaSourceChanged = true;

                        // Load categories for the new media source
                        await this.loadCategories();
                    }

                    // Update HD settings if specified
                    if (hdParam !== undefined) {
                        this.isHD = hdParam;
                    }

                    // Update category if specified
                    if (categoryParam) {
                        this.selectedCategory = categoryParam;
                        // Find index of this category
                        this.categoryIndex = Math.max(0, this.categories.findIndex(c => c.id === categoryParam));
                    }

                    // Set target image ID to jump to after loading
                    if (imageIdParam) {
                        this.targetImageId = imageIdParam;
                    }

                    // Load the appropriate content
                    await this.loadCategory();

                    // Update the URL without refreshing
                    pushState(result.url.toString(), {});

                    // Update document title
                    this.updateDocumentTitle();
                } else {
                    throw new Error('Search returned invalid results');
                }
            } else {
                throw new Error(result.error || 'Search failed');
            }
        } catch (err: any) {
            console.error('Search error:', err);
            this.error = err.message || 'An error occurred during the search.';
        } finally {
            this.loading = false;
        }
    }
    changeMediaSource = async () => {

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
            const newUrl = `/?media_source=${this.selectedMediaSource}&${urlParams.toString()}`;
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

    // Favorites methods
    loadFavorites = () => {
        try {
            const favoritesData = localStorage.getItem('galleryFavorites');
            if (favoritesData) {
                // Convert the serialized data back to a Map<string, Set<string>>
                const parsed = JSON.parse(favoritesData);
                const favoritesMap = new Map();

                Object.keys(parsed).forEach(mediaSource => {
                    favoritesMap.set(mediaSource, new Set(parsed[mediaSource]));
                });

                this.favorites = favoritesMap;
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    saveFavorites = () => {
        try {
            // Convert Map<string, Set<string>> to a serializable object
            const serializedFavorites: Record<string, string[]> = {};

            this.favorites.forEach((categories, mediaSource) => {
                serializedFavorites[mediaSource] = Array.from(categories);
            });

            localStorage.setItem('galleryFavorites', JSON.stringify(serializedFavorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    toggleFavorite = (categoryId?: string) => {
        const category = categoryId || this.selectedCategory;
        const mediaSource = this.selectedMediaSource;

        if (!category || !mediaSource) return;

        // Get or create the set of favorite categories for this media source
        if (!this.favorites.has(mediaSource)) {
            this.favorites.set(mediaSource, new Set());
        }

        const sourceCategories = this.favorites.get(mediaSource)!;

        // Toggle favorite status
        if (sourceCategories.has(category)) {
            sourceCategories.delete(category);
            this.showUrlMessage('Removed from favorites');
        } else {
            sourceCategories.add(category);
            this.showUrlMessage('Added to favorites');
        }

        // Create a new map to ensure reactivity in Svelte 5
        this.favorites = new Map(this.favorites);

        // Save to localStorage
        this.saveFavorites();
    }

    isFavorite = (categoryId?: string) => {
        const category = categoryId || this.selectedCategory;
        const mediaSource = this.selectedMediaSource;

        if (!category || !mediaSource) return false;

        return this.favorites.has(mediaSource) &&
            this.favorites.get(mediaSource)!.has(category);
    }

    loadFavoritesCategory = async () => {
        // Store if we're showing favorites before potentially clearing it
        const wasShowingFavorites = this.showFavorites;
        this.showFavorites = true;

        this.loading = true;
        this.error = null;
        this.items = [];

        try {
            // Get all favorite categories for the current media source
            const mediaSource = this.selectedMediaSource;
            if (!this.favorites.has(mediaSource) || this.favorites.get(mediaSource)!.size === 0) {
                throw new Error('No favorites for this media source');
            }

            const favoriteCategories = Array.from(this.favorites.get(mediaSource)!);

            // Fetch and combine items from all favorite categories
            let allItems: ImageItem[] = [];

            for (const category of favoriteCategories) {
                const endpoint = `/api/${mediaSource}/feed?category=${category}${this.isHD ? '&hd=true' : ''}`;
                const response = await fetch(endpoint);

                if (!response.ok) {
                    throw new Error(`Failed to load favorites: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.items && Array.isArray(data.items)) {
                    // Add a property to track which category each item belongs to
                    const categoryName = this.categories.find(c => c.id === category)?.name || category;
                    const itemsWithCategory = data.items.map((item: ImageItem) => ({
                        ...item,
                        sourceCategory: categoryName
                    }));

                    allItems = [...allItems, ...itemsWithCategory];
                }
            }

            if (allItems.length === 0) {
                throw new Error('No items found in your favorites');
            }

            // Shuffle items to mix categories
            this.items = this.shuffleArray(allItems);
            this.currentIndex = 0;

            // Update URL to reflect we're viewing favorites
            const url = new URL(window.location.href);
            url.searchParams.set('favorites', 'true');
            pushState(url.toString(), {});

            // Start auto slide if not paused
            if (!this.isPaused) {
                this.startAutoSlide();
            }

            // Update document title
            this.updateDocumentTitle();
        } catch (error: any) {
            console.error('Error loading favorites:', error);
            this.error = error.message || 'Failed to load favorites';
            this.showFavorites = wasShowingFavorites; // Restore previous state
        } finally {
            this.loading = false;
        }
    }

    loadAllFavorites = async () => {
        // Store if we're showing favorites before potentially clearing it
        const wasShowingFavorites = this.showFavorites;
        this.showFavorites = true;

        this.loading = true;
        this.error = null;
        this.items = [];

        try {
            // Get all media sources that have favorites
            const mediaSourcesWithFavorites = Array.from(this.favorites.keys());
            if (mediaSourcesWithFavorites.length === 0) {
                throw new Error('No favorites found across any media sources');
            }

            let allItems: ImageItem[] = [];

            // For each media source with favorites
            for (const mediaSource of mediaSourcesWithFavorites) {
                const favoriteCategories = Array.from(this.favorites.get(mediaSource)!);

                // For each favorite category in this media source
                for (const category of favoriteCategories) {
                    const endpoint = `/api/${mediaSource}/feed?category=${category}${this.isHD ? '&hd=true' : ''}`;
                    const response = await fetch(endpoint);

                    if (!response.ok) {
                        console.warn(`Failed to load favorites from ${mediaSource}/${category}: ${response.statusText}`);
                        continue; // Skip this category but continue with others
                    }

                    const data = await response.json();
                    if (data.items && Array.isArray(data.items)) {
                        // Add properties to track source and category
                        const sourceName = this.mediaSources.find(s => s.id === mediaSource)?.name || mediaSource;
                        const categoryName = this.categories.find(c => c.id === category)?.name || category;
                        const itemsWithSource = data.items.map((item: ImageItem) => ({
                            ...item,
                            sourceCategory: `${sourceName} - ${categoryName}`
                        }));

                        allItems = [...allItems, ...itemsWithSource];
                    }
                }
            }

            if (allItems.length === 0) {
                throw new Error('No items found in your favorites');
            }

            // Shuffle items to mix sources and categories
            this.items = this.shuffleArray(allItems);
            this.currentIndex = 0;

            // Update URL to reflect we're viewing all favorites
            const url = new URL(window.location.href);
            url.searchParams.set('favorites', 'true');
            url.searchParams.set('all_sources', 'true');
            pushState(url.toString(), {});

            // Start auto slide if not paused
            if (!this.isPaused) {
                this.startAutoSlide();
            }

            // Update document title
            this.updateDocumentTitle();
        } catch (error: any) {
            console.error('Error loading all favorites:', error);
            this.error = error.message || 'Failed to load favorites';
            this.showFavorites = wasShowingFavorites; // Restore previous state
        } finally {
            this.loading = false;
        }
    }

    toggleShowFavorites = () => {
        if (this.showFavorites) {
            // If we're already showing favorites, go back to regular view
            this.showFavorites = false;
            this.loadCategory();
        } else {
            // Check if we should show all favorites or just current source
            const urlParams = new URLSearchParams(window.location.search);
            const showAllSources = urlParams.get('all_sources') === 'true';

            if (showAllSources) {
                this.loadAllFavorites();
            } else {
                this.loadFavoritesCategory();
            }
        }
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
            this.items = this.shuffleArray([...this.likedImages]);
            this.currentIndex = 0;

            // Update URL to reflect we're viewing liked images
            const url = new URL(window.location.href);
            url.searchParams.set('liked', 'true');
            pushState(url.toString(), {});

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
        if (this.showLikedImages) {
            // If we're already showing liked images, go back to regular view
            this.showLikedImages = false;
            this.loadCategory();
        } else {
            this.loadLikedImagesView();
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
