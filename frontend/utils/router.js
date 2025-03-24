import LoginPage from '../pages/LoginPage.js'
import RegisterPage from '../pages/RegisterPage.js'
import AdminDashboardPage from '../pages/AdminDashboardPage.js'
import UserDashboardPage from '../pages/UserDashboardPage.js'
import SubjectChapterPage from '../pages/SubjectChapterPage.js'
import QuizManagementPage from '../pages/QuizManagementPage.js'
import UsersDataPage from '../pages/UsersDataPage.js'
import QuizChallengePage from '../pages/QuizChallengePage.js'
import QuizHistoryPage from '../pages/QuizHistoryPage.js'
import store from './store.js'

const router = new VueRouter({
    routes: [
        { 
            path: '/', 
            redirect: '/login' 
        },
        { 
            path: '/login', 
            component: LoginPage,
            meta: { requiresGuest: true }
        },
        { 
            path: '/register', 
            component: RegisterPage,
            meta: { requiresGuest: true }
        },
        // Admin Routes
    { 
        path: '/users', 
        component: UsersDataPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    { 
        path: '/admin_profile', 
        component: AdminDashboardPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    { 
        path: '/admin_dashboard', 
        component: AdminDashboardPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    { 
        path: '/subjects', 
        component: SubjectChapterPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    { 
        path: '/quiz_management', 
        component: QuizManagementPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    { 
        path: '/users', 
        component: UsersDataPage, 
        meta: { requiresAuth: true, role: 'admin' }
    },
    
    // User Routes
    { 
        path: '/user_dashboard', 
        component: UserDashboardPage, 
        meta: { requiresAuth: true, role: 'user' }
    },
    {
        path: '/user_profile',
        component: UserDashboardPage,
        meta: { requiresAuth: true, role: 'user' }
    },
    { 
        path: '/user_dashboard', 
        component: UserDashboardPage, 
        meta: { requiresAuth: true, role: 'user' }
    },
    { 
        path: '/quiz_challenge', 
        component: QuizChallengePage, 
        meta: { requiresAuth: true, role: 'user' }
    },
    { 
        path: '/quiz_history', 
        component: QuizHistoryPage, 
        meta: { requiresAuth: true, role: 'user' }
    },
    ]
});


router.beforeEach((to, from, next) => {
    const user = store.state.user;
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

    // Handle guest pages
    if (requiresGuest) {
        if (!user) {
            next();
        } else {
            next(user.role === 'admin' ? '/admin_dashboard' : '/user_dashboard');
        }
        return;
    }

    // Handle protected routes
    if (requiresAuth) {
        if (!user) {
            next('/login');
            return;
        }

        const requiredRole = to.meta.role;
        if (requiredRole && user.role !== requiredRole) {
            next(user.role === 'admin' ? '/admin_dashboard' : '/user_dashboard');
            return;
        }
    }

    next();
});

export default router;