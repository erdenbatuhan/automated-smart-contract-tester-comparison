const BBSEToken = artifacts.require("BBSEToken");

contract("BBSEToken", (accounts) => {
  let bbseToken;

  // A new instance of the BBSEToken contract is set before each test case.
  beforeEach(async () => {
    bbseToken = await BBSEToken.new();
  });

  /* Some methods called on bbseToken are not directly implemented
   * by the BBSEToken contract itself. They are inherited from the ERC20
   * implementation of OpenZeppelin.
   */

  // Success scenarios
  describe("success", () => {
    it("should set the token name correctly", async () => {
      assert.equal(await bbseToken.name(), "BBSE TOKEN");
    });

    it("should set the token symbol correctly", async () => {
      assert.equal(await bbseToken.symbol(), "BBSE");
    });

    it("should set the minter correctly", async () => {
      assert.equal(await bbseToken.minter(), accounts[0]); // accounts[0] is the default deployer account
    });

    it("should pass minter role to second account in accounts", async () => {
      await bbseToken.passMinterRole(accounts[1], { from: accounts[0] });
      assert.equal(await bbseToken.minter(), accounts[1]);
    });

    it("should mint 10 tokens to second account in accounts", async () => {
      await bbseToken.mint(accounts[1], 10, { from: accounts[0] });
      assert.equal(await bbseToken.balanceOf(accounts[1]), 10);
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject minter role passing", async () => {
      let err;
      try {
        await bbseToken.passMinterRole(accounts[1], { from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "You are not the minter"); // Use this error message in your passMinterRole function
    });

    it("should reject token minting", async () => {
      let err;
      try {
        await bbseToken.mint(accounts[1], 10, { from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "You are not the minter"); // Use this error message in your mint function
    });
  });
});
