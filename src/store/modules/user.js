const user = {
  state: {
    name: 'hellp world!',
  },

  mutations: {
    CHANGE_NAME: state => {
      state.name = 'hello webpack4-vue2-vuex!';
    }
  },

  actions: {
    changeName: ({commit}) => {
      commit('CHANGE_NAME');
    }
  }
};

export default user;
