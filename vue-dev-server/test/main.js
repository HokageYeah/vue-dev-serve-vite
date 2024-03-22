import vue from 'vue'
import App from './test.vue'

new vue({
    el: '#app',
    render: h => h(App)
})
// new Vue({
//     render: (h) => h(App),
//   }).$mount("#app");