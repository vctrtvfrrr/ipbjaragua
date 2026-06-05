<template>
  <div class="bible-passage">
    <cite>{{ header }}</cite>
    <blockquote v-if="passage.text">
      <NewlineToBr :text="passage.text" />
    </blockquote>
  </div>
</template>

<script setup lang="ts">
import type { ScripturePassage } from '~~/shared/liturgy';

const props = defineProps<{ passage: ScripturePassage }>();
const header = computed(() =>
  props.passage.version ? `${props.passage.reference} (${props.passage.version})` : props.passage.reference,
);
</script>
