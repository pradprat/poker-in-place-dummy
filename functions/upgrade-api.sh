GIT_TAG=$(git log -1 --pretty=%H)
NOW=$(date +"%Y%m%d-%H%M")

for INDEX in $(seq 0 $((${API_COUNT}-1))); do
    NEW_API_SERVER="api-$API_ENVIRONMENT-$INDEX-$NOW"
    CURRENT_API_SERVER=$(gcloud beta compute instances list --filter="name~'.*api-$API_ENVIRONMENT-$INDEX.*'" --format=json | jq '.[0].name' --raw-output)

    echo $INDEX INDEX
    echo $NEW_API_SERVER NEW_API_SERVER
    echo $CURRENT_API_SERVER CURRENT_API_SERVER
    REGION=us-east4

    echo $CURRENT_API_SERVER CURRENT_API_SERVER
    if [[ "$CURRENT_API_SERVER" ]]
    then
    echo 1
        STATIC_IP=$(gcloud compute instances list --filter "name=$CURRENT_API_SERVER" --format=json | jq '.[0].networkInterfaces[0].accessConfigs[0].natIP' --raw-output)
        ZONE=$(gcloud compute instances list --filter "name=$CURRENT_API_SERVER" --format=json | jq '.[0].zone | select (.!=null) | capture(".+/(?<id>.+)$").id' --raw-output)

    else
    echo 2
        STATIC_IP=$(gcloud compute addresses list --filter "name=ip-api-$API_ENVIRONMENT-$INDEX" --format=json | jq '.[0].address' --raw-output)
        CURRENT_API_SERVER=$(gcloud compute addresses list --filter "name=ip-api-$API_ENVIRONMENT-$INDEX" --format=json | jq '.[0].users[0] | select (.!=null) | capture(".+/(?<id>.+)$").id' --raw-output)
        REGION=$(gcloud compute addresses list --filter "name=ip-api-$API_ENVIRONMENT-$INDEX" --format=json | jq '.[0].region | select (.!=null) | capture(".+/(?<id>.+)$").id' --raw-output)
    fi

    if [[ !"$CURRENT_API_SERVER" ]]
    then
        echo No Api Server
    fi
    echo $REGION region
    if [[ ! "$REGION" ]]
    then
        REGION=us-central1
    fi
    if [[ ! "$ZONE" ]]
    then
        ZONE=$REGION-b
    fi

    echo $GIT_TAG
    echo $STATIC_IP
    echo $NEW_API_SERVER
    echo $CURRENT_API_SERVER
    echo $ZONE

    echo 'Creating new instance'
    echo gcloud beta compute instances create $NEW_API_SERVER --zone $ZONE --source-instance-template instance-template-api-$API_ENVIRONMENT --maintenance-policy=MIGRATE
    gcloud beta compute instances create $NEW_API_SERVER --zone $ZONE --boot-disk-size=30GB --source-instance-template instance-template-api-$API_ENVIRONMENT --maintenance-policy=MIGRATE

    # gcloud beta compute instances update-container $API_SERVER --container-image=us.gcr.io/poker-in-place/poker-in-place-functions:$GIT_TAG
    echo 'Update new instance container'
    gcloud beta compute instances update-container $NEW_API_SERVER --zone $ZONE --container-image us.gcr.io/poker-in-place/poker-in-place-functions:$GIT_TAG --container-env "API_HOST_NAME=https://$API_ENVIRONMENT$INDEX.api.pokerinplace.app"

    # STATIC_IP=$(gcloud compute instances list --filter "name=$CURRENT_API_SERVER" --format=json | jq '.[0].networkInterfaces[0].accessConfigs[0].natIP' --raw-output)
    EPHEMERAL_IP=$(gcloud compute instances list --filter "name=$NEW_API_SERVER" --format=json | jq '.[0].networkInterfaces[0].accessConfigs[0].natIP' --raw-output)

    echo $EPHEMERAL_IP
    HOST="https://$EPHEMERAL_IP"
    echo $HOST
    HTTPD=`curl -A "Web Check" --insecure -sL --connect-timeout 3 -w "%{http_code}\n" "$HOST" -o /dev/null`
    until [ "$HTTPD" == "403" ]; do
        printf '.'
        # service nginx restart
        HTTPD=`curl -A "Web Check" --insecure -sL --connect-timeout 3 -w "%{http_code}\n" "$HOST" -o /dev/null`
        sleep 1
    done

    echo gcloud compute instances delete-access-config $NEW_API_SERVER --zone $ZONE --access-config-name "External NAT"
    gcloud compute instances delete-access-config $NEW_API_SERVER --zone $ZONE --access-config-name "External NAT"
    if [[ "$CURRENT_API_SERVER" ]]
    then
        gcloud compute instances delete-access-config $CURRENT_API_SERVER --zone $ZONE --access-config-name "External NAT"
    fi
    gcloud compute instances add-access-config $NEW_API_SERVER --zone $ZONE --access-config-name "External NAT" --address $STATIC_IP

    if [[ "$CURRENT_API_SERVER" ]]
    then
        gcloud beta compute instances delete $CURRENT_API_SERVER --zone $ZONE --quiet &
    fi
done
echo DONE
