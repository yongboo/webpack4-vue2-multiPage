import Vue from "vue";
import Tpl from "./index.vue";
import "@style/lib/main.scss";

new Vue({
  render: h => h(Tpl),
}).$mount("#app");