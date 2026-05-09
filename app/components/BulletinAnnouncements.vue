<template>
  <div v-if="html">
    <h2>Avisos</h2>
    <<<<<<< Updated upstream
    <div
      class="bulletin-announcements"
      v-html="html"
    />
    =======
    <div
      class="bulletin-announcements"
      v-html="html"
    />
    >>>>>>> Stashed changes
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
