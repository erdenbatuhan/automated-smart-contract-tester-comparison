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
docker build -t bbsebank2/hardhat/base:v2 -f docker/v2/Dockerfile.base.v2 .
docker build -t bbsebank2/hardhat/app:v2 -f docker/v2/Dockerfile.app.v2 .

docker run --rm bbsebank2/hardhat/app:v2
```
