<template>
  <div
    v-if="markdown"
    class="article-content"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = withDefaults(defineProps<{ markdown?: string }>(), { markdown: '' });

const html = computed(() => marked.parse(props.markdown, { async: false }));
</script>
