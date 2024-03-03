# Define namespaces
k8s_yaml("k8s/namespace.yaml")

# ------------------------------------------------------------------------------
# POSTGRES
# ------------------------------------------------------------------------------

# Apply k8s resources for PostgreSQL
k8s_yaml("k8s/postgres/postgres-deployment.yaml")
k8s_yaml("k8s/postgres/postgres-service.yaml")
k8s_yaml("k8s/postgres/postgres-pvc.yaml")

# ------------------------------------------------------------------------------
# Redis
# ------------------------------------------------------------------------------

# Apply k8s resources for PostgreSQL
k8s_yaml("k8s/redis/redis-deployment.yaml")
k8s_yaml("k8s/redis/redis-service.yaml")
k8s_yaml("k8s/redis/redis-pvc.yaml")

# ------------------------------------------------------------------------------
# JUMP POD
# ------------------------------------------------------------------------------

# Apply k8s resources for 'Jump pod'
k8s_yaml("k8s/jump/jump-pod.yaml")

# ------------------------------------------------------------------------------
# ENVOY PROXY
# ------------------------------------------------------------------------------

# Build image for envoy proxy
docker_build('alextebbs/envoy-proxy', 'k8s/envoy/')

# Apply k8s resources for API server
k8s_yaml("k8s/envoy/envoy-deployment.yaml")
k8s_yaml("k8s/envoy/envoy-service.yaml")

# Port forward the api server so we can test the API locally
k8s_resource('envoy-proxy', port_forwards="8080:8080")

# ------------------------------------------------------------------------------
# API SERVER
# ------------------------------------------------------------------------------

# Build image for API server
docker_build('alextebbs/counter-api', 'api/')

# Apply k8s resources for API server
k8s_yaml("k8s/api/api-deployment.yaml")
k8s_yaml("k8s/api/api-service.yaml")

# port forward so i can test with grpcui
k8s_resource('counter-api', port_forwards="50051:50051")

# ------------------------------------------------------------------------------
# NEXTJS 'FRONTEND'
# ------------------------------------------------------------------------------

# Build docker image for frontend dev server
docker_build('alextebbs/counter-frontend', 'frontend/', 
  dockerfile='frontend/Dockerfile.dev',
  ignore=['frontend/node_modules'],
  live_update=[
    fall_back_on(['frontend/package.json', 'frontend/yarn.lock']),
    sync('frontend/', '/usr/src/app/'),
  ])

# Apply k8s resources for frontend
k8s_yaml('k8s/frontend/frontend-deployment.yaml')
k8s_yaml('k8s/frontend/frontend-service.yaml')

# Forward container ports to localhost
k8s_resource('counter-frontend', port_forwards="3000:3000")



# Optional: if you have specific Docker images to build for the above services, use docker_build
# docker_build('your-postgres-image', 'path/to/Dockerfile/for/postgres')
# docker_build('your-jump-pod-image', 'path/to/Dockerfile/for/jump-pod')

# Port forwarding for PostgreSQL (if you want to access it locally for debugging purposes)
# k8s_resource("postgres-deployment", port_forwards="5432:5432")

# Port forwarding for Jump Pod (if you want to access it locally)
# k8s_resource(
#     "jump-pod", port_forwards="9999:22"
# )  # Port 9999 is an example, change it as needed

# Add a readiness check for PostgreSQL if needed
# k8s_resource('postgres-deployment', readiness_probe={'httpGet': {'path': '/health', 'port': 5432}})

# Add labels or other configurations if needed
# k8s_resource('postgres-deployment', labels='backend')