import { Folder, File, Home, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Entry, ListFolderResponseType } from "~/api/@types/types";
import { downloadFn, getAllFolderFn, getAccessTokenFn } from "~/api/api";
// import type { Route } from "../+types/root";
import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "react-router";

type DropboxFileMetadataType = {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  client_modified: string;
  server_modified: string;
  rev: string;
  size: number;
  is_downloadable: boolean;
  content_hash: string;
};

type LoaderDataType = {
  authUrl: string;
  appKey: string;
  appSecret: string;
  refreshToken: string;
};

export default function FolderIndex() {
  const loaderData = useLoaderData() as LoaderDataType;
  const [accessToken, setAccessToken] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const { data: entries, isLoading } = useQuery<Entry[]>({
    queryKey: ["entries", folderPath],
    queryFn: async () => {
      const newTokenResp = await getAccessTokenFn(
        loaderData.refreshToken,
        loaderData.appKey,
        loaderData.appSecret,
      );
      setAccessToken(newTokenResp.access_token);
      const resp = await getAllFolderFn(newTokenResp.access_token, folderPath);
      return resp.entries;
    },
    enabled: !!loaderData.refreshToken,
  });

  async function downloadFile(path: string) {
    const response = await downloadFn(accessToken, path);

    const metadataJson = response.headers.get("Dropbox-API-Result");
    if (!metadataJson) {
      throw new Error("No Dropbox-API-Result header found");
    }
    const metadata: DropboxFileMetadataType = JSON.parse(metadataJson);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = metadata.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm">
          <button
            onClick={() => setFolderPath("")}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Go to home"
          >
            <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          {folderPath && (
            <div className="flex items-center">
              {folderPath
                .split("/")
                .filter((p) => p.length > 0)
                .map((path, idx) => (
                  <div key={idx} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                    <button
                      className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
                      onClick={() => setFolderPath(`/${path}`)}
                    >
                      {path}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Files & Folders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse and manage your files
          </p>
        </div>

        {/* File List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {isLoading && (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </div>
          )}
          {!isLoading && (!entries || entries.length === 0) && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No files or folders
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This folder is empty
              </p>
            </div>
          )}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer group"
                onClick={() => {
                  entry[".tag"] === "file"
                    ? downloadFile(entry.path_display)
                    : setFolderPath(entry.path_display);
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {entry[".tag"] === "folder" ? (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <File className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Name and Path */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {entry.name}
                  </h3>
                  {/* <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5"> */}
                  {/*   {entry.path_display} */}
                  {/* </p> */}
                </div>

                {/* Metadata */}
                <div className="flex-shrink-0 text-right">
                  {entry[".tag"] === "file" ? (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatSize(entry.size)}
                    </p>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Folder
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
