// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "forge-std/Test.sol";
import "../src/VendingMachine.sol";

contract TestVendingMachine is Test {
  VendingMachine vendingMachine;

  function setUp() public {
    vendingMachine = new VendingMachine();
  }

  function testInitialVendingMachineBalance() public {
    uint expectedBalance = 100;
    uint balance = vendingMachine.getVendingMachineBalance();
    assertEq(balance, expectedBalance, "Initial vending machine balance should be 100");
  }

  function testRestockByOwner() public {
    uint amount = 50;
    uint initialBalance = vendingMachine.getVendingMachineBalance();

    vendingMachine.restock(amount);
    uint balance = vendingMachine.getVendingMachineBalance();
    assertEq(balance, initialBalance + amount, "Restocking by owner should increase the balance");
  }

  function testRestockByNonOwner() public {
    address nonOwner = address(0x1);
    uint amount = 50;
    uint initialBalance = vendingMachine.getVendingMachineBalance();

    (bool success, ) = address(vendingMachine).call{sender: nonOwner}(
        abi.encodeWithSignature("restock(uint256)", amount)
    );
    assertFalse(success, "Restocking by non-owner should fail");

    uint balance = vendingMachine.getVendingMachineBalance();
    assertEq(balance, initialBalance, "Restocking by non-owner should not affect the balance");
  }

  function testPurchaseWithSufficientPaymentAndEnoughDonuts() public {
    uint amount = 10;
    uint payment = amount * 2 ether;
    uint expectedBalance = 100 - amount;
    address buyer = address(0x1);
    uint initialBuyerBalance = vendingMachine.donutBalances(buyer);

    (bool success, ) = address(vendingMachine).call{ value: payment, sender: buyer }(
        abi.encodeWithSignature("purchase(uint256)", amount)
    );
    assertTrue(success, "Purchase should succeed");

    uint balance = vendingMachine.getVendingMachineBalance();
    uint buyerDonutBalance = vendingMachine.donutBalances(buyer);
    assertEq(balance, expectedBalance, "Vending machine balance should be reduced");
    assertEq(buyerDonutBalance, initialBuyerBalance + amount, "Buyer donut balance should increase");
  }

  function testPurchaseWithSufficientPaymentAndEnoughDonuts() public {
    uint amount = 10;
    uint payment = amount * 2 ether;
    uint expectedBalance = 100 - amount;
    address buyer = address(0x1);
    uint initialBuyerBalance = vendingMachine.donutBalances(buyer);

    bool success = address(vendingMachine){ value: payment }(abi.encodeWithSignature("purchase(uint256)", amount));
    assertTrue(success, "Purchase should succeed");

    uint balance = vendingMachine.getVendingMachineBalance();
    uint buyerDonutBalance = vendingMachine.donutBalances(buyer);
    assertEq(balance, expectedBalance, "Vending machine balance should be reduced");
    assertEq(buyerDonutBalance, initialBuyerBalance + amount, "Buyer donut balance should increase");
  }

  function testPurchaseWithNotEnoughDonuts() public {
    uint amount = 200;
    uint payment = amount * 2 ether;
    uint initialBalance = vendingMachine.getVendingMachineBalance();
    address buyer = address(0x1);
    uint initialBuyerBalance = vendingMachine.donutBalances(buyer);

    (bool success, ) = address(vendingMachine).call{ value: payment, sender: buyer }(
        abi.encodeWithSignature("purchase(uint256)", amount)
    );
    assertFalse(success, "Purchase with not enough donuts should fail");

    uint balance = vendingMachine.getVendingMachineBalance();
    uint buyerDonutBalance = vendingMachine.donutBalances(buyer);
    assertEq(balance, initialBalance, "Vending machine balance should remain unchanged");
    assertEq(buyerDonutBalance, initialBuyerBalance, "Buyer donut balance should remain unchanged");
  }
}
