# BBSE Bank 2.0 - Runners/Hardhat

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
docker build -t bbsebank2/hardhat/base -f docker/Dockerfile.base .
docker build -t bbsebank2/hardhat/app -f docker/Dockerfile.app .

docker run --rm bbsebank2/hardhat/app
```
