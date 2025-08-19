// src/auth/msal.ts
import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

const tenant = process.env.NEXT_PUBLIC_AZURE_TENANT_ID!;
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const redirectUri =
  process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3002/auth/callback";

export const loginRequest = {
  scopes: ["openid", "profile", "email", "offline_access"],
};

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenant}`,
    redirectUri,
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: () => {},
    },
  },
});
