// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "forge-std/console.sol";
import "ds-test/test.sol";
import "../src/VendingMachine.sol";

interface Vm {

  function expectRevert(bytes calldata) external;
  function prank(address) external;
  function deal(address, uint256) external;
}

contract TestVendingMachine is DSTest {

  uint256 private constant INITIAL_BALANCE = 100;
  uint256 private constant DONUT_PRICE_IN_ETHERS = 2;

  Vm private vm = Vm(HEVM_ADDRESS); // HEVM_ADDRESS is 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D
  VendingMachine private vendingMachine;

  function setUp() public {
    vendingMachine = new VendingMachine();
  }

  // Ensures that the starting balance of the vending machine is the initial balance
  function test_1_SucceedIf_InitialBalanceIsAsExpected() public {
    uint256 actualBalance = vendingMachine.getVendingMachineBalance();
    uint256 expectedBalance = INITIAL_BALANCE;

    assertEq(actualBalance, expectedBalance, "The initial balance should be the expected value");
  }

  // Ensures the balance of the vending machine can be updated
  function test_2_SucceedIf_BalanceUpdateSucceeds() public {
    uint256 amountToBeRestocked = 100;

    vendingMachine.restock(amountToBeRestocked);

    uint256 actualBalance = vendingMachine.getVendingMachineBalance();
    uint256 expectedBalance = INITIAL_BALANCE + amountToBeRestocked;

    assertEq(actualBalance, expectedBalance, "The balance should be updated after restocking");
  }

  // Allows donuts to be purchased
  function test_3_SucceedIf_DonutsCanBePurchased() public {
    uint256 amountToBePurchased = 40;
    uint256 purchaseCost = amountToBePurchased * DONUT_PRICE_IN_ETHERS * 1 ether;

    // Purchase donuts
    vendingMachine.purchase{value: purchaseCost}(amountToBePurchased);

    uint256 actualBalance = vendingMachine.getVendingMachineBalance();
    uint256 expectedBalance = INITIAL_BALANCE - amountToBePurchased;

    assertEq(actualBalance, expectedBalance, "The balance should be updated after sale");
  }

  // Allows multiple accounts to purchase donuts
  function test_4_SucceedIf_MultipleAccountsCanPurchase() public {
    uint256 numBuyers = 4;
    uint256 amountToBePurchased = 10;
    uint256 purchaseCost = amountToBePurchased * DONUT_PRICE_IN_ETHERS * 1 ether;

    // Check donut balances of the buyers "before the purchase"
    for (uint160 i = 1; i <= numBuyers; i++) {
      uint256 buyerBalance = vendingMachine.donutBalances(address(i));
      assertEq(buyerBalance, 0, "Buyer should have no donuts in their balance");
    }

    // Purchase donuts by each buyer (different accounts)
    for (uint160 i = 1; i <= numBuyers; i++) {
      // inject a change of user and give them enough ethers to make the purchase
      vm.prank(address(i));
      vm.deal(address(i), purchaseCost);

      vendingMachine.purchase{value: purchaseCost}(amountToBePurchased);
    }

    uint256 actualBalance = vendingMachine.getVendingMachineBalance();
    uint256 expectedBalance = INITIAL_BALANCE - numBuyers * amountToBePurchased;

    // Check the balance of the vending machine
    assertEq(actualBalance, expectedBalance, "The balance should be updated after multiple purchases");

    // Check donut balances of the buyers "after the purchase"
    for (uint160 i = 1; i <= numBuyers; i++) {
      uint256 buyerBalance = vendingMachine.donutBalances(address(i));
      assertEq(buyerBalance, amountToBePurchased, "Buyer should have the purchased donuts in their balance");
    }
  }

  // Prevents purchasing more donuts than available in the vending machine
  function test_5_RevertWhen_InsufficientDonutsAvailable() public {
    uint256 amountToBePurchased = INITIAL_BALANCE + 1; // More than available donuts
    uint256 purchaseCost = amountToBePurchased * DONUT_PRICE_IN_ETHERS * 1 ether;

    // Attempt to purchase more donuts than available
    vm.expectRevert(bytes("Not enough donuts in stock to complete this purchase"));
    vendingMachine.purchase{value: purchaseCost}(amountToBePurchased);
  }

  // Prevents purchasing donuts without providing sufficient payment
  function test_6_RevertWhen_InsufficientPaymentProvided() public {
    uint256 amountToBePurchased = 30;
    uint256 purchaseCost = amountToBePurchased * DONUT_PRICE_IN_ETHERS * 1 ether - 1; // Insufficient payment

    // Attempt to purchase without providing sufficient payment and expect the call to be reverted
    vm.expectRevert(bytes("You must pay at least 2 ETH per donut"));
    vendingMachine.purchase{value: purchaseCost}(amountToBePurchased);
  }

  // Prevents non-owner addresses from restocking the vending machine
  function test_7_RevertWhen_NonOwnerRestocks() public {
    // inject a change of user to a non-owner one, which is not address(this)
    vm.prank(address(5));

    // Attempt to restock from a non-owner address and expect the call to be reverted
    vm.expectRevert(bytes("Only the owner can restock"));
    vendingMachine.restock(10);
  }
}
