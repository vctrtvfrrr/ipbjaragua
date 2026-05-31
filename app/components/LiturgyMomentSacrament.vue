<template>
  <strong>{{ SACRAMENT_LABELS[sacramentType] }}</strong>
  <p v-if="description">{{ description }}</p>
</template>

<script setup lang="ts">
import { SACRAMENT_LABELS } from '~/utils/liturgy-labels';

defineProps<{ sacramentType: 'baptism' | 'eucharist'; description: string | null }>();
</script>
