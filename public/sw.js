/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Notification", body: event.data ? event.data.text() : "" };
  }

  const title = typeof data.title === "string" ? data.title : "Notification";
  const body = typeof data.body === "string" ? data.body : "";
  const icon = typeof data.icon === "string" ? data.icon : "/logo.png";
  const tag = typeof data.tag === "string" ? data.tag : undefined;
  const url =
    data && typeof data.url === "string"
      ? data.url
      : data?.data && typeof data.data.url === "string"
        ? data.data.url
        : null;

  const notificationOptions = {
    body,
    icon,
    tag,
    data: {
      url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url;
  if (!url || typeof url !== "string") {
    return;
  }

  const targetUrl = url.startsWith("/") ? `${self.location.origin}${url}` : url;

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }

      await clients.openWindow(targetUrl);
    })(),
  );
});
