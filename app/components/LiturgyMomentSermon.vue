<template>
  <strong v-if="description">{{ description }}</strong>
  <p v-if="sermonSpeaker">{{ sermonSpeaker }}</p>
  <BiblePassageBlock
    v-for="(passage, i) in scripturePassages ?? []"
    :key="i"
    :passage="passage"
  />
</template>

<script setup lang="ts">
import type { ScripturePassage } from '~~/shared/liturgy';

defineProps<{
  description: string | null;
  sermonSpeaker: string | null;
  scripturePassages: ScripturePassage[] | null;
}>();
</script>
