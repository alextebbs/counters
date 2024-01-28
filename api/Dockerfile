# Start from the official Golang image to build the binary.
FROM golang:1.21 as builder

# Set the working directory outside $GOPATH to enable the support for modules.
WORKDIR /app

# Copy the go.mod and go.sum file to download the dependencies.
COPY go.mod go.sum ./

# Download the dependencies.
RUN go mod download

# Copy the rest of the application's code.
COPY . .

# Build the application.
RUN CGO_ENABLED=0 GOOS=linux go build -o api-server .

# Start a new stage from scratch for a smaller, final image.
FROM alpine:latest  

# Install CA certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage.
COPY --from=builder /app/api-server .

# Run the binary.
CMD ["./api-server"]
