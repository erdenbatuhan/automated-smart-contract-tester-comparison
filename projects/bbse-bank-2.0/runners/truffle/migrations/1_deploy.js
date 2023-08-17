/**
 * @file 1_deploy.js
 * @name BBSEBank-2.0-Deployer
 * @description This script is used to deploy the BBSEToken, BBSEBank, and ETHBBSEPriceFeedOracle contracts.
 * @author Burak Öz
 * 
 * B. Öz. BBSE Bank 2.0 GitHub Repository. https://github.com/sebischair/bbse-bank-2.0. Accessed: July 31, 2023. 2022.
 */

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
