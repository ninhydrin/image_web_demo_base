window.onload = () => {
    const options = {
        moduleCache: {
            vue: Vue
        },
        async getFile(url) {
            const res = await fetch(url);
            if (!res.ok)
                throw Object.assign(new Error(res.statusText + ' ' + url), { res });
            return {
                getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
            }
        },
        addStyle(textContent) {
            const style = Object.assign(document.createElement('style'), { textContent });
            const ref = document.head.getElementsByTagName('style')[0] || null;
            document.head.insertBefore(style, ref);
        },
    }

    const { loadModule } = window['vue3-sfc-loader'];

    const app = Vue.createApp({
        components: {
            'test': Vue.defineAsyncComponent(() => loadModule('/static/js/test_module.vue', options))
        },
        template: '<test></test>'
    });
    app.mount('#app');
}