const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHBBSEPriceFeedOracle", () => {
  const YEARLY_RETURN_RATE = 10;

  let oracle, bbseToken, bbseBank;
  let accounts;

  /**
   * A helper function to get the rate without changing the state
   * 
   * ---------------------
   *  staticCall
   * ---------------------
   * Here we use staticCall as invoking getRate normally requires a transaction.
   * With staticCall, we can access the return value without changing the state.
   * Also, the return value of a function call executed on-chain cannot be returned off-chain.
   * So, calling getRate wouldn't return the value that we want.
   */
  const getRate = async () => await oracle.getRate.staticCall();

  // A helper function to deploy other contracts (BBSEToken and BBSEBank)
  const deployOtherContracts = async () => {
    // Deploy the contracts
    bbseToken = await ethers.getContractFactory("BBSEToken")
      .then(BBSEToken => BBSEToken.deploy());
    bbseBank = await ethers.getContractFactory("BBSEBank")
      .then(BBSEBank => BBSEBank.deploy(bbseToken.target, YEARLY_RETURN_RATE, oracle.target));
  };

  beforeEach(async () => {
    // Deploy the contract
    oracle = await ethers.getContractFactory("ETHBBSEPriceFeedOracle")
      .then(ETHBBSEPriceFeedOracle => ETHBBSEPriceFeedOracle.deploy());

    // Get the accounts
    accounts = await ethers.getSigners();
  });

  // Success scenarios
  describe("success", () => {
    it("should initialize the lastUpdateBlock and rate correctly", async () => {
      // Get the rate and the latest block
      const rate = await getRate();
      const block = await ethers.provider.getBlock("latest");

      expect(rate).to.equal(0, "Rate is not initialized correctly");
      expect(await oracle.lastUpdateBlock()).to.equal(block.number, "lastUpdateBlock is not initialized correctly");
    });

    it("should update the rate correctly", async () => {
      // Update the rate
      const newRate = 10;
      await oracle.updateRate(newRate);

      expect(await getRate()).to.equal(newRate, "Rate is not updated correctly");
    });

    it("should emit GetNewRate event with ETH/BBSE as the priceFeed, when getRate is called while the last rate update is older than 3 blocks", async () => {
      // Deploy BBSEToken and BBSEBank contracts
      await deployOtherContracts();

      // Increase the block number by making some random transactions
      await bbseBank.connect(accounts[1]).deposit({ value: ethers.parseEther("1") });
      await bbseBank.connect(accounts[2]).deposit({ value: ethers.parseEther("1") });

      // Get rate to see that the GetNewRate event is emitted with ETH/BBSE as priceFeed
      await expect(oracle.connect(accounts[1]).getRate()).to.emit(oracle, "GetNewRate").withArgs("ETH/BBSE");
    });

    it("should not emit GetNewRate when last rate update is not older than 3 blocks", async () => {
      // Deploy BBSEToken and BBSEBank contracts
      await deployOtherContracts();

      // Get rate without emitting GetNewRate event
      await expect(oracle.connect(accounts[1]).getRate()).to.not.emit(oracle, "GetNewRate");
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject to update the rate", async () => {
      // Try to update the rate from a non-owner account
      await expect(oracle.connect(accounts[1]).updateRate(10)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
