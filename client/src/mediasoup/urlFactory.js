let protooPort = process.env.REACT_APP_MEDIA_PORT || 443;

if (window.location.hostname === "test.mediasoup.org") protooPort = 4444;

export function getProtooUrl({ roomId, peerId, mediaServerRoot }) {
  const hostname =
    process.env.REACT_APP_MEDIA_HOST ||
    (window.location.hostname === "localhost"
      ? "127.0.0.1"
      : window.location.hostname);

  const serverRoot = `wss://${mediaServerRoot || hostname}:${protooPort}`;
  return `${serverRoot}/?roomId=${roomId}&peerId=${peerId}`;
}
