import type { Route } from "./+types/home";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data.title },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    title: context.cloudflare.env.VITE_SITE_TITLE,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <h1>Hi</h1>;
}
