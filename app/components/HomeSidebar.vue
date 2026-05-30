<template>
  <aside class="home-sidebar space-y-8">
    <SidebarBulletin />
    <SidebarAnnouncements />
    <SidebarLiturgies />
  </aside>
</template>

<script setup lang="ts">
import { SidebarBulletin, SidebarAnnouncements, SidebarLiturgies } from '#components';
</script>
