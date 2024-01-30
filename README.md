TODO

- counters should be created with 1 occurence

#### create secrets

```
k create secret generic postgres-credentials --from-env-file=.env
```

#### "jump pod"

How to set this up so that I can just run a command to get into this
container and do these things:

```
ϟ k exec -it --namespace counter jump-pod -- /bin/sh
/ # apk update
/ # apk add postgresql-client
/ # psql -h postgres-service -p 5432 -U DB_USER -d DB_NAME
```
