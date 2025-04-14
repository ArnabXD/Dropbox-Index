import ky from "ky";
import type { KyInstance, KyRequest } from "ky";

export class DropboxService {
  private API_KEY: string;
  private API_SECRET: string;
  private TOKEN_DB: KVNamespace;
  private client: KyInstance;

  constructor(API_KEY: string, API_SECRET: string, TOKEN_DB: KVNamespace) {
    this.API_KEY = API_KEY;
    this.API_SECRET = API_SECRET;
    this.TOKEN_DB = TOKEN_DB;

    this.client = ky.create({
      prefixUrl: "https://api.dropboxapi.com/2",
      headers: {
        "Content-Type": "application/json",
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            const token = await this.getAccessToken();
            request.headers.set("Authorization", `Bearer ${token}`);
          },
        ],
        afterResponse: [
          async (request, _options, response) => {
            if (response.status === 401) {
              const originalRequest = request.clone() as KyRequest;

              const newToken = await this.refreshToken();
              if ("access_token" in newToken) {
                request.headers.set(
                  "Authorization",
                  `Bearer ${newToken.access_token}`,
                );
              }

              return await ky(originalRequest);
            }
          },
        ],
      },
    });
  }

  getAuthUrl = (redirectUri: string) => {
    const authorizationUrl = new URL(
      "https://www.dropbox.com/oauth2/authorize",
    );

    authorizationUrl.searchParams.set("client_id", this.API_KEY);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("token_access_type", "offline");
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);

    return authorizationUrl.toString();
  };

  getToken = async (code: string, redirectUri: string) => {
    const body = new FormData();

    const redirect = new URL(redirectUri);

    body.append("code", code);
    body.append("grant_type", "authorization_code");
    body.append("client_id", this.API_KEY);
    body.append("client_secret", this.API_SECRET);
    body.append("redirect_uri", redirect.origin + redirect.pathname);

    const response = await ky
      .post("https://api.dropboxapi.com/oauth2/token", {
        body,
        throwHttpErrors: false,
      })
      .json<
        | {
            access_token: string;
            expires_in: number;
            refresh_token: string;
            scope: string;
            uid: string;
            account_id: string;
          }
        | {
            error: string;
            error_description: string;
          }
      >();

    if (!response || "error_description" in response) {
      console.debug(response);
      return response;
    }

    await this.TOKEN_DB.put("REFRESH_TOKEN", response.refresh_token);
    await this.TOKEN_DB.put("ACCESS_TOKEN", response.access_token);

    return response;
  };

  getAccessToken = async () => {
    const token = await this.TOKEN_DB.get("ACCESS_TOKEN");
    if (!token) {
      throw new Error("No access token found");
    }

    return token;
  };

  getRefreshToken = async () => {
    const token = await this.TOKEN_DB.get("REFRESH_TOKEN");
    if (!token) {
      throw new Error("No refresh token found");
    }

    return token;
  };

  refreshToken = async () => {
    const refreshToken = await this.getRefreshToken();

    const body = new FormData();

    body.append("grant_type", "refresh_token");
    body.append("client_id", this.API_KEY);
    body.append("client_secret", this.API_SECRET);
    body.append("refresh_token", refreshToken);

    const response = await ky
      .post("https://api.dropboxapi.com/oauth2/token", {
        body,
        throwHttpErrors: false,
      })
      .json<
        | {
            access_token: string;
            expires_in: number;
            refresh_token: string;
            scope: string;
            uid: string;
            account_id: string;
          }
        | {
            error: string;
            error_description: string;
          }
      >();

    if (!response || "error_description" in response) {
      console.debug(response);
      return response;
    }

    await this.TOKEN_DB.put("REFRESH_TOKEN", response.refresh_token);
    await this.TOKEN_DB.put("ACCESS_TOKEN", response.access_token);

    return response;
  };

  listFolders = async (path = "") => {
    const response = await this.client
      .post("files/list_folder", {
        json: {
          path,
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          include_has_explicit_shared_members: false,
          include_mounted_folders: true,
        },
      })
      .json();

    return response;
  };
}
