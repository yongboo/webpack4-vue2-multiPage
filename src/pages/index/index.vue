<template>
  <div>
    <p class='index'>Index Page</p>
    <p v-text='count'></p>
    <button @click="add">add count</button>
  </div>
</template>
<script>

import { mapGetters, mapActions } from 'vuex';
export default {
  name: 'index',
  computed: {
    ...mapGetters(['count'])
  },
  methods: {
    ...mapActions([
      'addCount'
    ]),
    add(){
      this.addCount({num: 10});
    }
  }

};
</script>
<style lang="scss">
.index {
  font-size: 24px;
  color: red;
}

</style>
