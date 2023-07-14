# BBSE Bank 2.0 - Runners/Truffle

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t bbsebank2/truffle/base -f docker/Dockerfile.base .
docker build -t bbsebank2/truffle/app -f docker/Dockerfile.app .

docker run --rm bbsebank2/truffle/app
```
