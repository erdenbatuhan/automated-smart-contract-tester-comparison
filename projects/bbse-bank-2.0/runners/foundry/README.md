# BBSE Bank 2.0 - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t bbsebank2/foundry/base -f docker/Dockerfile.base .
docker build -t bbsebank2/foundry/app -f docker/Dockerfile.app .

docker run --rm bbsebank2/foundry/app
```
