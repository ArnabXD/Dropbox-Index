import FolderIndex from "~/components/listPage";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Drobox Indexer" },
    { name: "description", content: "Welcome to Dropbox Indexer!" },
  ];
}

type LoaderDataType = {
  authUrl: string;
  appKey: string;
  appSecret: string;
  refreshToken: string;
};

export function loader({ context }: Route.LoaderArgs): LoaderDataType {
  return {
    appKey: context.cloudflare.env.APP_KEY,
    appSecret: context.cloudflare.env.APP_SECRET,
    authUrl: context.cloudflare.env.AUTH_URL,
    refreshToken: context.cloudflare.env.REFRESH_TOKEN,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      {!loaderData.refreshToken ? (
        <section>
          Go to this{" "}
          <a
            href={loaderData.authUrl}
            className="text-blue-500
        "
          >
            Link
          </a>{" "}
          to authorize your dropbox
        </section>
      ) : (
        <section>{<FolderIndex />}</section>
      )}
    </div>
  );
}
