# syntax=docker/dockerfile:1

# Dockerfile according https://docs.docker.com/language/golang/build-images/

FROM golang:1.20-alpine AS build-stage

# Set destination for COPY
WORKDIR /app

RUN apk add --no-cache gcc g++
# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code. Note the slash at the end, as explained in
# https://docs.docker.com/engine/reference/builder/#copy
COPY *.go ./

# Build
RUN CGO_ENABLED=1 GOOS=linux go build -o api-mining-stats

# Run the tests in the container
#FROM build-stage AS run-test-stage
#RUN go test -v ./...

# Deploy the application binary into a lean image
FROM alpine:edge
WORKDIR /
COPY --from=build-stage /app/api-mining-stats /api-mining-stats
CMD ["/api-mining-stats"]
