import Vue from 'vue'
import App from './App.vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'
import VueAutosuggest from "vue-autosuggest";
Vue.use(Vuetify)

Vue.use(VueAutosuggest)

new Vue({
  el: '#app',
  render: h => h(App),
  components: {
    VueAutosuggest
  }
})
