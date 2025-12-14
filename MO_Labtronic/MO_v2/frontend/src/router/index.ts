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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuth();


  console.log(to.name === "login" , auth.isAuthenticated)
  if (to.name === "login" && auth.isAuthenticated) {

    next({ name: "dashboard" });
  }
  if (to.name !== "login" && !auth.isAuthenticated) {
    next({ name: "login" });
  }
  next();
});

export default router;
