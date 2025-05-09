<script lang="ts">
    // Using Svelte 5 runes for reactivity
    let { children } = $props();
    import "../app.css"
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    import { getGalleryState, setGalleryState } from '$lib/components/GalleryState.svelte';

    setGalleryState();
    const galleryState = getGalleryState();

    onMount(() => {

        // Initialize gallery
        galleryState.init();

        // Cleanup function for timers and event listeners
        return () => {
            if (galleryState.autoSlideIntervalId) clearInterval(galleryState.autoSlideIntervalId);
            if (galleryState.controlsTimeoutId) clearTimeout(galleryState.controlsTimeoutId);
            if (galleryState.inactivityTimeoutId) clearTimeout(galleryState.inactivityTimeoutId);
            if (galleryState.overlayTimeoutId) clearTimeout(galleryState.overlayTimeoutId);
            if (galleryState.progressIntervalId) clearInterval(galleryState.progressIntervalId);
        };
    });

</script>

<div class="bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-300 main-container">
    <!-- Help Overlay -->
    {#if galleryState.showHelp}
        <div class="help-overlay" onclick={(e) => { e.stopPropagation(); galleryState.showHelp = false }}>
            <div class="help-content">
                <h2 class="mb-4 font-bold text-2xl text-center">Keyboard Shortcuts</h2>
                <table class="shortcuts-table">
                    <tbody>
                        <tr>
                            <td><span class="key">←</span></td>
                            <td>Previous image</td>
                        </tr>
                        <tr>
                            <td><span class="key">→</span></td>
                            <td>Next image</td>
                        </tr>
                        <tr>
                            <td><span class="key">Enter</span></td>
                            <td>Open current image link</td>
                        </tr>
                        <tr>
                            <td><span class="key">↑</span></td>
                            <td>Previous category</td>
                        </tr>
                        <tr>
                            <td><span class="key">↓</span></td>
                            <td>Next category</td>
                        </tr>
                        <tr>
                            <td><span class="key">Page Up</span></td>
                            <td>Previous media source</td>
                        </tr>
                        <tr>
                            <td><span class="key">Page Down</span></td>
                            <td>Next media source</td>
                        </tr>
                        <tr>
                            <td><span class="key">D</span></td>
                            <td>Toggle image description</td>
                        </tr>
                        <tr>
                            <td><span class="key">P</span></td>
                            <td>Pause/resume slideshow</td>
                        </tr>
                        <tr>
                            <td><span class="key">F</span></td>
                            <td>Toggle fullscreen</td>
                        </tr>
                        <tr>
                            <td><span class="key">Esc</span></td>
                            <td>Exit fullscreen</td>
                        </tr>
                        <tr>
                            <td><span class="key">H</span></td>
                            <td>Toggle help (this screen)</td>
                        </tr>
                        <tr>
                            <td><span class="key">/</span></td>
                            <td>Open search {#if !galleryState.isSearchAuthorized}<span class="text-yellow-300">(requires token)</span>{/if}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="opacity-70 mt-6 text-sm text-center">
                    Click anywhere outside this window to close
                </div>
            </div>
        </div>
    {/if}

    <!-- Error message -->
    {#if galleryState.error}
        <div class="relative bg-red-100 dark:bg-red-900 mb-4 px-4 py-3 border border-red-400 dark:border-red-700 rounded text-red-700 dark:text-red-300">
            <span>{galleryState.error}</span>
        </div>
    {/if}

    <!-- Search Overlay -->
    {#if galleryState.showSearchOverlay}
        <div class="search-overlay"
        onclick={() => galleryState.closeSearchOverlay()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        tabindex="0"
        onkeydown={(e) => e.key === 'Escape' && galleryState.closeSearchOverlay()}
        >
            <div class="search-content"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.key === 'Escape' && galleryState.closeSearchOverlay()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            tabindex="0"
            >
                <button onclick={() => galleryState.closeSearchOverlay()} class="close-button" aria-label="Close search">×</button>
                <h3 class="mb-4 font-semibold text-xl text-center">Search Gallery</h3>

                <!-- Token input (shown when not authorized) -->
                {#if !galleryState.isSearchAuthorized}
                    <div class="mb-4">
                        <form onsubmit={() => galleryState.verifyToken()}>
                        <label class="block mb-2 text-sm" for="searchToken">Enter token to access search:</label>
                        <input type="text"
                               id="searchToken"
                               bind:value={galleryState.searchToken}
                               onkeydown={(e) => e.key === 'Enter' && galleryState.verifyToken()}
                               placeholder="Enter token"
                               class="bg-white dark:bg-gray-200 px-4 py-2 rounded w-full text-gray-900">
                        </form>
                        {#if galleryState.tokenError}
                            <div class="mt-2 text-red-400 text-sm">{galleryState.tokenError}</div>
                        {/if}

                        <div class="flex justify-center mt-4">
                            <button onclick={() => galleryState.verifyToken()}
                                    class="search-button">
                                <span class:hidden={galleryState.loading}>Verify</span>
                                <span class:hidden={!galleryState.loading}>Verifying...</span>
                            </button>
                        </div>
                    </div>
                {:else}
                    <input type="text"
                           bind:value={galleryState.searchQuery}
                           onkeydown={(e) => e.key === 'Enter' && galleryState.performSearch()}
                           placeholder="e.g., Van Gogh starry night, APOD today, Reddit cats..."
                           class="bg-white dark:bg-gray-200 px-4 py-2 rounded w-full text-gray-900">

                    <div class="flex justify-center mt-4">
                        <button onclick={() => galleryState.performSearch()} class="search-button">
                            <span class:hidden={galleryState.loading}>Search</span>
                            <span class:hidden={!galleryState.loading}>Searching...</span>
                        </button>
                    </div>
                {/if}

                {#if galleryState.error}
                    <div class="mt-4 text-red-400 text-center">{galleryState.error}</div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Message overlay that will automatically disappear -->
    {#if galleryState.showMessageOverlay}
        <div class="z-[110] fixed inset-0 flex justify-center items-center"
             transition:fade={{duration: 300}}>
            <div class="bg-black bg-opacity-80 shadow-lg px-8 py-6 rounded-xl max-w-md text-white text-center">
                <div class="text-lg">{galleryState.overlayMessage}</div>
            </div>
        </div>
    {/if}

    <!-- Gallery section -->
    {#if galleryState.items.length > 0}
        <div class="gallery-wrapper">
            <!-- Exit fullscreen button for mobile -->
            <button
                class:hidden={!galleryState.hideToolbar}
                onclick={() => galleryState.exitFullscreen()}
                class="exit-fullscreen-btn nav-button"
                aria-label="Exit fullscreen">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"
                    class:hidden={!galleryState.isFullscreen && !galleryState.hideToolbar}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <!-- Image container -->
            <div class="image-container">
                <!-- Loading state -->
                <div class:hidden={!galleryState.loading}
                    class="z-10 absolute flex justify-center items-center bg-black bg-opacity-50 w-full h-full transition-all duration-300">
                    <div
                        class="border-gray-700 dark:border-gray-300 border-b-2 rounded-full w-12 h-12 animate-spin">
                    </div>
                </div>

                <div class="z-9 relative flex justify-center items-center w-full h-full">
                    <!-- Media source overlay -->
                    <div
                        transition:fade={{duration: 300}}
                        class="top-1/2 left-1/2 z-9 fixed flex flex-col justify-center items-center bg-black bg-opacity-50 shadow-lg px-8 py-4 rounded-xl font-semibold text-white text-center transition-opacity -translate-x-1/2 -translate-y-1/2 duration-300 nav-button transform"
                        class:visible={galleryState.showMediaSourceOverlay}
                        class:opacity-0={!galleryState.showMediaSourceOverlay}
                        class:hidden={galleryState.isMobile}>
                        {@html galleryState.mediaSourceOverlayText}
                    </div>

                    <!-- Current image -->
                    {#if galleryState.currentItem}
                        <img
                            src={galleryState.currentItem.image_url}
                            alt={galleryState.currentItem.title}
                            width="100%"
                            height="100%"
                            class="transition-all duration-500 gallery-image"
                            onerror={galleryState.handleImageError}
                            transition:fade={{duration: 500}}>
                    {/if}

                    <!-- Mobile navigation areas -->
                    <button class="mobile-nav-area mobile-nav-prev"
                        onclick={() => galleryState.prevItem()}
                        onkeydown={(e) => e.key === 'Enter' && galleryState.prevItem()}
                        aria-label="Previous image"
                        ></button>
                    <button class="mobile-nav-area mobile-nav-next"
                        onclick={() => galleryState.nextItem()}
                        onkeydown={(e) => e.key === 'Enter' && galleryState.nextItem()}
                        aria-label="Next image"></button>

                    <!-- Category navigation - Up arrow -->
                    <div class="flex items-center category-nav-button category-up nav-button"
                         class:hidden={galleryState.categories.length <= 1}>
                        <button
                            onclick={() => galleryState.prevCategory()}
                            class="flex items-center bg-black bg-opacity-50 hover:bg-opacity-80 px-4 py-2 rounded-full text-white transition-all duration-300"
                            aria-label="Previous category">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-5 h-5"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                            <span class="ml-2">{galleryState.getPrevCategoryName()}</span>
                        </button>
                    </div>

                    <!-- Category navigation - Down arrow with refresh -->
                    <div class="flex items-center category-nav-button category-down nav-button"
                         class:hidden={galleryState.categories.length <= 1}>
                        <button
                            onclick={() => galleryState.nextCategory()}
                            class="flex items-center bg-black bg-opacity-50 hover:bg-opacity-80 px-4 py-2 rounded-l-full text-white transition-all duration-300"
                            class:rounded-r-full={galleryState.selectedCategory !== 'random-artist'}
                            aria-label="Next category">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-5 h-5"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            <span class="ml-2">{galleryState.getNextCategoryName()}</span>
                        </button>

                        <!-- Refresh button for Random Artist category -->
                        <button
                            onclick={() => galleryState.refreshRandomArtist()}
                            class="bg-black bg-opacity-50 hover:bg-opacity-80 px-3 py-[10px] border-white-600 border-l rounded-r-full text-white transition-all duration-300"
                            class:hidden={galleryState.selectedCategory !== 'random-artist'}
                            title="Refresh random artist"
                            aria-label="Refresh random artist">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-5 h-5"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <!-- Previous image button -->
                    <button
                        onclick={() => galleryState.prevItem()}
                        class="bg-black bg-opacity-50 hover:bg-opacity-80 p-2 rounded-full text-white transition-all duration-300 image-nav-button image-nav-prev nav-button"
                        aria-label="Previous image">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-6 h-6"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round" stroke-width="2"
                                d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <!-- Next image button -->
                    <button
                        onclick={() => galleryState.nextItem()}
                        class="bg-black bg-opacity-50 hover:bg-opacity-80 p-2 rounded-full text-white transition-all duration-300 image-nav-button image-nav-next nav-button"
                        aria-label="Next image">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-6 h-6"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round" stroke-width="2"
                                d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <!-- Title overlay -->
                <div class="title-overlay">
                    <div class="flex flex-row justify-between items-center">
                        {#if galleryState.currentItem}
                            <a href={galleryState.currentItem.link}
                                target="_blank"
                                class="flex-1 font-semibold hover:underline basis-1/2">
                                <h2 class="font-semibold">{galleryState.currentItem.title}</h2>
                            </a>
                        {/if}
                        <div class:hidden={!galleryState.selectedCategory}
                            class:mobile-truncate={galleryState.selectedMediaSource !== 'wikiart'}
                            class="bg-black bg-opacity-50 ml-3 px-3 py-1 rounded-full text-sm">
                            <span>{galleryState.getCurrentCategoryName()}</span>
                        </div>
                    </div>

                    <!-- Description overlay -->
                    {#if galleryState.showDescription && galleryState.currentItem?.description}
                        <div
                            transition:fade
                            class="relative max-h-[10vh] overflow-y-auto text-sm hide-scrollbar">
                            <div>{@html galleryState.currentItem.description}</div>
                        </div>
                    {/if}
                </div>

                <!-- Progress bar -->
                <div class="progress-container">
                    <div class="progress-bar" bind:this={galleryState.progressBar}></div>
                </div>
            </div>

            <!-- Pagination and controls -->
            <div
                class="flex justify-center items-center text-sm control-bar"
                class:hidden={galleryState.hideToolbar}>

                <!-- Clustered selectors-->
                <div class="flex flex-shrink items-center space-x-1 md:space-x-2">
                    <!-- Media source selector -->
                    <div class="flex justify-center items-center media-source-selector">
                        <select
                            bind:value={galleryState.selectedMediaSource}
                            onchange={() => galleryState.changeMediaSource()}
                            class="bg-white dark:bg-dark-surface px-4 py-2 border-gray-300 border-unset dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[50vw] md:max-w-none text-gray-800 dark:text-dark-text">
                            {#each galleryState.mediaSources as source (source.id)}
                                <option value={source.id}>{source.name}</option>
                            {/each}
                        </select>
                    </div>
                    <!-- Category selector -->
                    <div class="flex flex-shrink justify-center items-center category-selector">
                        <select
                            bind:value={galleryState.selectedCategory}
                            onchange={() => galleryState.loadCategory()}
                            class="bg-white dark:bg-dark-surface px-4 py-2 border-gray-300 border-unset dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:max-w-[30vw] xl:max-w-none text-gray-800 dark:text-dark-text">
                            {#each galleryState.categories as category (category.id)}
                                <option value={category.id} selected={category.id === (galleryState.selectedCategory || galleryState.categories[0].id)}>{category.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="flex flex-grow justify-center items-center">
                    <span class="text-gray-600 dark:text-gray-400 text-sm">
                        <span>{galleryState.currentIndex + 1}</span> of <span>{galleryState.items.length}</span>
                    </span>
                </div>

                <!-- Clustered controls group -->
                <div class="flex justify-center items-center space-x-1 md:space-x-2">
                    <!-- Search Button (Triggers Overlay) -->
                    <button onclick={() => galleryState.openSearchOverlay()}
                            title="Search ( / )"
                            aria-label="Search gallery"
                            class:hidden={!galleryState.isSearchAuthorized}
                            class="hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full focus:outline-none text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </button>

                    <!-- Pause/Resume button -->
                    <button
                        onclick={() => galleryState.togglePause()}
                        aria-label="Toggle slideshow"
                        title="Pause/Resume slideshow"
                        class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none"
                        class:text-blue-500={galleryState.isPaused}
                        class:text-gray-600={!galleryState.isPaused}
                        class:dark:text-gray-400={!galleryState.isPaused}>
                        <svg class:hidden={galleryState.isPaused}
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-5 h-5"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2" d="M10 9v6m4-6v6" />
                        </svg>
                        <svg class:hidden={!galleryState.isPaused}
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-5 h-5"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                    </button>

                    <!-- HD toggle button -->
                    <button
                        onclick={() => galleryState.toggleHD()}
                        aria-label="Toggle HD quality"
                        title="Toggle HD images"
                        class:hidden={!galleryState.hdSupported}
                        class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none"
                        class:text-blue-500={galleryState.isHD}
                        class:text-gray-600={!galleryState.isHD}
                        class:dark:text-gray-400={!galleryState.isHD}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"
                            height="24" viewBox="0 0 24 24"><path
                                fill="currentColor"
                                d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m4.5 8.25V9H6v6h1.5v-2.25h2V15H11V9H9.5v2.25zm7-.75H16a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1.5zM13 9v6h3a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" /></svg>
                    </button>

                    <!-- Fullscreen toggle button -->
                    <button
                        onclick={() => galleryState.toggleFullscreen()}
                        aria-label="Toggle fullscreen"
                        title="Toggle fullscreen"
                        class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-5 h-5"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                    </button>

                    <!-- Description toggle button -->
                    <button
                        onclick={() => galleryState.showDescription = !galleryState.showDescription}
                        aria-label="Toggle description"
                        title="Toggle description"
                        class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none"
                        class:text-blue-500={galleryState.showDescription}
                        class:text-gray-600={!galleryState.showDescription}
                        class:dark:text-gray-400={!galleryState.showDescription}>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="w-5 h-5"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>

                    <!-- Light/Dark mode toggle -->
                    <div class="flex items-center space-x-1">
                        <span class="text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round"
                                    stroke-linejoin="round" stroke-width="2"
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </span>
                        <label class="toggle-switch">
                            <input type="checkbox" onclick={() => galleryState.toggleDarkMode()} class="opacity-0 w-0 h-0"
                                checked={galleryState.darkMode}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round"
                                    stroke-linejoin="round" stroke-width="2"
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            <!-- No items message -->
            <div class:hidden={galleryState.loading || galleryState.items.length > 0 || galleryState.error}
                class="p-8 text-gray-600 dark:text-gray-400 text-center">
                No images found in the feed.
            </div>

            <!-- Main content slot -->
        </div>
    {/if}
</div>


<style>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
.main-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: -webkit-fill-available;
    width: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
.gallery-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
    position: relative;
}
.image-container {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.gallery-image {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    position: relative;
}
/* Help overlay */
.help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    overflow-y: auto;
}
.help-content {
    max-width: 600px;
    width: 100%;
}
.shortcuts-table {
    width: 100%;
    margin-top: 1rem;
    border-collapse: separate;
    border-spacing: 0 0.75rem;
}
.shortcuts-table td {
    padding: 0.25rem 0.5rem;
}
.shortcuts-table td:first-child {
    padding-right: 2rem;
    text-align: right;
    white-space: nowrap;
}
.key {
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-weight: bold;
    display: inline-block;
    text-align: center;
    min-width: 1.5rem;
}
/* Search overlay */
.search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center vertically */
    align-items: center;
    padding: 2rem;
}
.search-content {
    background-color: #1e1e1e; /* Dark surface */
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px; /* Limit width */
    width: 100%;
    position: relative; /* For close button */
}
.search-overlay input[type="text"],
.search-overlay input[type="password"] {
    color: #121212; /* Dark text for input */
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border: 1px solid #555;
    margin-bottom: 1rem;
}
.search-overlay button {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
}
.search-overlay .search-button {
    background-color: #3b82f6; /* Blue */
    color: white;
    border: none;
}
.search-overlay .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.5rem;
    cursor: pointer;
}
/* Exit fullscreen button for mobile */
.exit-fullscreen-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}
.exit-fullscreen-btn.visible {
    opacity: 1;
    visibility: visible;
}
/* Navigation button styling */
.nav-button {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 20;
}
.nav-button.visible {
    opacity: 1;
    visibility: visible;
}
/* Progress bar styling */
.progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 4px;
    background-color: rgba(0, 0, 0, 0);
    z-index: 10;
}
.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    opacity: 0.2;
    transition: width linear;
    width: 0;
}
.dark .progress-container {
    background-color: rgba(255, 255, 255, 0);
}
/* Category navigation buttons */
.category-nav-button {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    visibility: hidden;
    max-width: 80%;
}
.category-nav-button span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 150px;
}
@media (min-width: 640px) {
    .category-nav-button span {
        max-width: none;
    }
}
.category-nav-button.visible {
    visibility: visible;
}
.category-up {
    top: 15%;
}
.category-down {
    bottom: 15%;
}
/* Title overlay */
.title-overlay {
    font-family: 'Domine', serif;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0,0,0,0.6);
    padding: 1rem;
    color: white;
    z-index: 10;
}
/* Mobile title truncation */
.mobile-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}
@media (min-width: 640px) {
    .mobile-truncate {
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
    }
}
/* Image navigation buttons */
.image-nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
}
.image-nav-button.visible {
    visibility: visible;
}
.image-nav-prev {
    left: 10px;
}
.image-nav-next {
    right: 10px;
}
/* Mobile navigation areas */
.mobile-nav-area {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 25%;
    z-index: 10;
    display: none;
}
.mobile-nav-prev {
    left: 0;
}
.mobile-nav-next {
    right: 0;
}
@media (max-width: 640px) {
    .mobile-nav-area {
        display: block;
    }
    /* Hide the navigation buttons on mobile since we have the touch areas */
    .image-nav-button {
        display: none;
    }
}
/* Hide scrollbar */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
/* Toggle switch styling */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
}
.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
}
.toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}
input:checked + .toggle-slider {
    background-color: #3b82f6;
}
input:checked + .toggle-slider:before {
    transform: translateX(20px);
}

/* Control bar at bottom */
.control-bar {
    font-family: 'Domine', serif;
    padding: 0.75rem;
    flex-shrink: 0;
    border-top: 1px solid rgba(0,0,0,0.1);
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}
.dark .control-bar {
    border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
