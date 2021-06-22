window.onload = () => {
    const app = Vue.createApp({
        template: `<test />`
    })
    app.component('test', {
        template: `
            <h1>{{ title }}</h1>
            <input type="text" v-model="message"/>
        `,
        setup() {
            const message = Vue.ref('Hello World')
            const title = Vue.computed(() => message.value)
            return {
                message,
                title,
            }
        }
    })
    app.mount('#app')
}