# Counters

This is a really over-engineered web app that lets you create timers which track
occurences of events, and add occurrences to those events, keeping track of the
time since the last occurence. Creating and updating objects is handled by a Go
backened API server, which reads/writes data from/to PostgresQL and sends data
to a NextJS app via gRPC, (an Envoy proxy translates the HTTP/2 gRPC messages to
browser-compatiable HTTP/1.1). The NextJS app has it's own distinction between
client and server code - and tries to use React server components as much as
possible, using server actions for submitting the forms which allow the
client-side application to interact with the API. There are a number of custom
higher-order functions and custom hooks that faciliate creating server actions
and clients to gRPC services on the frontend without writing too much
boilerplate code. The services are coordinated through a k8s cluster, and for
local development there is a Tilt configuration that will reload and rebuild k8s
pods as changes are made. The API structure is defined in protobuf, which
generates types and helper functions that are consumed by both the frontend and
backend services.

Some of the tech used:

- k8s
- Tilt
- Go
- PostgresQL
- Protobuf
- gRPC
- Typescript
- NextJS 14
- React server actions
- Tailwind

What's interesting about this application is the k8s development setup, and the
generic functions on the frontend that provide interfaces and helpers that
create React server actions which call Go methods via gRPC.
