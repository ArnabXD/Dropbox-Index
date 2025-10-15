console.log("Enter code:");

process.stdin.on("data", async (data) => {
  const code = data.toString().trim();
  const formdata = new FormData();
  formdata.append("grant_type", "authorization_code");
  formdata.append("code", code);
  formdata.append("client_id", "qy1yfn7mclvybv9");
  formdata.append("client_secret", "dylisltrpw3r24a");

  const requestOptions = {
    method: "POST",
    body: formdata,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      "https://api.dropboxapi.com/oauth2/token",
      requestOptions,
    );
    const result = await response.json();
    if (response.status !== 200) {
      console.log(result);
      return;
    }
    console.log("Refresh Token:", result.refresh_token);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
});
