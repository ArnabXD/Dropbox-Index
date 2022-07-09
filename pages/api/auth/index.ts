import type { NextApiRequest, NextApiResponse } from "next";
import { DropboxAuth } from "dropbox";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const APP_ID = process.env.APP_ID ?? "";
    const APP_SECRET = process.env.APP_SECRET ?? "";

    const dbx = new DropboxAuth({
      clientId: APP_ID,
      clientSecret: APP_SECRET,
    });

    const redirectUri = `http://${req.headers.host}/api/auth/token`;
    const authUri = await dbx.getAuthenticationUrl(
      redirectUri,
      undefined,
      "code",
      "offline",
      undefined,
      "none",
      false
    );

    // @ts-ignore
    res.redirect(authUri);
  } catch (error) {
    res.json({ error });
  }
};

export default handler;
