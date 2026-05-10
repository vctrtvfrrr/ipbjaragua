<template>
  <div v-if="html">
    <h2>Avisos</h2>
    <div
      class="bulletin-announcements"
      v-html="html"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
