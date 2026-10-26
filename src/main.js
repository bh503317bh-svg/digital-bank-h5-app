import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ActionSheet, Button, Cell, CellGroup, Empty, Field, Form, Icon, NavBar, Popup,
  Search, Swipe, SwipeItem, Switch, Tab, Tabs, Tabbar, TabbarItem, Tag, Toast,
  Dialog, showToast, showSuccessToast, showFailToast, showConfirmDialog
} from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
;[
  ActionSheet, Button, Cell, CellGroup, Empty, Field, Form, Icon, NavBar, Popup,
  Search, Swipe, SwipeItem, Switch, Tab, Tabs, Tabbar, TabbarItem, Tag, Toast, Dialog
].forEach((c) => app.use(c))
app.config.globalProperties.$toast = showToast
app.config.globalProperties.$success = showSuccessToast
app.config.globalProperties.$fail = showFailToast
app.config.globalProperties.$confirm = showConfirmDialog
app.mount('#app')
