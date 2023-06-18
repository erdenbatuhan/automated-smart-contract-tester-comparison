const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BBSEBank", () => {
  const YEARLY_RETURN_RATE = 10;
  const INVALID_YEARLY_RETURN_RATE = 1000;

  const ORACLE_RATE = 33;
  const COLLATERALIZATION_RATIO = 150;

  let bbseToken, oracle, bbseBank;
  let accounts;

  // A helper function to set the scene for borrowing
  const setTheScene = async () => {
    // Borrower needs to have some BBSE tokens that she/he can give as collateral
    // Keep in mind that the value of the collateral should be > requested Ether * collateralization ratio
    // To earn BBSE tokens, let's do a deposit (1 ETH) from the borrower's account first
    // Dummy transactions to increase the block number, such that more interest is paid to the depositor
    for (let i = 1; i <= 4; i++) {
      await bbseBank.connect(accounts[i]).deposit({ value: ethers.parseEther("1") });
    }

    // Withdraw the deposit to earn BBSE tokens (approx. 0.12 BBSE tokens)
    await bbseBank.connect(accounts[1]).withdraw();

    // BBSEBank should be able to transfer BBSE tokens from the borrower to its own account
    // Thus, borrower should first call approve on BBSEToken contract and set the allowance
    await bbseToken.connect(accounts[1]).approve(
      bbseBank.target,
      ethers.parseEther("0.05")
    );

    // Since BBSEBank needs to have some Ether in it to lend out,
    // let's just transfer some from an unused account
    const transaction = await accounts[9].sendTransaction({
      to: bbseBank.target,
      value: ethers.parseEther("10"),
    });
    
    // Wait for the transaction to be mined
    await transaction.wait();

    // Update the ETHBBSEPriceFeedOracle rate (normally done by the oracle server)
    // Since we are using AAVE (instead of BBSE as ETH/BBSE doesn't exist),
    // let's use an approximate rate for ETH/AAVE as our rate
    await oracle.updateRate(ORACLE_RATE);
  };

  // A helper function to calculate the collateral
  const calculateCollateral = (amount) => (amount * COLLATERALIZATION_RATIO * ORACLE_RATE) / 100;

  /** 
   * A new instance of BBSEToken, ETHBBSEPriceFeedOracle, and BBSEBank contracts are set before each test case.
   * The minter role is initially passed to BBSEBank such that it can mint tokens
   * when paying out the interests.
   */
  beforeEach(async () => {
    // Deploy the contracts
    bbseToken = await ethers.getContractFactory("BBSEToken")
      .then(BBSEToken => BBSEToken.deploy());
    oracle = await ethers.getContractFactory("ETHBBSEPriceFeedOracle")
      .then(ETHBBSEPriceFeedOracle => ETHBBSEPriceFeedOracle.deploy());
    bbseBank = await ethers.getContractFactory("BBSEBank")
      .then(BBSEBank => BBSEBank.deploy(bbseToken.target, YEARLY_RETURN_RATE, oracle.target)); // Sets the yearly return rate

    // Get the accounts
    accounts = await ethers.getSigners();

    // Pass minter role to owner
    await bbseToken.connect(accounts[0]).passMinterRole(bbseBank.target);
  });

  // Success scenarios
  describe("success", () => {
    it("should set the yearly return rate correctly", async () => {
      const yearlyReturnRate = await bbseBank.yearlyReturnRate();
      expect(yearlyReturnRate).to.equal(YEARLY_RETURN_RATE, `The yearly return rate should be equal to ${YEARLY_RETURN_RATE}`);
    });

    it("should update the yearly return rate correctly", async () => {
      const newYearlyReturnRate = 15;

      await bbseBank.updateYearlyReturnRate(newYearlyReturnRate);
      const yearlyReturnRate = await bbseBank.yearlyReturnRate();

      expect(yearlyReturnRate).to.equal(newYearlyReturnRate, `The yearly return rate should be updated to ${newYearlyReturnRate}`);
    });

    it("should deposit correctly", async () => {
      await bbseBank.connect(accounts[1]).deposit({ value: ethers.parseEther("1") });

      const investor = await bbseBank.investors(accounts[1]);

      expect(investor.hasActiveDeposit).to.equal(true, `The investor should have active deposit`);
      expect(investor.amount).to.equal(ethers.parseEther("1"), `The investor should have the ethers`);
      expect(investor.startTime).to.be.above(0, "The investor start time should be greater than 0");

      expect(await ethers.provider.getBalance(bbseBank.target)).to.be.above(0, "The contract should have a positive Ether balance");
      expect(await bbseBank.totalDepositAmount()).to.be.above(0, "The total deposit amount should be greater than 0");
    });

    it("should withdraw correctly", async () => {
      // Deposit 1 Ether from account1 and account2
      const depositAmount = ethers.parseEther("1");
      await bbseBank.connect(accounts[1]).deposit({ value: depositAmount });
      await bbseBank.connect(accounts[2]).deposit({ value: depositAmount });

      // Get the old Ether balance of account1
      const oldEthBalance = await ethers.provider.getBalance(accounts[1].address);

      // Withdraw from account1
      await bbseBank.connect(accounts[1]).withdraw();
  
      // Assert the new Ether balance is higher than the old balance
      const newEthBalance = await ethers.provider.getBalance(accounts[1].address);
      expect(newEthBalance).to.be.above(oldEthBalance, "The new Ether balance should be higher");

      // Check the token balance of account1
      const tokenBalance = await bbseToken.balanceOf(accounts[1].address);
      expect(tokenBalance).to.be.above(0, "The token balance of account1 should be greater than 0");

      // Check the investor details of account1
      const investor = await bbseBank.investors(accounts[1].address);
      expect(investor.hasActiveDeposit).to.equal(false, "account1 should not have an active deposit");
      expect(investor.amount).to.equal(0, "account1's deposit amount should be 0");

      // Check the remaining Ether balance and the total deposit amount in the contract (Only the deposited amount by accounts[2] should be left in the contract balance)
      const contractEthBalance = await ethers.provider.getBalance(bbseBank.target);
      const totalDepositAmount = await bbseBank.totalDepositAmount();
      expect(contractEthBalance).to.equal(depositAmount, "The remaining Ether balance in the contract should be equal to the deposit amount");
      expect(totalDepositAmount).to.equal(depositAmount, "The total deposit amount in the contract should be equal to the deposit amount");
    });

    it("should borrow correctly", async () => {
      // Set the scene (initialize token balances and allowances)
      await setTheScene();
  
      // Get the initial balances and allowances
      const borrowerOldTokenBalance = await bbseToken.balanceOf(accounts[1].address);
      const borrowerOldEthBalance = await ethers.provider.getBalance(accounts[1].address);
      const bankOldEthBalance = await ethers.provider.getBalance(bbseBank.target);
      const bankOldTokenBalance = await bbseToken.balanceOf(bbseBank.target);
  
      // Borrows 0.001 Ether while collateralizing (0.001 * colleteralization_ratio * rate) BBSE tokens == 0.0495 BBSE tokens
      // Note: We have allowed for BBSEBank to transfer 0.05 BBSE tokens from borrower to itself,
      // while the collateral value is 0.0495 BBSE tokens. Ideally, you should only allow the required amount.
      const amountBorrowed = ethers.parseEther("0.001");
      await bbseBank.connect(accounts[1]).borrow(amountBorrowed);
  
      // Check borrower's loan details
      const borrower = await bbseBank.borrowers(accounts[1].address);
      expect(borrower.hasActiveLoan).to.equal(true, "Borrower should have an active loan");
      expect(borrower.amount).to.equal(amountBorrowed, "Borrower's loan amount should be equal to the amount borrowed");
      expect(Number(borrower.collateral)).to.equal(calculateCollateral(Number(amountBorrowed)), "Borrower's collateral should be calculated correctly");
  
      // Check if borrower has more ETH than before and less BBSE tokens
      const borrowerNewEthBalance = await ethers.provider.getBalance(accounts[1].address);
      const borrowerNewTokenBalance = await bbseToken.balanceOf(accounts[1].address);
      expect(borrowerNewEthBalance).to.be.above(borrowerOldEthBalance, "Borrower's Ether balance should have increased");
      expect(borrowerOldTokenBalance).to.be.above(borrowerNewTokenBalance, "Borrower's token balance should have decreased");
  
      // Check if BBSEBank has more BBSE tokens than before and less ETH
      const bankNewEthBalance = await ethers.provider.getBalance(bbseBank.target);
      const bankNewTokenBalance = await bbseToken.balanceOf(bbseBank.target);
      expect(bankOldEthBalance).to.be.above(bankNewEthBalance, "BBSEBank's Ether balance should have decreased");
      expect(bankNewTokenBalance).to.be.above(bankOldTokenBalance, "BBSEBank's token balance should have increased");
    });

    it("should pay loan correctly", async () => {
      // Set the scene (initialize token balances and allowances)
      await setTheScene();

      // Get the initial token balance of the bank before the borrowing
      const bankTokenBalanceBeforeBorrowing = await bbseToken.balanceOf(bbseBank.target);

      // Borrow some Ether
      const amountBorrowed = ethers.parseEther("0.001");
      await bbseBank.connect(accounts[1]).borrow(amountBorrowed);
    
      // Get the initial balances and allowances
      const borrowerOldTokenBalance = await bbseToken.balanceOf(accounts[1].address);
      const borrowerOldEthBalance = await ethers.provider.getBalance(accounts[1].address);
      const bankOldEthBalance = await ethers.provider.getBalance(bbseBank.target);
      const bankOldTokenBalance = await bbseToken.balanceOf(bbseBank.target);
    
      // Paying back the loan
      await bbseBank.connect(accounts[1]).payLoan({ value: amountBorrowed });
    
      // Check borrower's loan details
      const borrower = await bbseBank.borrowers(accounts[1].address);
      expect(borrower.hasActiveLoan).to.equal(false, "Borrower should not have an active loan");
      expect(borrower.amount).to.equal(0, "Borrower's loan amount should be 0");
      expect(borrower.collateral).to.equal(0, "Borrower's collateral should be 0");
    
      // Checks if borrower has more BBSE tokens than before and less ETH
      const borrowerNewEthBalance = await ethers.provider.getBalance(accounts[1].address);
      const borrowerNewTokenBalance = await bbseToken.balanceOf(accounts[1].address);
      expect(borrowerOldEthBalance).to.be.above(borrowerNewEthBalance, "Borrower's Ether balance should have decreased");
      expect(borrowerNewTokenBalance).to.be.above(borrowerOldTokenBalance, "Borrower's token balance should have increased");
    
      // Checks if BBSEBank has more ETH than before and less BBSE tokens
      const bankNewEthBalance = await ethers.provider.getBalance(bbseBank.target);
      const bankNewTokenBalance = await bbseToken.balanceOf(bbseBank.target);
      expect(bankNewEthBalance).to.be.above(bankOldEthBalance, "BBSEBank's Ether balance should have increased");
      expect(bankOldTokenBalance).to.be.above(bankNewTokenBalance, "BBSEBank's token balance should have decreased");
    
      // New token balance of the bank should be greater than initial balance since a fee is taken from the borrower
      expect(bankNewTokenBalance).to.be.above(bankTokenBalanceBeforeBorrowing, "BBSEBank's token balance should have increased");
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject invalid yearly return rate", async () => {
      await ethers.getContractFactory("BBSEBank").then(async (BBSEBank) => {
        // Try to deploy the bank contract with an invalid yearly return rate
        await expect(BBSEBank.deploy(bbseToken.target, INVALID_YEARLY_RETURN_RATE, oracle.target)).to.be.revertedWith(
          "Yearly return rate must be between 1 and 100"
        );
      });
    });

    it("should reject non-owner to update the yearly return rate", async () => {
      // Try to update the yearly return rate with a non-owner account
      await expect(bbseBank.connect(accounts[1]).updateYearlyReturnRate(99)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should reject invalid deposit amount", async () => {
      // Try to deposit less than the minimum deposit amount, which is 1 ETH
      await expect(bbseBank.connect(accounts[1]).deposit({ value: ethers.parseEther("0.999") })).to.be.revertedWith(
        "Minimum deposit amount is 1 Ether"
      );
    });

    it("should reject borrowing when BBSEBank don't have enough Ether", async () => {
      // Try to borrow some ETH when the bank is empty
      await expect(bbseBank.connect(accounts[1]).borrow(ethers.parseEther("1"))).to.be.revertedWith(
        "The bank can't lend this amount right now"
      );
    });

    it("should reject paying the loan when amount paid is not matching the loan amount", async () => {
      // Set the scene (initialize token balances and allowances)
      await setTheScene();

      // Borrow some ETH
      await bbseBank.connect(accounts[1]).borrow(ethers.parseEther("0.001"));

      // Then try to pay the loan with less than the borrowed ETH
      await expect(bbseBank.connect(accounts[1]).payLoan({ value: ethers.parseEther("0.0001") })).to.be.revertedWith(
        "The paid amount must match the borrowed amount"
      );
    });

    it("should reject account having multiple active deposit", async () => {
      // Deposit some ETH with an account
      await bbseBank.connect(accounts[1]).deposit({ value: ethers.parseEther("1") });

      // Then try to deposit again with the same account while the first deposit is still active
      await expect(bbseBank.connect(accounts[1]).deposit({ value: ethers.parseEther("1") })).to.be.revertedWith(
        "Account can't have multiple active deposits"
      );
    });

    it("should reject withdraw with no active deposit", async () => {
      // Try to withdraw when there is no active deposit
      await expect(bbseBank.connect(accounts[1]).withdraw()).to.be.revertedWith(
        "Account must have an active deposit to withdraw"
      );
    });

    it("should reject account having multiple active loans", async () => {
      // Set the scene (initialize token balances and allowances)
      await setTheScene();

      // Borrow some ETH
      await bbseBank.connect(accounts[1]).borrow(ethers.parseEther("0.001"));

      // Then try to borrow some more
      await expect(bbseBank.connect(accounts[1]).borrow(ethers.parseEther("0.001"))).to.be.revertedWith(
        "Account can't have multiple active loans"
      );
    });

    it("should reject pay loan with no active loan", async () => {
      // Try to pay loan when there is none
      await expect(bbseBank.connect(accounts[1]).payLoan()).to.be.revertedWith(
        "Account must have an active loan to pay back"
      );
    });
  });
});
