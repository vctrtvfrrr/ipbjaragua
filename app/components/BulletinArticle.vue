<template>
  <<<<<<< Updated upstream
  <div
    v-if="html"
    class="bulletin-article"
    v-html="html"
  />
  =======
  <div
    v-if="html"
    class="bulletin-article"
    v-html="html"
  />
  >>>>>>> Stashed changes
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
