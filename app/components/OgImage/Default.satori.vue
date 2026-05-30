<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '80px',
      backgroundColor: '#0f3d2e',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }"
  >
    <div
      :style="{
        display: 'flex',
        fontSize: '64px',
        fontWeight: 700,
        lineHeight: 1.1,
      }"
    >
      {{ title }}
    </div>
    <div
      v-if="description"
      :style="{ display: 'flex', marginTop: '28px', fontSize: '30px', color: '#cfe3d8', lineHeight: 1.3 }"
    >
      {{ description }}
    </div>
    <div :style="{ display: 'flex', marginTop: 'auto', fontSize: '26px', color: '#9ec4b4' }">IPB de Jaguará do Sul</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title?: string; description?: string }>(), { title: '', description: '' });
</script>
