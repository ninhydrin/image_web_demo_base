<template>
<div>
    <h1>{{ title }}</h1>
    <input type="text" v-model="message"/>
</div>
</template>

<script>
export default Vue.defineComponent({
  name: 'HelloWorld',
  setup(){
    const message = Vue.ref('Hello World')
    const title = Vue.computed(() => message.value)
    return {
        message,
        title,
    }
  }
});
</script>
