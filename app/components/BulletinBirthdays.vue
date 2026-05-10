<template>
  <div v-if="html">
    <h2>Aniversariantes</h2>
    <div
      class="bulletin-birthdays"
      v-html="html"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
