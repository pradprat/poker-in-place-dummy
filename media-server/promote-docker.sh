GIT_TAG=$(git log -1 --pretty=%H)

gcloud compute ssh $API_SERVER --command 'docker system prune -f -a'
gcloud beta compute instances update-container $API_SERVER --zone=$ZONE --container-image=us.gcr.io/poker-in-place/poker-in-place-mediasoup:$GIT_TAG