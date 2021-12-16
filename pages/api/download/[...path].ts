import type { NextApiRequest, NextApiResponse } from "next";
import type { DropboxResponse, files } from "dropbox";
import { dropbox } from "../../../lib/dropbox";

type FolderResponse = DropboxResponse<
  files.GetTemporaryLinkResult | files.GetTemporaryLinkError
>;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<FolderResponse>
) => {
  try {
    const path = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path];
    const resp = await dropbox.filesGetTemporaryLink({
      path: "/" + path.join("/"),
    });
    res.json(resp);
  } catch (err) {
    res.json(err as DropboxResponse<files.GetTemporaryLinkError>);
  }
};

export default handler;
