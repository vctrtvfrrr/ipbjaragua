<template>
  <template
    v-for="(line, i) in lines"
    :key="i"
  >
    <br v-if="i > 0" />{{ line }}
  </template>
</template>

<script setup lang="ts">
const props = defineProps<{ text: string }>();
const lines = computed(() => props.text.split('\n'));
</script>
