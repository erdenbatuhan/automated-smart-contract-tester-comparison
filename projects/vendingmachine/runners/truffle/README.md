# Vending Machine - Runners/Truffle

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t vendingmachine/truffle/base:v2 -f docker/v2/Dockerfile.base.v2 .
docker build -t vendingmachine/truffle/app:v2 -f docker/v2/Dockerfile.app.v2 .

docker run --rm vendingmachine/truffle/app:v2
```
