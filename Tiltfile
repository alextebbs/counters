# Define namespaces
k8s_yaml("k8s/namespace.yaml")

# Define postgres pod
k8s_yaml("k8s/postgres/postgres-deployment.yaml")
k8s_yaml("k8s/postgres/postgres-service.yaml")
k8s_yaml("k8s/postgres/postgres-pvc.yaml")

# Defines the Jump Pod
k8s_yaml("k8s/jump/jump-pod.yaml")

# Defines API server pod
k8s_yaml("k8s/api/api-deployment.yaml")
k8s_yaml("k8s/api/api-service.yaml")
k8s_yaml("k8s/api/api-ingress.yaml")

# Tells Tilt to build the Docker image with the given name and Dockerfile
docker_build('alextebbs/counter-api', 'api/')

# Port forward the api server so we can test the API locally
k8s_resource('counter-api-deployment', port_forwards="8080:8080")

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