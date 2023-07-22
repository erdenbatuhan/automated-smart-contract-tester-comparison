# BBSE Bank 2.0 - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t bbsebank2/foundry/base:v5 -f docker/v5/Dockerfile.base.v5 .
docker build -t bbsebank2/foundry/app:v5 -f docker/v5/Dockerfile.app.v5 .

docker run --rm bbsebank2/foundry/app:v5
```
