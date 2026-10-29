import { createRouter, createWebHistory } from 'vue-router'
import { applyLanQuery } from './i18n'
import { useAuthStore } from './stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/Login.vue'), meta: { tab: false } },
    { path: '/', name: 'account', component: () => import('./views/Home.vue'), meta: { tab: 'account' } },
    { path: '/wealth', name: 'wealth', component: () => import('./views/Wealth.vue'), meta: { tab: 'wealth' } },
    { path: '/wealth/detail', name: 'wealthDetail', component: () => import('./views/WealthDetail.vue'), meta: { tab: false } },
    { path: '/wealth/buy', name: 'wealthBuy', component: () => import('./views/WealthBuy.vue'), meta: { tab: false } },
    { path: '/funds', name: 'funds', component: () => import('./views/Funds.vue'), meta: { tab: 'funds' } },
    { path: '/rights', name: 'rights', component: () => import('./views/Rights.vue'), meta: { tab: 'rights' } },
    { path: '/mine', name: 'mine', component: () => import('./views/Mine.vue'), meta: { tab: 'mine' } },
    { path: '/transactions', component: () => import('./views/Transactions.vue'), meta: { tab: false } },
    { path: '/cards', component: () => import('./views/Cards.vue'), meta: { tab: false } },
    { path: '/newbie', component: () => import('./views/Newbie.vue'), meta: { tab: false } },
    { path: '/invite', component: () => import('./views/Invite.vue'), meta: { tab: false } },
    { path: '/transfer', component: () => import('./views/Transfer.vue'), meta: { tab: false } },
    { path: '/transfer/form', component: () => import('./views/TransferForm.vue'), meta: { tab: false } },
    { path: '/transfer-in', component: () => import('./views/TransferIn.vue'), meta: { tab: false } },
    { path: '/loans', component: () => import('./views/Loans.vue'), meta: { tab: false } },
    { path: '/points', component: () => import('./views/Points.vue'), meta: { tab: false } },
    { path: '/notices', component: () => import('./views/Notices.vue'), meta: { tab: false } },
    { path: '/security', component: () => import('./views/Security.vue'), meta: { tab: false } },
    { path: '/feedback', component: () => import('./views/Feedback.vue'), meta: { tab: false } },
    { path: '/feedback/list', component: () => import('./views/FeedbackList.vue'), meta: { tab: false } },
    { path: '/feedback/:id', component: () => import('./views/FeedbackDetail.vue'), meta: { tab: false } },
    { path: '/payees', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'payees' } },
    { path: '/orders', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'orders' } },
    { path: '/schedule', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'schedule' } },
    { path: '/batch', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'batch' } },
    { path: '/fx', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'fx' } },
    { path: '/kyc', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'kyc' } },
    { path: '/pay', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'pay' } },
    { path: '/bills', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'bills' } },
    { path: '/holdings', component: () => import('./views/Desk.vue'), meta: { tab: false, desk: 'holdings' } },
    { path: '/result', component: () => import('./views/Result.vue'), meta: { tab: false } },
    { path: '/ledger', redirect: '/transactions' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  applyLanQuery(to.query)
  const auth = useAuthStore()
  const lanQuery = {}
  if (to.query.lan != null) lanQuery.lan = to.query.lan
  if (to.query.lang != null) lanQuery.lang = to.query.lang
  if (to.path !== '/login' && !auth.token) {
    return { path: '/login', query: lanQuery }
  }
  if (to.path === '/login' && auth.token) {
    return { path: '/', query: lanQuery }
  }
})

export default router
