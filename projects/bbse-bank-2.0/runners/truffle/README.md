# BBSE Bank 2.0 - Runners/Truffle

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t bbsebank2/truffle/base:v2 -f docker/v2/Dockerfile.base.v2 .
docker build -t bbsebank2/truffle/app:v2 -f docker/v2/Dockerfile.app.v2 .

docker run --rm bbsebank2/truffle/app:v2
```
