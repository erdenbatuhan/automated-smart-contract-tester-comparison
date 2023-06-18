// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extensions/ExtendedDSTest.sol";
import "src/BBSEToken.sol";

abstract contract BBSETokenTest is ExtendedDSTest {

  BBSEToken public bbseToken;

  function setUp() public {
    bbseToken = new BBSEToken();
  }
}

contract BBSETokenTest_SuccessScenarios is BBSETokenTest {

  function test_1_SucceedIf_TokenNameIsSetCorrectly() public {
    assertEq(bbseToken.name(), "BBSE TOKEN", "Token name is not set correctly");
  }

  function test_2_SucceedIf_TokenSymbolIsSetCorrectly() public {
    assertEq(bbseToken.symbol(), "BBSE", "Token symbol is not set correctly");
  }

  function test_3_SucceedIf_MinterIsSetCorrectly() public {
    assertEq(bbseToken.minter(), address(this), "Minter is not set correctly"); // address(this) is the owner
  }

  function test_4_SucceedIf_MinterRoleIsPassedCorrectly() public {
    bbseToken.passMinterRole(address(1));
    assertEq(bbseToken.minter(), address(1), "Minter role is not passed correctly");
  }

  function test_5_SucceedIf_TokensAreMintedCorrectly() public {
    bbseToken.mint(address(1), 10);
    assertEq(bbseToken.balanceOf(address(1)), 10, "Tokens are not minted correctly");
  }
}

contract BBSETokenTest_FailureScenarios is BBSETokenTest {

  function test_1_RevertWhen_NonMinterPassesMinterRole() public {
    vm.prank(address(1)); // Inject a change of user to a non-minter one

    // Attempt to pass the minter role without being the minter and expect the call to be reverted
    vm.expectRevert(bytes("You are not the minter"));
    bbseToken.passMinterRole(address(2));
  }

  function test_2_RevertWhen_NonMinterMintsTokens() public {
    vm.prank(address(1)); // Inject a change of user to a non-minter one

    // Attempt to mint tokens without being the minter and expect the call to be reverted
    vm.expectRevert(bytes("You are not the minter"));
    bbseToken.mint(address(1), 10);
  }
}
