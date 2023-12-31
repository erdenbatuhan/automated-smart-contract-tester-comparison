contract("VendingMachine", (accounts) => {
  const VendingMachine = artifacts.require("VendingMachine");

  const INITIAL_BALANCE = 100;
  const DONUT_PRICE_IN_ETHERS = 2;

  before(async () => {
    // Deploy the contract and set the current balance to be updated during the test and used as the expected balance
    instance = await VendingMachine.deployed();
    currentBalance = INITIAL_BALANCE;
  });

  it(`Ensures that the starting balance of the vending machine is ${INITIAL_BALANCE}, the initial balance`, async () => {
    const actualBalance = await instance.getVendingMachineBalance();
    assert.equal(actualBalance, currentBalance, `The initial balance should be ${currentBalance} donuts`);
  });

  it(`Ensures the balance of the vending machine can be updated`, async () => {
    const amountToBeRestocked = 100;

    await instance.restock(amountToBeRestocked);
    currentBalance += amountToBeRestocked;

    const actualBalance = await instance.getVendingMachineBalance();
    assert.equal(actualBalance, currentBalance, `The balance should be ${currentBalance} donuts after restocking`);
  });

  it(`Allows donuts to be purchased`, async () => {
    const amountToBePurchased = 2;
    const purchaseCost = web3.utils.toWei((amountToBePurchased * DONUT_PRICE_IN_ETHERS).toString(), "ether");

    await instance.purchase(amountToBePurchased, { from: accounts[0], value: purchaseCost });
    currentBalance -= amountToBePurchased;

    const actualBalance = await instance.getVendingMachineBalance();
    assert.equal(actualBalance, currentBalance, `The balance should be ${currentBalance} donuts after sale`);
  });

  it(`Allows multiple accounts to purchase donuts`, async () => {
    const numBuyers = 4;
    const amountToBePurchased = 2;
    const purchaseCost = web3.utils.toWei((amountToBePurchased * 2).toString(), "ether");

    // Check donut balances of the buyers "before the purchase"
    for (let i = 1; i <= numBuyers; i++) {
      const buyerBalance = await instance.donutBalances(accounts[i]);
      assert.equal(buyerBalance, 0, `Buyer ${i} should have no donuts in their balance`);
    }

    // Purchase donuts from each account
    for (let i = 1; i <= numBuyers; i++) {
      await instance.purchase(amountToBePurchased, { from: accounts[i], value: purchaseCost });
      currentBalance -= amountToBePurchased;
    }

    // Check the balance of the vending machine
    const actualBalance = await instance.getVendingMachineBalance();
    assert.equal(actualBalance, currentBalance, "The balance should be updated after multiple purchases");

    // Check donut balances of the buyers "after the purchase"
    for (let i = 1; i <= numBuyers; i++) {
      const buyerBalance = await instance.donutBalances(accounts[i]);
      assert.equal(buyerBalance, amountToBePurchased, `Buyer ${i} should have the purchased donuts in their balance`);
    }
  });

  it(`Prevents purchasing more donuts than available in the vending machine`, async () => {
    const amountToBePurchased = currentBalance + 1;
    const purchaseCost = web3.utils.toWei((amountToBePurchased * DONUT_PRICE_IN_ETHERS).toString(), "ether");
  
    // Attempt to purchase more donuts than available
    try {
      await instance.purchase(amountToBePurchased, { from: accounts[0], value: purchaseCost });
      assert.fail("Expected revert when purchasing more donuts than available");
    } catch (error) {
      assert(error.message.includes("Not enough donuts in stock"), "Purchase should fail due to insufficient donuts");
    }
  });
  
  it(`Prevents purchasing donuts without providing sufficient payment`, async () => {
    const amountToBePurchased = 3;
    const purchaseCost = web3.utils.toWei((amountToBePurchased * DONUT_PRICE_IN_ETHERS - 1).toString(), "ether"); // Insufficient payment
  
    // Attempt to purchase without providing sufficient payment
    try {
      await instance.purchase(amountToBePurchased, { from: accounts[0], value: purchaseCost });
      assert.fail("Expected revert when purchasing without sufficient payment");
    } catch (error) {
      assert(error.message.includes("You must pay at least"), "Purchase should fail due to insufficient payment");
    }
  });

  it(`Prevents non-owner addresses from restocking the vending machine`, async () => {
    // Attempt to restock from a non-owner address (Owner is accounts[0])
    try {
      await instance.restock(10, { from: accounts[5] });
      assert.fail("Expected revert when non-owner tries to restock");
    } catch (error) {
      assert(error.message.includes("Only the owner can restock"), "Restocking should fail for non-owner");
    }
  });
});
