<template>
  <div class="container">
    <h1>タイトル</h1>
    <Mask/>
  </div>
</template>

<style scoped>

</style>

<script>
import Mask from "./image_mask.vue";

export default Vue.defineComponent({
  name: "Demo",
  components: {
    Mask
  },
  setup(){
        Vue.onMounted(()=>{
    })
    return {}
  }
})
</script>
