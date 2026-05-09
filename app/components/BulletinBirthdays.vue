<template>
  <div v-if="html">
    <h2>Aniversariantes</h2>
    <<<<<<< Updated upstream
    <div
      class="bulletin-birthdays"
      v-html="html"
    />
    =======
    <div
      class="bulletin-birthdays"
      v-html="html"
    />
    >>>>>>> Stashed changes
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ html?: string }>(), { html: '' });
</script>
