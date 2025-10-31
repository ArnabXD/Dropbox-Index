import ky from "ky";
import type {
  ListFolderResponseType,
  AccessTokenResponseType,
  RefreshTokenResponseType,
} from "./@types/types";

export const getRefreshTokenFn = async (
  auth_code: string,
  clientKey: string,
  clientSecret: string,
) => {
  try {
    const formData = new FormData();
    formData.append("code", auth_code);
    formData.append("grant_type", "authorization_code");
    formData.append("client_id", clientKey);
    formData.append("client_secret", clientSecret);

    const data = await ky
      .post("", {
        body: formData,
      })
      .json<RefreshTokenResponseType>();

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch refresh token:${error}`);
  }
};

export const getAccessTokenFn = async (
  refresh_token: string,
  clientKey: string,
  clientSecret: string,
) => {
  try {
    const formData = new FormData();
    formData.append("refresh_token", refresh_token);
    formData.append("grant_type", "refresh_token");
    formData.append("client_id", clientKey);
    formData.append("client_secret", clientSecret);

    const data = await ky
      .post("https://api.dropboxapi.com/oauth2/token", {
        body: formData,
      })
      .json<AccessTokenResponseType>();

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch access token:${error}`);
  }
};

export const getAllFolderFn = async (token: string, path: string) => {
  try {
    const data = await ky
      .post("https://api.dropboxapi.com/2/files/list_folder", {
        json: {
          path: path,
          recursive: false,
          include_media_info: false,
          include_deleted: false,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<ListFolderResponseType>();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch folder: ${error}`);
  }
};

export const getAllFolderContinueFn = async (token: string, cursor: string) => {
  try {
    const data = await ky
      .post("https://api.dropboxapi.com/2/files/list_folder/continue", {
        json: {
          cursor: cursor,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<ListFolderResponseType>();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch folder: ${error}`);
  }
};

export const downloadFn = async (token: string, id: string) => {
  try {
    const data = await ky.post(
      "https://content.dropboxapi.com/2/files/download",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: id }),
        },
      },
    );

    return data;
  } catch (error) {
    throw new Error(`Failed to download :${error}`);
  }
};
