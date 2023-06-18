// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extensions/ExtendedDSTest.sol";
import "src/BBSEToken.sol";

abstract contract BBSETokenTest is ExtendedDSTest {

  BBSEToken internal bbseToken;

  function setUp() public {
    bbseToken = new BBSEToken();
  }
}

contract BBSETokenTest_SuccessScenarios is BBSETokenTest {

  // should set the token name correctly
  function test_1_SucceedIf_TokenNameIsSetCorrectly() public {
    assertEq(bbseToken.name(), "BBSE TOKEN", "Token name is not set correctly");
  }

  // should set the token symbol correctly
  function test_2_SucceedIf_TokenSymbolIsSetCorrectly() public {
    assertEq(bbseToken.symbol(), "BBSE", "Token symbol is not set correctly");
  }

  // should set the minter correctly
  function test_3_SucceedIf_MinterIsSetCorrectly() public {
    assertEq(bbseToken.minter(), address(this), "Minter is not set correctly"); // address(this) is the owner
  }

  // should pass minter role to second account in accounts
  function test_4_SucceedIf_MinterRoleIsPassedCorrectly() public {
    bbseToken.passMinterRole(address(FIRST_ACC_ID));
    assertEq(bbseToken.minter(), address(FIRST_ACC_ID), "Minter role is not passed correctly");
  }

  // should mint 10 tokens to second account in accounts
  function test_5_SucceedIf_TokensAreMintedCorrectly() public {
    bbseToken.mint(address(FIRST_ACC_ID), 10);
    assertEq(bbseToken.balanceOf(address(FIRST_ACC_ID)), 10, "Tokens are not minted correctly");
  }
}

contract BBSETokenTest_FailureScenarios is BBSETokenTest {

  // should reject minter role passing
  function test_1_RevertWhen_NonMinterPassesMinterRole() public {
    vm.prank(address(FIRST_ACC_ID)); // Inject a change of user to a non-minter one

    // Attempt to pass the minter role without being the minter and expect the call to be reverted
    vm.expectRevert(bytes("You are not the minter"));
    bbseToken.passMinterRole(address(FIRST_ACC_ID + 1));
  }

  // should reject token minting
  function test_2_RevertWhen_NonMinterMintsTokens() public {
    vm.prank(address(FIRST_ACC_ID)); // Inject a change of user to a non-minter one

    // Attempt to mint tokens without being the minter and expect the call to be reverted
    vm.expectRevert(bytes("You are not the minter"));
    bbseToken.mint(address(FIRST_ACC_ID), 10);
  }
}
