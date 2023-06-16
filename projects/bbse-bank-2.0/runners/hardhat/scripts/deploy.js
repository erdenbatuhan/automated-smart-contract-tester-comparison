const { ethers } = require("hardhat");

async function main() {
  const BBSEToken = await ethers.getContractFactory("BBSEToken");
  const BBSEBank = await ethers.getContractFactory("BBSEBank");
  const ETHBBSEPriceFeedOracle = await ethers.getContractFactory("ETHBBSEPriceFeedOracle");

  const bbseToken = await BBSEToken.deploy();
  const oracle = await ETHBBSEPriceFeedOracle.deploy();
  const bbseBank = await BBSEBank.deploy(bbseToken.target, 10, oracle.target);

  // Pass the minter role in BBSEToken to BBSEBank
  await bbseToken.passMinterRole(bbseBank.target);

  // Print the contract addresses
  console.log(`BBSEToken deployed to:`, bbseToken.target);
  console.log(`ETHBBSEPriceFeedOracle deployed to:`, oracle.target);
  console.log(`BBSEBank deployed to:`, bbseBank.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
