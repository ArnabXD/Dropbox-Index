import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import ky from "ky";
import { useQuery } from "react-query";
import { DropboxResponse, files } from "dropbox";
import { useRouter } from "next/router";
import { Nav, Loading, List, Breadcrumb } from "../components";

const Home: NextPage = () => {
  const router = useRouter();
  const [path, setPath] = useState("");

  useEffect(() => {
    if (router.query.path) {
      if (Array.isArray(router.query.path)) {
        setPath(router.query.path.join("/"));
      } else {
        setPath(router.query.path);
      }
    }
  }, [router.query]);

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
      console.log(path);
      refetch();
    }
  }, [path, refetch]);

  return (
    <div>
      <Nav />
      <Breadcrumb path={path} />
      {(isLoading || isFetching) && <Loading />}
      {data && <List entries={data} />}
    </div>
  );
};

export default Home;
