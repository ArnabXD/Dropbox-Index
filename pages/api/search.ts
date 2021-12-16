import type { NextApiRequest, NextApiResponse } from "next";
import type { DropboxResponse, files } from "dropbox";
import { dropbox } from "../../lib/dropbox";

type FolderResponse = DropboxResponse<files.SearchV2Result | files.SearchError>;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<FolderResponse>
) => {
  try {
    const resp = await dropbox.filesSearchV2({
      query: req.query.query.toString(),
    });
    res.json(resp);
  } catch (err) {
    res.json(err as DropboxResponse<files.SearchError>);
  }
};

export default handler;
