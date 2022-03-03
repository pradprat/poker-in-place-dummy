#!/bin/bash
HOST="https://$3/health"

echo $1 $2 $3 $4 $HOST

GIT_TAG=$(git log -1 --pretty=%H)

if [ "$4" == "down" ]
then
    gcloud compute ssh $1 --zone $2 --command 'docker system prune -f -a'
    gcloud beta compute instances update-container $1 --zone $2 --container-image=us.gcr.io/poker-in-place/poker-in-place-mediasoup:$GIT_TAG
fi

echo $HOST
HTTPD=`curl -A "Web Check" -sL --connect-timeout 3 -w "%{http_code}\n" "$HOST" -o /dev/null`
until [ "$HTTPD" == "200" ]; do
    printf '.'
    # service nginx restart
    HTTPD=`curl -A "Web Check" -sL --connect-timeout 3 -w "%{http_code}\n" "$HOST" -o /dev/null`
    sleep 1
done
echo 'DONE'