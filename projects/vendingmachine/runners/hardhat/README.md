# Vending Machine - Runners/Hardhat

Run make:

```bash
make
```

Helpful commands:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

Docker commands:

```bash
docker build -t vendingmachine/hardhat/base:v2 -f docker/v2/Dockerfile.base.v2 .
docker build -t vendingmachine/hardhat/app:v2 -f docker/v2/Dockerfile.app.v2 .

docker run --rm vendingmachine/hardhat/app:v2
```
