// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extensions/ExtendedDSTest.sol";
import "src/ETHBBSEPriceFeedOracle.sol";
import "src/BBSEToken.sol";
import "src/BBSEBank.sol";

abstract contract BBSEBankTest is ExtendedDSTest {

  uint32 internal constant YEARLY_RETURN_RATE = 10;
  uint32 internal constant INVALID_YEARLY_RETURN_RATE = 1000;

  uint32 internal constant ORACLE_RATE = 33;
  uint32 internal constant COLLATERALIZATION_RATIO = 150;

  BBSEToken internal bbseToken;
  ETHBBSEPriceFeedOracle internal oracle;
  BBSEBank internal bbseBank;

  /** 
   * A new instance of BBSEToken, ETHBBSEPriceFeedOracle, and BBSEBank contracts are set before each test case.
   * The minter role is initially passed to BBSEBank such that it can mint tokens
   * when paying out the interests.
   */
  function setUp() public {
    bbseToken = new BBSEToken();
    oracle = new ETHBBSEPriceFeedOracle();
    bbseBank = new BBSEBank(address(bbseToken), YEARLY_RETURN_RATE, address(oracle));

    bbseToken.passMinterRole(address(bbseBank)); // The bank can mint tokens
  }

  function setTheScene() internal {
    // Borrower needs to have some BBSE tokens that she/he can give as collateral
    // Keep in mind that the value of the collateral should be > requested Ether * collateralization ratio
    // To earn BBSE tokens, let's do a deposit (1 ETH) from the borrower's account first
    // Dummy transactions to increase the block number, such that more interest is paid to the depositor
    uint160 numAccounts = 4;
    for (uint160 i = FIRST_ACC_ID; i <= FIRST_ACC_ID + numAccounts; i++) {
      depositToBank(address(i), 1 ether);
    }

    // Withdraw the deposit to earn BBSE tokens (approx. 0.12 BBSE tokens)
    withdrawFromBank(address(FIRST_ACC_ID)); // Withdraw

    // BBSEBank should be able to transfer BBSE tokens from the borrower to its own account
    // Thus, borrower should first call approve on BBSEToken contract and set the allowance
    vm.prank(address(FIRST_ACC_ID)); // Inject a change of user
    bbseToken.approve(address(bbseBank), 0.05 ether); // Approve

    // BBSEBank needs to have some Ether in it to lend out
    vm.deal(address(bbseBank), 10 ether); // Deal some Ether

    // Update the ETHBBSEPriceFeedOracle rate (normally done by the oracle server)
    // Since we are using AAVE (instead of BBSE as ETH/BBSE doesn't exist),
    // let's use an approximate rate for ETH/AAVE as our rate
    oracle.updateRate(ORACLE_RATE);
  }

  function depositToBank(address userAddr, uint256 amount) internal {
    vm.roll(block.number + 1); // Increment block number by 1 to simulate a real chain
    vm.prank(userAddr); // Inject a change of user
    vm.deal(userAddr, amount); // Deal Ether to that user

    bbseBank.deposit{value: amount}(); // Deposit
  }

  function withdrawFromBank(address userAddr) internal {
    vm.roll(block.number + 1); // Increment block number by 1 to simulate a real chain
    vm.prank(userAddr); // Inject a change of user

    bbseBank.withdraw(); // Withdraw
  }

  function borrowFromBank(address userAddr, uint256 amount) internal {
    vm.roll(block.number + 1); // Increment block number by 1 to simulate a real chain
    vm.prank(userAddr); // Inject a change of user

    bbseBank.borrow(amount); // Borrow
  }

  function payLoanToBank(address userAddr, uint256 amount) internal {
    vm.roll(block.number + 1); // Increment block number by 1 to simulate a real chain
    vm.prank(userAddr); // Inject a change of user

    bbseBank.payLoan{value: amount}(); // Pay loan
  }

  function calculateCollateral (uint256 amount) internal pure returns(uint256) {
    return amount * COLLATERALIZATION_RATIO * ORACLE_RATE / 100;
  }
}

contract BBSEBankTest_SuccessScenarios is BBSEBankTest {

  // should set the yearly return rate correctly
  function test_1_SucceedIf_YearlyReturnRateIsSetCorrectly() public {
    assertEq(bbseBank.yearlyReturnRate(), YEARLY_RETURN_RATE, "The yearly return rate is not set correctly");
  }

  // should update the yearly return rate correctly
  function test_2_SucceedIf_YearlyReturnRateIsUpdatedCorrectly() public {
    bbseBank.updateYearlyReturnRate(15); // Update the yearly return rate
    assertEq(bbseBank.yearlyReturnRate(), 15, "The yearly return rate should have been updated correctly");
  }

  // should deposit correctly
  function test_3_SucceedIf_DepositSucceeds() public {
    uint256 depositAmount = 1 ether;
    depositToBank(address(FIRST_ACC_ID), depositAmount); // Deposit Ether to bank using an account

    // Check that the account has been correctly registered as an investor at the bank after the deposit
    (bool investorHasActiveDeposit, uint256 investorAmount, uint256 investorStartTime) = bbseBank.getInvestor(address(FIRST_ACC_ID));
    assertTrue(investorHasActiveDeposit, "The investor should have active deposit");
    assertEq(investorAmount, depositAmount, "The investor should have the ethers");
    assertGt(investorStartTime, 0, "The investor start time should be greater than 0");

    // Check if the balance of the bank has been updated correcly after the deposit
    assertEq(address(bbseBank).balance, depositAmount, "The contract should have the Ether deposited");
    assertEq(bbseBank.totalDepositAmount(), depositAmount, "The total deposit amount should be equal to the amount deposited");
  }

  // should withdraw correctly
  function test_4_SucceedIf_WithdrawalSucceeds() public {
    // Deposit Ether to bank using two accounts
    uint256 depositAmount = 1 ether;
    depositToBank(address(FIRST_ACC_ID), depositAmount); // the first account
    depositToBank(address(FIRST_ACC_ID + 1), depositAmount); // second account

    // Withdraw using the first acount
    uint256 oldEthBalance = address(FIRST_ACC_ID).balance; // Balance of the user before withdrawal
    withdrawFromBank(address(FIRST_ACC_ID));
    uint256 newEthBalance = address(FIRST_ACC_ID).balance; // Balance of the user after withdrawal
    assertGt(newEthBalance, oldEthBalance, "The new Ether balance of the first account should be higher");
    assertGt(bbseToken.balanceOf(address(FIRST_ACC_ID)), 0, "The first account should now have tokens");

    // Check the investor details of account1
    (bool investorHasActiveDeposit, uint256 investorAmount, ) = bbseBank.getInvestor(address(FIRST_ACC_ID));
    assertFalse(investorHasActiveDeposit, "The first account should not have an active deposit");
    assertEq(investorAmount, 0, "The first account's deposit amount should be 0");

    // Check the remaining Ether balance and the total deposit amount in the contract
    // "Only the deposited amount by the second account should be left in the contract balance"
    (uint256 contractEthBalance, uint256 totalDepositAmount) = (address(bbseBank).balance, bbseBank.totalDepositAmount());
    assertEq(contractEthBalance, depositAmount, "The remaining Ether balance in the contract should be equal to the deposit amount");
    assertEq(totalDepositAmount, depositAmount, "The total deposit amount in the contract should be equal to the deposit amount");
  }

  // should borrow correctly
  function test_5_SucceedIf_BorrowingSucceeds() public {
    // Set the scene (initialize token balances and allowances)
    setTheScene();

    // Get the initial balances and allowances
    uint256 borrowerOldTokenBalance = bbseToken.balanceOf(address(FIRST_ACC_ID));
    uint256 borrowerOldEthBalance = address(FIRST_ACC_ID).balance;
    uint256 bankOldEthBalance = address(bbseBank).balance;
    uint256 bankOldTokenBalance = bbseToken.balanceOf(address(bbseBank));
  
    // Borrows 0.001 Ether while collateralizing (0.001 * colleteralization_ratio * rate) BBSE tokens == 0.0495 BBSE tokens
    // Note: We have allowed for BBSEBank to transfer 0.05 BBSE tokens from borrower to itself,
    // while the collateral value is 0.0495 BBSE tokens. Ideally, you should only allow the required amount.
    uint256 amountBorrowed = 0.001 ether;
    borrowFromBank(address(FIRST_ACC_ID), amountBorrowed);
  
    // Check borrower's loan details
    (bool borrowerHasActiveLoan, uint256 borrowerAmount, uint256 borrowerCollateral) = bbseBank.getBorrower(address(FIRST_ACC_ID));
    assertTrue(borrowerHasActiveLoan, "Borrower should have an active loan");
    assertEq(borrowerAmount, amountBorrowed, "Borrower's loan amount should be equal to the amount borrowed");
    assertEq(borrowerCollateral, calculateCollateral(amountBorrowed), "Borrower's collateral should be calculated correctly");
  
    // Check if borrower has more ETH than before and less BBSE tokens
    uint256 borrowerNewEthBalance = address(FIRST_ACC_ID).balance;
    uint256 borrowerNewTokenBalance = bbseToken.balanceOf(address(FIRST_ACC_ID));
    assertLt(borrowerOldEthBalance, borrowerNewEthBalance, "Borrower's Ether balance should have increased");
    assertGt(borrowerOldTokenBalance, borrowerNewTokenBalance, "Borrower's token balance should have decreased");

    // Check if BBSEBank has more BBSE tokens than before and less ETH
    uint256 bankNewEthBalance = address(bbseBank).balance;
    uint256 bankNewTokenBalance = bbseToken.balanceOf(address(bbseBank));
    assertGt(bankOldEthBalance, bankNewEthBalance, "BBSEBank's Ether balance should have decreased");
    assertLt(bankOldTokenBalance, bankNewTokenBalance, "BBSEBank's token balance should have increased");
  }

  // should pay loan correctly
  function test_6_SucceedIf_PayingLoanSucceeds() public {
    // Set the scene (initialize token balances and allowances)
    setTheScene();

    // Get the initial token balance of the bank before the borrowing
    uint256 bankTokenBalanceBeforeBorrowing = bbseToken.balanceOf(address(bbseBank));

    // Borrow some Ether
    uint256 amountBorrowed = 0.001 ether;
    borrowFromBank(address(FIRST_ACC_ID), amountBorrowed);

    // Get the initial balances and allowances
    uint256 borrowerOldTokenBalance = bbseToken.balanceOf(address(FIRST_ACC_ID));
    uint256 borrowerOldEthBalance = address(FIRST_ACC_ID).balance;
    uint256 bankOldEthBalance = address(bbseBank).balance;
    uint256 bankOldTokenBalance = bbseToken.balanceOf(address(bbseBank));

    // Paying back the loan
    payLoanToBank(address(FIRST_ACC_ID), amountBorrowed);
  
    // Check borrower's loan details
    (bool borrowerHasActiveLoan, uint256 borrowerAmount, uint256 borrowerCollateral) = bbseBank.getBorrower(address(FIRST_ACC_ID));
    assertFalse(borrowerHasActiveLoan, "Borrower should not have an active loan");
    assertEq(borrowerAmount, 0, "Borrower's loan amount should be 0");
    assertEq(borrowerCollateral, 0, "Borrower's collateral should be 0");
  
    // Check if borrower has more ETH than before and less BBSE tokens
    uint256 borrowerNewEthBalance = address(FIRST_ACC_ID).balance;
    uint256 borrowerNewTokenBalance = bbseToken.balanceOf(address(FIRST_ACC_ID));
    assertGt(borrowerOldEthBalance, borrowerNewEthBalance, "Borrower's Ether balance should have decreased");
    assertLt(borrowerOldTokenBalance, borrowerNewTokenBalance, "Borrower's token balance should have increased");

    // Check if BBSEBank has more BBSE tokens than before and less ETH
    uint256 bankNewEthBalance = address(bbseBank).balance;
    uint256 bankNewTokenBalance = bbseToken.balanceOf(address(bbseBank));
    assertLt(bankOldEthBalance, bankNewEthBalance, "BBSEBank's Ether balance should have increased");
    assertGt(bankOldTokenBalance, bankNewTokenBalance, "BBSEBank's token balance should have decreased");

    // New token balance of the bank should be greater than initial balance since a fee is taken from the borrower
    assertLt(bankTokenBalanceBeforeBorrowing, bankNewTokenBalance, "BBSEBank's token balance should have increased");
  }
}

contract BBSEBankTest_FailureScenarios is BBSEBankTest {

  // should reject invalid yearly return rate
  function testFail_1_RevertWhen_YearlyReturnRateIsInvalid() public {
    // Try to deploy the bank contract with an invalid yearly return rate
    new BBSEBank(address(bbseToken), INVALID_YEARLY_RETURN_RATE, address(oracle)); 
  }

  // should reject non-owner to update the yearly return rate
  function testFail_2_RevertWhen_NonOwnerUpdatedYearlyReturnRate() public {
    // Try to update the yearly return rate with a non-owner account
    vm.prank(address(FIRST_ACC_ID)); // Inject a change of user
    bbseBank.updateYearlyReturnRate(YEARLY_RETURN_RATE);
  }

  // should reject invalid deposit amount
  function testFail_3_RevertWhen_DepositAmountProvidedIsInvalid() public {
    // Try to deposit less than the minimum deposit amount, which is 1 ETH
    depositToBank(address(FIRST_ACC_ID), 0.999 ether);
  }

  // should reject borrowing when BBSEBank don't have enough Ether
  function testFail_4_RevertWhen_BorrowingMoreEtherThanBankHas() public {
      // Try to borrow some ETH when the bank is empty
      borrowFromBank(address(FIRST_ACC_ID), 1 ether);
  }

  // should reject paying the loan when amount paid is not matching the loan amount
  function testFail_5_RevertWhen_PayingLoanWithInvalidLoanAmount() public {
    // Set the scene (initialize token balances and allowances)
    setTheScene();

    // Borrow some ETH
    borrowFromBank(address(FIRST_ACC_ID), 0.001 ether);

    // Then try to pay the loan with less than the borrowed ETH
    payLoanToBank(address(FIRST_ACC_ID), 0.0001 ether);
  }

  // should reject account having multiple active deposit
  function testFail_6_RevertWhen_ThereAreMultipleActiveDeposits() public {
    // Deposit some ETH with an account
    depositToBank(address(FIRST_ACC_ID), 1 ether);

    // Then try to deposit again with the same account while the first deposit is still active
    depositToBank(address(FIRST_ACC_ID), 1 ether);
  }

  // should reject withdraw with no active deposit
  function testFail_7_RevertWhen_WithdrawingWithNoActiveDeposit() public {
    // Try to withdraw when there is no active deposit
    withdrawFromBank(address(FIRST_ACC_ID));
  }

  // should reject account having multiple active loans
  function testFail_8_RevertWhen_ThereAreMultipleActiveLoans() public {
    // Set the scene (initialize token balances and allowances)
    setTheScene();

    // Borrow some ETH
    borrowFromBank(address(FIRST_ACC_ID), 0.001 ether);

      // Then try to borrow some more
    borrowFromBank(address(FIRST_ACC_ID), 0.001 ether);
  }

  // should reject pay loan with no active loan
  function testFail_9_RevertWhen_PayingLoanWithNoActiveLoan() public {
    // Try to pay loan when there is none
    payLoanToBank(address(FIRST_ACC_ID), 0.0001 ether);
  } 
}
