const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BBSEToken", () => {
  let bbseToken;
  let accounts;

  beforeEach(async () => {
    // Deploy the contract and get the accounts
    bbseToken = await ethers.getContractFactory("BBSEToken").then(BBSEToken => BBSEToken.deploy());
    accounts = await ethers.getSigners();
  });

  /* 
   * Some methods called on BBSEToken are not directly implemented
   * by the BBSEToken contract itself. They are inherited from the ERC20
   * implementation of OpenZeppelin.
   */

  // Success scenarios
  describe("success", () => {
    it("should set the token name correctly", async () => {
      expect(await bbseToken.name()).to.be.equal("BBSE TOKEN", "Token name is not set correctly");
    });

    it("should set the token symbol correctly", async () => {
      expect(await bbseToken.symbol()).to.be.equal("BBSE", "Token symbol is not set correctly");
    });

    it("should set the minter correctly", async () => {
      expect(await bbseToken.minter()).to.be.equal(accounts[0].address, "Minter is not set correctly"); // accounts[0] is the default deployer account
    });

    it("should pass minter role to second account in accounts", async () => {
      await bbseToken.passMinterRole(accounts[1]); // Now the minter is accounts[1]
      expect(await bbseToken.minter()).to.be.equal(accounts[1].address, "Minter role is not passed correctly");
    });

    it("should mint 10 tokens to second account in accounts", async () => {
      await bbseToken.mint(accounts[1], 10);
      expect(await bbseToken.balanceOf(accounts[1])).to.be.equal(10, "Tokens are not minted correctly");
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject minter role passing", async () => {
      // Try to pass the minter role without being the minter
      await expect(bbseToken.connect(accounts[1]).passMinterRole(accounts[1])).to.be.revertedWith(
        "You are not the minter"
      );
    });

    it("should reject token minting", async () => {
      // Try to mint tokens without being the minter
      await expect(bbseToken.connect(accounts[1]).mint(accounts[1], 10)).to.be.revertedWith(
        "You are not the minter"
      );
    });
  });
});
