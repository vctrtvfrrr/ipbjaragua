<template>
  <div class="min-h-screen">
    <NuxtLoadingIndicator />
    <header class="border-b border-gray-200">
      <div class="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6 sm:py-5">
        <SiteHeader />
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
