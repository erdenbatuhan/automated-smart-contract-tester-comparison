// Import the required libraries
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VendingMachine", function () {
  const INITIAL_BALANCE = 100;
  const DONUT_PRICE_IN_ETHERS = 2;

  let accounts;
  let vendingMachine;

  beforeEach(async function () {
    // Deploy the contract and get the owner address
    accounts = await ethers.getSigners();
    vendingMachine = await ethers.getContractFactory("VendingMachine").then(VendingMachine => VendingMachine.deploy());
  });

  it("should have the owner set correctly", async function () {
    expect(await vendingMachine.owner()).to.equal(accounts[0].address);
  });

  it("should have the initial vending machine balance set correctly", async function () {
    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE);
  });

  it("should allow the owner to restock the vending machine", async function () {
    const amount = 50;

    // Restock the vending machine
    await vendingMachine.restock(amount);

    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE + amount);
  });

  it("should not allow non-owner to restock the vending machine", async function () {
    const nonOwner = accounts[1]; // Owner is accounts[0]

    // Try to restock the vending machine without being the owner
    await expect(vendingMachine.connect(nonOwner).restock(50))
      .to.be.revertedWith("Only the owner can restock.");

    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE);
  });

  it("should allow a purchase when payment is sufficient and there are enough donuts", async function () {
    const buyer = accounts[1];
    const amount = 10;
    const payment = ethers.parseEther((amount * DONUT_PRICE_IN_ETHERS).toString());

    // Make a purchase
    await vendingMachine.connect(buyer).purchase(amount, { value: payment });

    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE - amount);
    expect(await vendingMachine.donutBalances(buyer.address)).to.equal(amount);
  });

  it("should not allow a purchase when payment is insufficient", async function () {
    const buyer = accounts[1];
    const amount = 10;
    const payment = ethers.parseEther((amount * DONUT_PRICE_IN_ETHERS - 1).toString());

    // Try to make a purchase
    await expect(vendingMachine.connect(buyer).purchase(amount, { value: payment }))
      .to.be.revertedWith("You must pay at least 2 ETH per donut");

    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE);
    expect(await vendingMachine.donutBalances(buyer.address)).to.equal(0);
  });

  it("should not allow a purchase when there are not enough donuts", async function () {
    const buyer = accounts[1];
    const amount = INITIAL_BALANCE + 1;
    const payment = ethers.parseEther((amount * DONUT_PRICE_IN_ETHERS).toString());

    // Try to make a purchase
    await expect(vendingMachine.connect(buyer).purchase(amount, { value: payment }))
      .to.be.revertedWith("Not enough donuts in stock to complete this purchase");

    expect(await vendingMachine.getVendingMachineBalance()).to.equal(INITIAL_BALANCE);
    expect(await vendingMachine.donutBalances(buyer.address)).to.equal(0);
  });
});
