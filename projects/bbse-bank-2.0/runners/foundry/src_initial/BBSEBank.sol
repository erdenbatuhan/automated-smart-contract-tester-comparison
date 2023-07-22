/**
 * @title BBSEBank
 * @dev A smart contract for managing a banking system using the BBSE token.
 * @author Burak Öz
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BBSEToken.sol";
import "./ETHBBSEPriceFeedOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "forge-std/console.sol";

contract BBSEBank is Ownable {
  // BBSE Token Contract instance
  BBSEToken private bbseTokenContract;

  // ETHBBSEPriceFeedOracle Contract instance
  ETHBBSEPriceFeedOracle private oracleContract;
  
  // Yearly return rate of the bank
  uint32 public yearlyReturnRate;
  
  // Seconds in a year
  uint32 public constant YEAR_SECONDS = 31536000; 

  // Average block time (set to a large number in order to increase the paid interest i.e., BBSE tokens)
  uint32 public constant AVG_BLOCK_TIME = 10000000;
  
  // Minimum deposit amount (1 Ether, expressed in Wei)
  uint public constant MIN_DEPOSIT_AMOUNT = 10**18;

  /* Min. Ratio (Collateral value / Loan value)
   * Example: To take a 1 ETH loan,
   * an asset worth of at least 1.5 ETH must be collateralized.
  */
  uint8 public constant COLLATERALIZATION_RATIO = 150;

  // 1% of every collateral is taken as fee
  uint8 public constant LOAN_FEE_RATE = 1;

  /* Interest earned per second for a minumum deposit amount.
   * Equals to the yearly return of the minimum deposit amount
   * divided by the number of seconds in a year.
  */
  uint public interestPerSecondForMinDeposit;

  /* The value of the total deposited ETH.
   * BBSEBank shouldn't be giving loans where requested amount + totalDepositAmount > contract's ETH balance.
   * E.g., if all depositors want to withdraw while no borrowers paid their loan back, then the bank contract
   * should still be able to pay.
  */
  uint public totalDepositAmount;

  // Represents an investor record
  struct Investor {
    bool hasActiveDeposit;
    uint amount;
    uint startTime;
  }

  // Address to investor mapping
  mapping (address => Investor) public investors;

  // Getter for investor
  function getInvestor(address addr) public view returns (bool, uint, uint) {
    // TODO
  }

  // Represents a borrower record
  struct Borrower {
    bool hasActiveLoan;
    uint amount;
    uint collateral;
  }

  // Address to borrower mapping
  mapping (address => Borrower) public borrowers;

  // Getter for borrower
  function getBorrower(address addr) public view returns (bool, uint, uint) {
    // TODO
  }

 /**
  * @dev Checks whether the yearlyReturnRate value is between 1 and 100
  */
  modifier validRate (uint _rate) {
    // TODO
    _;
  }

  /**
  * @dev Initializes the bbseTokenContract with the provided contract address.
  * Sets the yearly return rate for the bank.
  * Yearly return rate must be between 1 and 100.
  * Calculates and sets the interest earned per second for a minumum deposit amount
  * based on the yearly return rate.
  * @param _bbseTokenContract address of the deployed BBSEToken contract
  * @param _yearlyReturnRate yearly return rate of the bank
  * @param _oracleContract address of the deployed ETHBBSEPriceFeedOracle contract
  */
  constructor (address _bbseTokenContract, uint32 _yearlyReturnRate, address _oracleContract) validRate(_yearlyReturnRate) {
    // TODO
  }

  /**
  * @dev Initializes the respective investor object in investors mapping for the caller of the function.
  * Sets the amount to message value and starts the deposit time (hint: use block number as the start time).
  * Minimum deposit amount is 1 Ether (be careful about decimals!)
  * Investor can't have an already active deposit.
  */
  function deposit() payable public {
    // TODO
  }

  /**
  * @dev Calculates the interest to be paid out based
  * on the deposit amount and duration.
  * Transfers back the deposited amount in Ether.
  * Mints BBSE tokens to investor to pay the interest (1 token = 1 interest).
  * Resets the respective investor object in investors mapping.
  * Investor must have an active deposit.
  */
  function withdraw() public {
    // TODO
  }

  /**
  * @dev Updates the value of the yearly return rate.
  * Only callable by the owner of the BBSEBank contract.
  * @param _yearlyReturnRate new yearly return rate
  */
  function updateYearlyReturnRate(uint32 _yearlyReturnRate) public onlyOwner validRate (_yearlyReturnRate){
    // TODO
  }

  /**
  * @dev Collateralize BBSE Token to borrow ETH.
  * A borrower can't have more than one active loan.
  * ETH amount to be borrowed + totalDepositAmount, must be existing in the contract balance.
  * @param amount the amount of ETH loan request (expressed in Wei)
  */
  function borrow(uint amount) public {
    // TODO
  }

  /** 
  * @dev Pays the borrowed loan.
  * Borrower receives back the collateral - fee BBSE tokens.
  * Borrower must have an active loan.
  * Borrower must send the exact ETH amount borrowed.
  */  
  function payLoan() public payable {
    // TODO
  }

  /** 
  * @dev Called every time Ether is sent to the contract.
  * Required to fund the contract.
  */  
  receive() external payable {}
}
