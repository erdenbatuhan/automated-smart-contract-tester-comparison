// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/console.sol";
import "ds-test/test.sol";

// Cheat codes: https://github.com/foundry-rs/forge-std/blob/master/src/Vm.sol

interface Vm {

  function prank(address) external;
  function deal(address, uint256) external;
  function roll(uint256) external;
  function expectRevert() external;
  function expectRevert(bytes calldata) external;
  function expectEmit() external;
}

abstract contract ExtendedDSTest is DSTest {

  Vm internal constant vm = Vm(HEVM_ADDRESS); // HEVM_ADDRESS is 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D

  constructor() {}
}
