import { createApp } from 'vue';
import BootstrapVueNext from 'bootstrap-vue-next';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import './style.css';

import App from './App.vue';

createApp(App).use(BootstrapVueNext).mount('#app');
