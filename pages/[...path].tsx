import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { Nav, Loading, List } from "../components";
import ky from "ky";
import { useQuery } from "react-query";
import { DropboxResponse, files } from "dropbox";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const { query } = useRouter();
  const [path, setPath] = useState("");

  useEffect(() => {
    if (query.path) {
      if (Array.isArray(query.path)) {
        setPath(query.path.join("/"));
      } else {
        setPath(query.path);
      }
    }
  }, [query]);

  const { data, isLoading, isFetching, refetch } = useQuery(
    "path-" + path,
    async () => {
      const resp = await ky
        .get("/api/explore/" + path)
        .json<
          DropboxResponse<files.ListFolderResult | files.ListFolderError>
        >();
      if (resp.status === 200) {
        const resp2 = resp as DropboxResponse<files.ListFolderResult>;
        return resp2.result.entries.filter(
          (file) => file[".tag"] === "file" || file[".tag"] === "folder"
        ) as (files.FileMetadataReference | files.FolderMetadataReference)[];
      } else {
        throw new Error("Something Went Wrong");
      }
    },
    { enabled: false }
  );

  useEffect(() => {
    if (path) {
      refetch();
    }
  }, [path, refetch]);

  return (
    <div>
      <Nav />
      {(isLoading || isFetching) && <Loading />}
      {data && <List entries={data} />}
    </div>
  );
};

export default Home;
