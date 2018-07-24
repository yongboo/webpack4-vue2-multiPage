
const app = {
  state: {
    count: 0
  },
  mutations: {
    ADD_COUNT: (state, payload) => {
      state.count += payload.amount;
    }
  },
  actions: {
    addCount: ({ commit }, payload) => {
      commit('ADD_COUNT', {
        amount: payload.num
      });
    }
  }
};

export default app;
