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

    const redirectUri = req.headers.host?.includes("localhost")
      ? `http://${req.headers.host}/api/auth/token`
      : `https://${req.headers.host}/api/auth/token`;
    const code = req.query.code as string;

    const refreshToken = await dbx.getAccessTokenFromCode(redirectUri, code);
    // @ts-ignore
    res.json(refreshToken);
  } catch (error) {
    res.json({ error });
  }
};

export default handler;
