To run locally:

1. MEDIASOUP_LISTEN_IP=0.0.0.0 MEDIASOUP_ANNOUNCED_IP=127.0.0.1 yarn start
2. Open chrome and go to https://localhost:443/health
3. You will get a certificate error. On that screen type 'thisisunsafe' - You'll see the health stats
4. To run as part of PIP, point to localhost:443
5. You may need to start chrome with the ignore certs flag https://medium.com/idomongodb/chrome-bypassing-ssl-certificate-check-18b35d2a19fd
