import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
  ],
})

// Garde de navigation
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    // Si l'utilisateur est déjà connecté et essaie d'accéder à login/register, le rediriger vers l'accueil
    next({ name: 'home' });
  } else {
    // Sinon, autoriser la navigation
    next();
  }
});

export default router
