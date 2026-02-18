import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { type RouterMetaData } from "@/types/user";
import { useAuth } from "@/stores/auth";

const routes: Array<RouteRecordRaw & { meta: RouterMetaData }> = [
  {
    path: "/",
    name: "login",
    component: () => import("@/views/general_view/Login.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/views/Dashboard.vue"),
    meta: { authRequired: true, userType: ["Any"] },
  },
  {
    path: "/manufacturing-orders",
    name: "manufacturing-orders",
    component: () => import("@/views/ManufacturingOrders.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/projects",
    name: "projects",
    component: () => import("@/views/Projects.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/labs",
    name: "labs",
    component: () => import("@/views/Labs.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/universities",
    name: "universities",
    component: () => import("@/views/Universities.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  
  {
    path: "/user-profile",
    name: "user-profile",
    component: () => import("@/views/UserProfile.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/manufacturing-order-info/:id",
    name: "manufacturing-order-info",
    component: () => import("@/views/ManufacturingOrderInfo.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/notification",
    name: "notification",
    component: () => import("@/views/Notification.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/project-info/:id",
    name: "project-info",
    component: () => import("@/views/ProjectInfo.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/university-info/:id",
    name: "university-info",
    component: () => import("@/views/UniversityInfo.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
  {
    path: "/lab-info/:id",
    name: "lab-info",
    component: () => import("@/views/LabInfo.vue"),
    meta: { authRequired: false, userType: ["Any"] },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuth();


  if (to.name === "login" && auth.isAuthenticated) {

    next({ name: "dashboard" });
  }
  if (to.name !== "login" && !auth.isAuthenticated) {
    next({ name: "login" });
  }
  next();
});

export default router;
