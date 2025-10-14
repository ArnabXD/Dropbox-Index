import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "404: not found" }];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <div>404</div>;
}
