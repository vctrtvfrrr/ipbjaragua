<template>
  <p v-if="description">{{ description }}</p>
  <BiblePassageBlock
    v-for="(passage, i) in scripturePassages ?? []"
    :key="i"
    :passage="passage"
  />
</template>

<script setup lang="ts">
import type { ScripturePassage } from '~~/shared/liturgy';
import BiblePassageBlock from './BiblePassageBlock.vue';

defineProps<{ description: string | null; scripturePassages: ScripturePassage[] | null }>();
</script>
