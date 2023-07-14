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
docker build -t vendingmachine/hardhat/base -f docker/Dockerfile.base .
docker build -t vendingmachine/hardhat/app -f docker/Dockerfile.app .

docker run --rm vendingmachine/hardhat/app
```
