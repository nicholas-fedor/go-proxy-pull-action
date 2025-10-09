FROM golang:1.25.2-alpine3.21@sha256:01346535ae797d5bc7301aa6518051e9a66adf813fc99e09872a06417759f913

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
