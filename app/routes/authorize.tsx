import { redirect } from "react-router";

import type { Route } from "./+types/authorize";
import { DropboxService } from "~/services/dropbox";

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    { title: `${data.title} | ${data.error}` },
    { name: "description", content: data.error_description },
  ];
};

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const dropbox = new DropboxService(
    context.cloudflare.env.DROPBOX_APP_KEY,
    context.cloudflare.env.DROPBOX_APP_SECRET,
    context.cloudflare.env.TOKEN
  );

  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return {
      error: "Missing code",
      error_description: "The authorization code is missing.",
      title: context.cloudflare.env.VITE_SITE_TITLE,
    };
  }

  const token = await dropbox.getToken(code, request.url);

  if ("access_token" in token) {
    return redirect("/home");
  }

  return {
    error: token.error,
    error_description: token.error_description,
    title: context.cloudflare.env.VITE_SITE_TITLE,
  };
};

export default function Authorize({ loaderData }: Route.ComponentProps) {
  if (!loaderData.error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen">
        <h1 className="text-2xl text-green-500">Success</h1>
        <p>Authorization successful!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h1 className="text-2xl text-red-500">Error</h1>
      <p>{loaderData.error}</p>
      <p>{loaderData.error_description}</p>
    </div>
  );
}
