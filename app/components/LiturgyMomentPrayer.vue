<template>
  <strong>{{ description }}</strong>
</template>

<script setup lang="ts">
defineProps<{ description: string | null }>();
</script>
