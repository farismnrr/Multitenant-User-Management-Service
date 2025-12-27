<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
// Keep Login and Register pages alive to preserve animation state
const isAuthPage = computed(() => route.meta.guestOnly === true)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive :include="['Login', 'Register']">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<style>
/* 
  Global layout logic specific to the Vue App wrapper.
  Most styles are in style.css 
*/
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
