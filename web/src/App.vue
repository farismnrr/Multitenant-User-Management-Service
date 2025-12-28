<script setup>
import { RouterView } from 'vue-router'
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
