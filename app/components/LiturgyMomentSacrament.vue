<template>
  <strong>{{ SACRAMENT_LABELS[sacramentType] }}</strong>
  <p v-if="description">{{ description }}</p>
</template>

<script setup lang="ts">
defineProps<{ sacramentType: 'baptism' | 'eucharist'; description: string | null }>();
</script>
