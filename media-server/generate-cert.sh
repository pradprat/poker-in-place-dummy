certbot certonly -d media.pokerinplace.app --config-dir certs/ --work-dir ./certs --logs-dir ./certs --manual --preferred-challenges dns -d *.media.pokerinplace.app
