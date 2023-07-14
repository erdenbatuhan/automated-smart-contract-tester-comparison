# Vending Machine - Runners/Truffle

Run make:

```bash
make
```

Docker commands:

```bash
docker build -t vendingmachine/truffle/base -f docker/Dockerfile.base .
docker build -t vendingmachine/truffle/app -f docker/Dockerfile.app .

docker run --rm vendingmachine/truffle/app
```
