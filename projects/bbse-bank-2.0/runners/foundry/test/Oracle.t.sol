// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extensions/ExtendedDSTest.sol";
import "src/ETHBBSEPriceFeedOracle.sol";
import "src/BBSEToken.sol";
import "src/BBSEBank.sol";

abstract contract ETHBBSEPriceFeedOracleTest is ExtendedDSTest {

  ETHBBSEPriceFeedOracle internal oracle;
  BBSEToken internal bbseToken;
  BBSEBank internal bbseBank;

  event GetNewRate(string priceFeed);

  function setUp() public {
    oracle = new ETHBBSEPriceFeedOracle();
  }

  function deployOtherContracts() internal {
    bbseToken = new BBSEToken();
    bbseBank = new BBSEBank(address(bbseToken), 10, address(oracle));
  }

  function expectGetNewRateEventToBeEmitted(uint256 newBlockNumber) internal {
    // Deploy BBSEToken and BBSEBank contracts
    deployOtherContracts();

    // Set the block number with vm.roll
    vm.roll(newBlockNumber);

    // Expect the GetNewRate event to be emitted with ETH/BBSE as priceFeed
    vm.expectEmit(); emit GetNewRate("ETH/BBSE");

    // Get rate
    oracle.getRate();
  }
}

contract ETHBBSEPriceFeedOracleTest_SuccessScenarios is ETHBBSEPriceFeedOracleTest {

  // should initialize the lastUpdateBlock and rate correctly
  function test_1_SucceedIf_RateAndLastUpdateBlockAreInitializedCorrectly() public {
    // Get the rate and the latest block
    uint256 rate = oracle.getRate();
    uint256 blockNumber = block.number;

    assertEq(rate, 0, "Rate is not initialized correctly");
    assertEq(oracle.lastUpdateBlock(), blockNumber, "lastUpdateBlock is not initialized correctly");
  }

  // should update the rate correctly
  function test_2_SucceedIf_RateIsUpdatedCorrectly() public {
    // Update the rate
    uint256 newRate = 10;
    oracle.updateRate(newRate);

    assertEq(oracle.getRate(), newRate, "Rate is not updated correctly");
  }

  // should emit GetNewRate event with ETH/BBSE as the priceFeed, when getRate is called while the last rate update is older than 3 blocks
  function test_3_SucceedIf_GetNewRateEventIsEmittedWhenMaxPriceAgeIsReached() public {
    // Set the new block number so that the price age is older than the maximum age,
    // which means that the following condition is TRUE: block.number - lastUpdateBlock > oracle.MAX_PRICE_AGE
    uint256 newBlockNumber = oracle.MAX_PRICE_AGE() + oracle.lastUpdateBlock() + 1; // Price Age: Max Age + 1
    expectGetNewRateEventToBeEmitted(newBlockNumber);
  }
}

contract ETHBBSEPriceFeedOracleTest_FailureScenarios is ETHBBSEPriceFeedOracleTest {

  // should reject to update the rate
  function testFail_1_RevertWhen_NonOwnerUpdatesRate() public {
    // Try to update the rate from a non-owner account
    vm.prank(address(FIRST_ACC_ID)); // Inject a change of user to a non-owner one
    oracle.updateRate(10);
  }

  // should not emit GetNewRate when last rate update is not older than 3 blocks
  function testFail_2_RevertWhen_GetNewRateEventIsExpectedAlthoughMaxPriceAgeIsNotReached() public {
    // Set the new block number so that the price age is no more than the maximum age,
    // which means that the following condition is FALSE: block.number - lastUpdateBlock > oracle.MAX_PRICE_AGE
    uint256 newBlockNumber = oracle.MAX_PRICE_AGE() + oracle.lastUpdateBlock();
    expectGetNewRateEventToBeEmitted(newBlockNumber);
  }
}
