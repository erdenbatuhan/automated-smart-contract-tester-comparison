const truffleAssert = require("truffle-assertions"); // Used for checking events
const ETHBBSEPriceFeedOracle = artifacts.require("ETHBBSEPriceFeedOracle");
const BBSEBank = artifacts.require("BBSEBank");
const BBSEToken = artifacts.require("BBSEToken");

contract("ETHBBSEPriceFeedOracle", (accounts) => {
  let oracle;

  // A new instance of the ETHBBSEPriceFeedOracle contract is set before each test case.
  beforeEach(async () => {
    oracle = await ETHBBSEPriceFeedOracle.new();
  });

  // Success scenarios
  describe("success", () => {
    it("should initalize the lastUpdateBlock and rate correctly", async () => {
      // Here we use call() as invoking getRate normally requires a transaction
      // With call(), we can access the return value without changing the state
      const rate = await oracle.getRate.call();
      assert.equal(rate, 0);
      const block = await web3.eth.getBlock("latest");
      assert.equal(await oracle.lastUpdateBlock(), block.number);
    });

    it("should update the rate correctly", async () => {
      await oracle.updateRate(10, { from: accounts[0] });
      const rate = await oracle.getRate.call();
      assert.equal(rate, 10);
    });

    it("should emit GetNewRate event with ETH/BBSE as the priceFeed, when getRate is called while the last rate update is older than 3 blocks", async () => {
      bbseToken = await BBSEToken.new();
      bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);

      // Some random transactions to increase the block number
      await bbseBank.deposit({ from: accounts[1], value: 10 ** 18 });
      await bbseBank.deposit({ from: accounts[2], value: 10 ** 18 });

      const tx = await oracle.getRate({ from: accounts[1] });

      let err;
      try {
        truffleAssert.eventEmitted(tx, "GetNewRate", (event) => {
          if (event.priceFeed == "ETH/BBSE") {
            return true;
          }
          err = "GetNewRate's priceFeed should be set to ETH/BBSE";
        });
      } catch (e) {
        err = e;
      }

      // If GetNewRate is emitted with ETH/BBSE as the priceFeed, then err will be undefined
      assert.equal(err, undefined);
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject to update the rate", async () => {
      let err;
      try {
        await oracle.updateRate(10, { from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Ownable: caller is not the owner"); // Thrown by the Ownable contract
    });

    it("should not emit GetNewRate when last rate update is not older than 3 blocks", async () => {
      bbseToken = await BBSEToken.new();
      bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);

      const tx = await oracle.getRate({ from: accounts[1] });

      let err;
      try {
        truffleAssert.eventEmitted(tx, "GetNewRate", (event) => {
          return true;
        });
      } catch (e) {
        err = e;
      }

      // If err = undefined, this means GetNewRate is emitted
      assert.notEqual(err, undefined);
    });
  });
});
