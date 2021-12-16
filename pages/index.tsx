import type { NextPage } from "next";
import { Nav, Loading, List } from "../components";
import ky from "ky";
import { useQuery } from "react-query";
import { DropboxResponse, files } from "dropbox";

const Home: NextPage = () => {
  const { data, isLoading } = useQuery("home", async () => {
    const resp = await ky
      .get("/api/explore")
      .json<DropboxResponse<files.ListFolderResult | files.ListFolderError>>();
    if (resp.status === 200) {
      const resp2 = resp as DropboxResponse<files.ListFolderResult>;
      return resp2.result.entries.filter(
        (file) => file[".tag"] === "file" || file[".tag"] === "folder"
      ) as (files.FileMetadataReference | files.FolderMetadataReference)[];
    } else {
      throw new Error("Something Went Wrong");
    }
  });

  return (
    <div>
      <Nav />
      {isLoading && <Loading />}
      {data && <List entries={data} />}
    </div>
  );
};

export default Home;
