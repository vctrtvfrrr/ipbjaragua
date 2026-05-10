<template>
  <div v-if="html">
    <h2>Liturgia do Culto</h2>
    <div
      class="bulletin-liturgy"
      v-html="html"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
