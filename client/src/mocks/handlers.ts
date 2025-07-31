import { http, graphql } from "msw";

// Catch-all handler to log unhandled requests
const logUnhandledRequests = http.all("*", ({ request }) => {
  console.group(`🔍 Unhandled ${request.method} request to ${request.url}`);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log(
    "URL params:",
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  console.groupEnd();

  // Pass through to actual network (remove this to block requests)
  return Response.error();
});

export const handlers = [
  // Add your API mocks here

  // Keep this last to catch unhandled requests
  logUnhandledRequests,
];
