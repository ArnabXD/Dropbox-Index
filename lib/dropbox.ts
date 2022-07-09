import { Dropbox } from "dropbox";

export const dropbox = new Dropbox({
  clientId: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
});
