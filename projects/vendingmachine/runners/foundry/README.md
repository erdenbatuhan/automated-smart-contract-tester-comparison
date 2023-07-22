# Vending Machine - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t vendingmachine/foundry/base:v5 -f docker/v5/Dockerfile.base.v5 .
docker build -t vendingmachine/foundry/app:v5 -f docker/v5/Dockerfile.app.v5 .

docker run --rm vendingmachine/foundry/app:v5
```
