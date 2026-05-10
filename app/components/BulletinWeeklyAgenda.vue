<template>
  <div v-if="html">
    <h2>Agenda Semanal</h2>
    <div
      class="bulletin-weekly-agenda"
      v-html="html"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
