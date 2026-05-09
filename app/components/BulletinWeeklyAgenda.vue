<template>
  <div v-if="html">
    <h2>Agenda Semanal</h2>
    <<<<<<< Updated upstream
    <div
      class="bulletin-weekly-agenda"
      v-html="html"
    />
    =======
    <div
      class="bulletin-weekly-agenda"
      v-html="html"
    />
    >>>>>>> Stashed changes
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
