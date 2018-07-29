import Vue from 'vue';
import Tpl from './index.vue';
import store from '../../store';

new Vue({
  store,
  render: h => h(Tpl),
}).$mount('#app');