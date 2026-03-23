import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
import VerifyChangeEmailView from '../views/VerifyChangeEmailView.vue'
import ProfileView from '../views/ProfileView.vue'
import MyTripsView from '../views/MyTripsView.vue'
import CreateTripView from '../views/CreateTripView.vue'
import TripDashboardView from '../views/TripDashboardView.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminUsersView from '../views/admin/AdminUsersView.vue'
import AdminTripsView from '../views/admin/AdminTripsView.vue'
import AdminStopsView from '../views/admin/AdminStopsView.vue'
import { isAdminUser } from '../services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/fonctionnalites',
      name: 'features',
      component: () => import('../views/FeaturesView.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmailView
    },
    {
      path: '/verify-change-email',
      name: 'verify-change-email',
      component: VerifyChangeEmailView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/my-trips',
      name: 'my-trips',
      component: MyTripsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/create-trip',
      name: 'create-trip',
      component: CreateTripView,
      meta: { requiresAuth: true }
    },
    {
      path: '/trips/:id',
      name: 'trip-dashboard',
      component: TripDashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/trips/:id/settings',
      name: 'trip-settings',
      component: () => import('../views/TripSettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/trips',
      name: 'admin-trips',
      component: AdminTripsView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/stops',
      name: 'admin-stops',
      component: AdminStopsView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // Legal routes
    { path: '/mentions-legales', name: 'mentions-legales', component: () => import('../views/LegalMentionsView.vue') },
    { path: '/politique-confidentialite', name: 'privacy-policy', component: () => import('../views/PrivacyPolicyView.vue') },
    { path: '/cookies', name: 'cookies', component: () => import('../views/CookiesView.vue') },
    { path: '/rgpd', name: 'gdpr', component: () => import('../views/GdprView.vue') },
  ]
})

router.beforeEach(async (to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken')

  if (to.meta.requiresAdmin) {
    if (!isAuthenticated) {
      next({ name: 'login' })
    } else {
      try {
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
          next({ name: 'home' })
        } else {
          next()
        }
      } catch (error) {
        next({ name: 'home' })
      }
    }
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register' || to.name === 'forgot-password' || to.name === 'reset-password') && isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
