import type { NextApiRequest, NextApiResponse } from "next";
import type { DropboxResponse, files } from "dropbox";
import { dropbox } from "../../../lib/dropbox";

type FolderResponse = DropboxResponse<
  files.ListFolderResult | files.ListFolderError
>;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<FolderResponse>
) => {
  try {
    const path = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path];
    const resp = await dropbox.filesListFolder({
      path: "/" + path.join("/"),
      limit: 1000,
    });
    res.json(resp);
  } catch (err) {
    console.log(err);
    res.json(err as DropboxResponse<files.ListFolderError>);
  }
};

export default handler;
