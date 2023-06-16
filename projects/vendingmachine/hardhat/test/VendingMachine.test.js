const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VendingMachine", () => {
  const INITIAL_BALANCE = 100;
  const DONUT_PRICE_IN_ETHERS = 2;

  let accounts;
  let vendingMachine;

  beforeEach(async () => {
    // Deploy the contract and get the accounts
    vendingMachine = await ethers.getContractFactory("VendingMachine").then(VendingMachine => VendingMachine.deploy());
    accounts = await ethers.getSigners();
  });

  it(`Ensures that the starting balance of the vending machine is ${INITIAL_BALANCE}, the initial balance`, async () => {
    const actualBalance = await vendingMachine.getVendingMachineBalance();
    const expectedBalance = INITIAL_BALANCE;

    expect(actualBalance).to.equal(expectedBalance, `The initial balance should be ${expectedBalance} donuts`);
  });

  it(`Ensures the balance of the vending machine can be updated`, async () => {
    const amountToBeRestocked = 100;

    await vendingMachine.restock(amountToBeRestocked);

    const actualBalance = await vendingMachine.getVendingMachineBalance();
    const expectedBalance = INITIAL_BALANCE + amountToBeRestocked;

    expect(actualBalance).to.equal(expectedBalance, `The balance should be ${expectedBalance} donuts after restocking`);
  });

  it(`Allows donuts to be purchased`, async () => {
    const amountToBePurchased = 40;
    const purchaseCost = ethers.parseEther((amountToBePurchased * DONUT_PRICE_IN_ETHERS).toString());

    // Purchase donuts
    await vendingMachine.purchase(amountToBePurchased, { value: purchaseCost });

    const actualBalance = await vendingMachine.getVendingMachineBalance();
    const expectedBalance = INITIAL_BALANCE - amountToBePurchased;

    expect(actualBalance).to.equal(expectedBalance, `The balance should be ${expectedBalance} donuts after sale`);
  });

  it(`Allows multiple accounts to purchase donuts`, async () => {
    const numBuyers = 4;
    const amountToBePurchased = 10;
    const purchaseCost = ethers.parseEther((amountToBePurchased * 2).toString());

    // Check donut balances of the buyers "before the purchase"
    for (let i = 1; i <= numBuyers; i++) {
      const buyerBalance = await vendingMachine.donutBalances(accounts[i]);
      expect(buyerBalance).to.equal(0, `Buyer ${i} should have no donuts in their balance`);
    }

    // Purchase donuts from each account
    for (let i = 1; i <= numBuyers; i++) {
      await vendingMachine.connect(accounts[i]).purchase(amountToBePurchased, { value: purchaseCost });
    }

    const actualBalance = await vendingMachine.getVendingMachineBalance();
    const expectedBalance = INITIAL_BALANCE - numBuyers * amountToBePurchased;

    // Check the balance of the vending machine
    expect(actualBalance).to.equal(expectedBalance, "The balance should be updated after multiple purchases");

    // Check donut balances of the buyers "after the purchase"
    for (let i = 1; i <= numBuyers; i++) {
      const buyerBalance = await vendingMachine.donutBalances(accounts[i]);
      expect(buyerBalance).to.equal(amountToBePurchased, `Buyer ${i} should have the purchased donuts in their balance`);
    }
  });

  it(`Prevents purchasing more donuts than available in the vending machine`, async () => {
    const amountToBePurchased = INITIAL_BALANCE + 1;
    const purchaseCost = ethers.parseEther((amountToBePurchased * DONUT_PRICE_IN_ETHERS).toString());

    // Attempt to purchase more donuts than available
    await expect(vendingMachine.purchase(amountToBePurchased, { value: purchaseCost })).to.be.revertedWith(
      "Not enough donuts in stock to complete this purchase"
    );
  });

  it(`Prevents purchasing donuts without providing sufficient payment`, async () => {
    const amountToBePurchased = 30;
    const purchaseCost = ethers.parseEther((amountToBePurchased * DONUT_PRICE_IN_ETHERS - 1).toString()); // Insufficient payment

    // Attempt to purchase without providing sufficient payment
    await expect(vendingMachine.purchase(amountToBePurchased, { value: purchaseCost })).to.be.revertedWith(
      "You must pay at least 2 ETH per donut"
    );
  });

  it(`Prevents non-owner addresses from restocking the vending machine`, async () => {
    // Attempt to restock from a non-owner address (Owner is accounts[0])
    await expect(vendingMachine.connect(accounts[5]).restock(10)).to.be.revertedWith("Only the owner can restock");
  });
});
