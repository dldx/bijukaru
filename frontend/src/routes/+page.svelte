<script lang="ts">
   // This file resolves the 404 error by providing a root route
   import { onMount } from 'svelte';

   onMount(() => {
      // Default to the first media source when loading the root page
      window.location.href = '/thisiscolossal';
   });
</script>

<div class="loading-container">
   <div class="loader"></div>
   <p>Loading Bijukaru picture carousel...</p>
</div>

<style>
   .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
   }

   .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3b82f6;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
   }

   @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
   }
</style>