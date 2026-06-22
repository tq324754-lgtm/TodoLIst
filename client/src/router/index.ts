import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/UserLogin.vue'
import Register from '../views/UserRegister.vue'
import Mine from '../views/Mine.vue'
import { useUserStore } from '../stores/user'
import Statistics from '../views/Statistic.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: 'todo',
          name: 'todo',
          component: () => import('../views/TodoList.vue')
        },
        {
          path: '/mine',
          name: 'mine',
          component: Mine,
        },
        {
          path: '/collection-list',
          name: 'collectionList',
          component: () => import('../views/CollectionList.vue')
        },
        {
          path: '/collection-detail/:id',
          name: 'collectionDetail',
          component: () => import('../views/UserCollection.vue')
        },
        {
          path: '/collection',
          redirect: '/collection-list'
        },
        {
          path: '/statistic',
          name: 'statistic',
          component: () => import('../views/Statistic.vue')
        },
        {
          path: '/target',
          name: 'target',
          component: () => import('../views/Target.vue')
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    // 管理员路由
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'adminDashboard',
          component: () => import('../views/admin/AdminDashboard.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'adminUsers',
          component: () => import('../views/admin/AdminUsers.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'todos',
          name: 'adminTodos',
          component: () => import('../views/admin/AdminDashboard.vue'), // 占位
          meta: { requiresAdmin: true }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to) => {
  const userStore = useUserStore()
  const authRequired = ['/todo', '/mine', '/statistic']

  // 前台需要登录的页面
  if (authRequired.includes(to.path) && !userStore.isLoggedIn) {
    return '/login'
  }

  // 已登录用户访问登录/注册页
  if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    return '/todo'
  }

  // 管理员路由权限校验
  if (to.meta.requiresAdmin) {
    if (!userStore.isLoggedIn) {
      return '/login'
    }
    if (!userStore.isAdmin) {
      return '/todo'
    }
  }
})

export default router
