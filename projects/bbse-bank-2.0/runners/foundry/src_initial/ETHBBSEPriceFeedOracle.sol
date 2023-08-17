/**
 * @title ETHBBSEPriceFeedOracle
 * @dev A smart contract for providing the ETH/BBSE price feed.
 * @author Burak Öz
 * 
 * B. Öz. BBSE Bank 2.0 GitHub Repository. https://github.com/sebischair/bbse-bank-2.0. Accessed: July 31, 2023. 2022.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "forge-std/console.sol";

contract ETHBBSEPriceFeedOracle is Ownable {
  // Max number of blocks before a price update is required
  uint8 public constant MAX_PRICE_AGE = 3;

  // ETH/BBSE rate
  uint private rate;

  // Block number of the last rate update.
  uint public lastUpdateBlock;

  // An event that indicates the price of the priceFeed should be updated
  // Must be listened by the oracle server
  event GetNewRate (string priceFeed);
  
  /**
  * @dev Initializes lastUpdateBlock to current block number and rate to 0.
  * Emits GetNewRate to trigger the oracle server to update the rate.
  * The priceFeed parameter of GetNewRate should be ETH/BBSE
  */
  constructor () { 
    // TODO
  }

  /**
  * @dev Updates the rate and sets the lastUpdateBlock to current block number.
  * Can only be called by the owner of the oracle contract.
  * Can't be called internally.
  * @param _rate new rate of the price feed.
  */
  function updateRate (uint _rate) external onlyOwner {
    // TODO
  }

  /**
  * @dev Returns the current rate.
  * If rate was updated more than MAX_PRICE_AGE block ago,
  * emits GetNewRate event to trigger the oracle server.
  */
  function getRate () public returns (uint){
    // TODO
  }
}
