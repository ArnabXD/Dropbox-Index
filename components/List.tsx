import React, { useState, useEffect } from "react";
import {
  DownloadIcon,
  DocumentIcon,
  FolderIcon,
  ClipboardIcon,
} from "@heroicons/react/solid";
import { DropboxResponse, files } from "dropbox";
import { useClipboard } from "@chakra-ui/hooks";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/router";

import { IconButton } from "./Icons";
import ky from "ky";
import prettyBytes from "pretty-bytes";

interface ListProps {
  entries: (files.FileMetadataReference | files.FolderMetadataReference)[];
  path?: string;
}

export const List = (props: ListProps) => {
  const [link, setLink] = useState("");
  const { onCopy } = useClipboard(link);

  const router = useRouter();

  useEffect(() => {
    if (link) {
      onCopy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  const getDownloadLink = async (path: string) =>
    await ky
      .get("/api/download" + path)
      .json<
        DropboxResponse<
          files.GetTemporaryLinkResult | files.GetTemporaryLinkError
        >
      >();

  const copyToClipboard = async (
    data: files.FileMetadataReference | files.FolderMetadataReference
  ) => {
    if (data[".tag"] === "folder") {
      setLink(window.location.origin + data.path_display);
    } else {
      let resp = await getDownloadLink(data.path_display!);
      if ("link" in resp.result) {
        setLink(resp.result.link);
      } else {
        throw new Error("Failed to generate download link");
      }
    }
  };

  return (
    <div className="container max-w-screen-md mx-auto my-2">
      <div className="grid grid-cols-12 p-4 mx-2 mt-2 bg-slate-800 border-b-2 border-b-slate-700">
        <div className="col-span-9 font-bold">Name</div>
        <div className="hidden md:flex md:col-span-2 flex-row font-bold justify-center">
          Info
        </div>
        <div className="col-span-3 md:col-span-1 font-bold flex flex-row justify-center">
          Actions
        </div>
      </div>
      <Toaster />
      {props.entries.map((file) => {
        return (
          <div
            key={file.id}
            className="grid grid-cols-12 px-4 py-2 mx-2 bg-slate-800 hover:bg-slate-700"
          >
            <div
              className="col-span-9 md:col-span-9 flex flex-row items-center cursor-pointer"
              onClick={() => {
                if (file[".tag"] === "folder") {
                  router.push(file.path_display || "/");
                }
              }}
            >
              {file[".tag"] === "file" ? (
                <DocumentIcon
                  height={18}
                  width={18}
                  className="flex-shrink-0"
                />
              ) : (
                <FolderIcon height={18} width={18} className="flex-shrink-0" />
              )}
              <p className="mx-2 truncate">{file.name}</p>
            </div>
            <div className="hidden md:flex md:col-span-2 flex-row items-center justify-center font-thin text-sm">
              {file[".tag"] === "file" && prettyBytes(file.size)}
            </div>
            <div className="col-span-3 md:col-span-1 flex flex-row">
              <IconButton
                onClick={() =>
                  toast.promise(
                    copyToClipboard(file),
                    {
                      success: "Link copied successfully",
                      error: "Failed to generate link",
                      loading: "Generating link",
                    },
                    {
                      style: {
                        backgroundColor: "#1e293b",
                        borderWidth: 2,
                        borderColor: "#475569",
                        color: "white",
                      },
                    }
                  )
                }
              >
                <ClipboardIcon height={18} />
              </IconButton>
              {file[".tag"] === "file" && (
                <IconButton
                  onClick={() => {
                    getDownloadLink(file.path_display!).then((resp) => {
                      if ("link" in resp.result) {
                        router.push(resp.result.link);
                      } else {
                        toast.error("Failed to Download Generate Link");
                      }
                    });
                  }}
                >
                  <DownloadIcon height={18} />
                </IconButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
