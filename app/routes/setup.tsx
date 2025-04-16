import { DropboxService } from "~/services/dropbox";
import type { Route } from "./+types/setup";
import { redirect } from "react-router";

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const dropbox = new DropboxService(
    context.cloudflare.env.DROPBOX_APP_KEY,
    context.cloudflare.env.DROPBOX_APP_SECRET,
    context.cloudflare.env.TOKEN
  );

  const refreshToken = await dropbox.getRefreshToken();
  if (refreshToken) {
    return {
      setupComplete: true,
    };
  }

  const authorizationUrl = dropbox.getAuthUrl(
    new URL(request.url).host + "/authorize"
  );

  redirect(authorizationUrl, 301);
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    { title: "Setup Dropbox Integration" },
    { name: "description", content: "Setup your Dropbox integration" },
  ];
};

export default function Setup({ loaderData }: Route.ComponentProps) {
  if (loaderData?.setupComplete) {
    return (
      <div>
        <h1>Setup Complete</h1>
        <p>
          You have successfully set up the Dropbox integration. You can now
          proceed to use the application.
        </p>
        <a href="/">Home</a>
      </div>
    );
  }

  return null;
}
