import type { NextApiRequest, NextApiResponse } from "next";
import type { DropboxResponse, files } from "dropbox";
import { dropbox } from "../../../lib/dropbox";

export type FolderResponse = DropboxResponse<
  files.ListFolderResult | files.ListFolderError
>;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<FolderResponse>
) => {
  try {
    const resp = await dropbox.filesListFolder({
      path: "",
      limit: 1000,
      include_media_info: true,
    });
    res.json(resp);
  } catch (err) {
    res.json(err as DropboxResponse<files.ListFolderError>);
  }
};

export default handler;
