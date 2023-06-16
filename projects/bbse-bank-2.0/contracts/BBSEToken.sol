// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BBSEToken is ERC20 {
  // Minter state variable
  address public minter;

  /**
  * @dev Calls the ERC20 constructor with {name} and {symbol} values.
  * Sets the minter as the contract deployer.
  */
  constructor() public payable ERC20("BBSE TOKEN", "BBSE") {
    // Set deployer of the contract as the initial minter
    minter = msg.sender;
  }

  /**
  * @dev Passes the minter role to another address.
  * The minter role can only be passed by the current minter.
  * @param _minter address of the new minter
  */
  function passMinterRole(address _minter) public {
    // Check if msg.sender have minter role
    require(msg.sender == minter, "You are not the minter");
		minter = _minter;
	}

  /**
  * @dev Mints new tokens.
  * Only the minter can mint new tokens.
  * @param account address of receiver of the tokens
  * @param amount amount of the tokens to be issued
  */
  function mint(address account, uint256 amount) public {
    // Check if msg.sender have minter role
    require(msg.sender == minter, "You are not the minter");
		_mint(account, amount);
	}
}