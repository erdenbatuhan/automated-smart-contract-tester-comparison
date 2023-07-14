# Vending Machine - Runners/Foundry

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t vendingmachine/foundry/base -f docker/Dockerfile.base .
docker build -t vendingmachine/foundry/app -f docker/Dockerfile.app .

docker run --rm vendingmachine/foundry/app
```
