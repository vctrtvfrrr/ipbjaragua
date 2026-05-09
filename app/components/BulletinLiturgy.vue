<template>
  <div v-if="html">
    <h2>Liturgia do Culto</h2>
    <<<<<<< Updated upstream
    <div
      class="bulletin-liturgy"
      v-html="html"
    />
    =======
    <div
      class="bulletin-liturgy"
      v-html="html"
    />
    >>>>>>> Stashed changes
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
