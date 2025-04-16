import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/setup", "routes/setup.tsx"),
  route("/authorize", "routes/authorize.tsx"),
] satisfies RouteConfig;
