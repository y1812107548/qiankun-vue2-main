import { registerMicroApps, start,initGlobalState } from 'qiankun';
registerMicroApps([
  {
    name: 'qk_child',
    // entry: { scripts: ['//localhost:7100/main.js'] },
    entry:'http://localhost:8090',
    container: '#micro-service',
    activeRule: '/#/about',
    loader:loading => {
      console.log('micro',loading);
    }
  },
],
{
  beforeLoad: (app) => console.log('before load', app.name),
  beforeMount: [(app) => console.log('before mount', app.name)],
}
);

// const { onGlobalStateChange,setGlobalState } = initGlobalState({
//   token:'',
//   engineer:null
// })
const state = {
  token:'',
  engineer:''
}

// 初始化 state
const actions = initGlobalState(state);

actions.onGlobalStateChange((state, prev) => {
  // state: 变更后的状态; prev 变更前的状态
  console.log(state, prev);
});
actions.setGlobalState(state);
actions.offGlobalStateChange();

export const microApps = {
  startMicroApps:start
}
