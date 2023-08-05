# Vending Machine - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t vendingmachine/foundry/base:v3 -f docker/ubuntu/v3/Dockerfile.base.v3 .
docker build -t vendingmachine/foundry/app:v3 -f docker/ubuntu/v3/Dockerfile.app.v3 .

docker run --rm vendingmachine/foundry/app:v3
```
