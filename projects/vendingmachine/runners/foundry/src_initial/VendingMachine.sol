/**
 * @title VendingMachine
 * @author Jonathan Spruance
 * 
 * J. Spruance. Vending Machine Source Code. https://github.com/jspruance/block-explorer-tutorials/blob/main/apps/VendingMachine/vending-machine/contracts/VendingMachine.sol. Accessed: July 31, 2023. 2022.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract VendingMachine {

  // state variables
  address public owner;
  mapping (address => uint) public donutBalances;

  // set the owner as th address that deployed the contract
  // set the initial vending machine balance to 100
  constructor() {
    // TODO
  }

  function getVendingMachineBalance() public view returns (uint) {
    // TODO
  }

  // Let the owner restock the vending machine
  function restock(uint amount) public {
    // TODO
  }

  // Purchase donuts from the vending machine
  function purchase(uint amount) public payable {
    // TODO
  }
}
