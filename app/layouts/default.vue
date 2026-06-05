<template>
  <div>
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #left>
        <SiteHeader />
      </template>
    </UHeader>
    <UMain>
      <slot />
    </UMain>
  </div>
</template>
