FROM golang:1.25.3-alpine3.21@sha256:0c9f3e09a50a6c11714dbc37a6134fd0c474690030ed07d23a61755afd3a812f

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
