const BBSEToken = artifacts.require("BBSEToken");
const BBSEBank = artifacts.require("BBSEBank");
const ETHBBSEPriceFeedOracle = artifacts.require("ETHBBSEPriceFeedOracle");

module.exports = async function (deployer) {
  // Deploy BBSEToken
  await deployer.deploy(BBSEToken);
  const bbseToken = await BBSEToken.deployed();

  // Deploy ETHBBSEPriceFeedOracle
  const oracle = await deployer.deploy(ETHBBSEPriceFeedOracle);

  // Deploy BBSEBank with BBSEToken contract's address, a yearly return rate of 10, and oracle address
  await deployer.deploy(BBSEBank, bbseToken.address, 10, oracle.address);
  const bbseBank = await BBSEBank.deployed();

  // Pass the minter role in BBSEToken to BBSEBank
  await bbseToken.passMinterRole(bbseBank.address);
};
