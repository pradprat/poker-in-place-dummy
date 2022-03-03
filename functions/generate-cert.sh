certbot certonly -d api.pokerinplace.app --config-dir certs/ --work-dir ./certs --logs-dir ./certs --manual --preferred-challenges dns -d *.api.pokerinplace.app
