import type { Route } from "./+types/home";
import Index from "~/components";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Drobox Indexer" },
    { name: "description", content: "Welcome to Dropbox Indexer!" },
  ];
}

type LoaderDataType = {
  appKey: string;
  appSecret: string;
  refreshToken: string;
};

export function loader({ context }: Route.LoaderArgs): LoaderDataType {
  return {
    appKey: context.cloudflare.env.APP_KEY,
    appSecret: context.cloudflare.env.APP_SECRET,
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
            href={
              "https://www.dropbox.com/oauth2/authorize?client_id=qy1yfn7mclvybv9&response_type=code&token_access_type=offline"
            }
            className="text-blue-500
        "
          >
            Link
          </a>{" "}
          to authorize your dropbox
        </section>
      ) : (
        <section>{<Index />}</section>
      )}
    </div>
  );
}
