export type Entry = FolderEntry | FileEntry;

export interface FolderEntry {
  ".tag": "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

export interface FileEntry {
  ".tag": "file";
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
}

export interface ListFolderResponseType {
  entries: Entry[];
  cursor: string;
  has_more: boolean;
}

export interface RefreshTokenResponseType {
  access_token: string;
  refresh_token: string;
  scope: string;
  uid: string;
  account_id: string;
}

export interface AccessTokenResponseType {
  access_token: string;
  token_type: string;
  expires_in: number;
}
