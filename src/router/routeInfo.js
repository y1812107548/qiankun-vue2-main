// import { $t } from '@/lang/static'
import Layout from '@/components/layout/layout'
// import MicroLayout from '../views/layout/micro'
// import { isCloud, isProd } from '@/utils'

export const constantRouterInfo = [
  {
    path: '/404',
    component: () => import('@/views/errorPage/404'),
    hidden: true
  },
  {
    path: '/401',
    component: Layout,
    hidden: true,
    redirect: '/401/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/errorPage/401')
      }
    ]
  },
  {
    path: '',
    component: Layout,
    redirect: 'home-page',
    hidden: true,
    children: [
      {
        path: 'home-page',
        component: () =>import('@/views/homePage'),
        name: 'home-page',
        meta: {
          title: '欢迎页面',
          icon: 'callcenter',
          noCache: true
        }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path:'/about',
    component:Layout,
    name:'micro-about',
    meta:{
      title:'关于我们',
      isMicro:true
    }
  },
  {
    path:'/order',
    component:Layout,
    name:'micro-order',
    meta:{
      title:'工单',
      isMicro:true
    },
    children:[
      {
        path:'list',
        name:'micro-list',
        meta:{
          title:'工单列表',
          isMicro:true
        }
      }
    ]
  }
]
