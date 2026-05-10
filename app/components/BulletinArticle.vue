<template>
  <div
    v-if="html"
    class="bulletin-article"
    v-html="html"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
