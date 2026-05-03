<template>
  😱 ERROR!
  <p>{{ error }}</p>
</template>

<script lang="ts" setup>
import type { NuxtError } from 'nuxt/app';
import { onMounted } from 'vue';

const props = withDefaults(defineProps<{ error?: NuxtError }>(), {
  error: () => ({}) as NuxtError,
});

onMounted(() => {
  console.error(props.error);
});
</script>
