# Counters

This is a really over-engineered web app that lets you create timers which track
occurences of events, and add occurrences to those events, keeping track of the
time since the last occurence.

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
