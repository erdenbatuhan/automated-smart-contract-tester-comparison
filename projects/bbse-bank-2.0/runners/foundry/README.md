# BBSE Bank 2.0 - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t bbsebank2/foundry/base:v3 -f docker/ubuntu/v3/Dockerfile.base.v3 .
docker build -t bbsebank2/foundry/app:v3 -f docker/ubuntu/v3/Dockerfile.app.v3 .

docker run --rm bbsebank2/foundry/app:v3
```
