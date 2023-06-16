// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

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
  constructor () public { 
    lastUpdateBlock = block.number;
    rate = 0;
    emit GetNewRate("ETH/BBSE");
  }

  /**
  * @dev Updates the rate and sets the lastUpdateBlock to current block number.
  * Can only be called by the owner of the oracle contract.
  * Can't be called internally.
  * @param _rate new rate of the price feed.
  */
  function updateRate (uint _rate) external onlyOwner {
    rate = _rate;
    lastUpdateBlock = block.number;
  }

  /**
  * @dev Returns the current rate.
  * If rate was updated more than MAX_PRICE_AGE block ago,
  * emits GetNewRate event to trigger the oracle server.
  */
  function getRate () public returns (uint){
    if ((block.number - lastUpdateBlock) > MAX_PRICE_AGE) {
      emit GetNewRate("ETH/BBSE");
    }
    return rate;
  }
}