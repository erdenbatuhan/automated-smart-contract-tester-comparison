const BBSEToken = artifacts.require("BBSEToken");
const BBSEBank = artifacts.require("BBSEBank");
const ETHBBSEPriceFeedOracle = artifacts.require("ETHBBSEPriceFeedOracle");

contract("BBSEBank", (accounts) => {
  let bbseToken, bbseBank, oracle;

  // Sets the scene for borrowing
  const setTheScene = async () => {
    // Borrower needs to have some BBSE tokens that she/he can give as a collateral
    // Keep in mind that the value of the collateral should be > requested Ether * colletaralization ratio
    // To earn BBSE tokens, let's do a deposit (1 ETH) from the borrower's account first
    await bbseBank.deposit({ value: 10 ** 18, from: accounts[1] });
    // Dummy transactions to increase the block number, such that more interest is paid to the depositor
    await bbseBank.deposit({ value: 10 ** 18, from: accounts[2] });
    await bbseBank.deposit({ value: 10 ** 18, from: accounts[3] });
    await bbseBank.deposit({ value: 10 ** 18, from: accounts[4] });
    // Withdraw the deposit to earn BBSE tokens (approx. 0.12 BBSE tokens)
    await bbseBank.withdraw({ from: accounts[1] });

    // BBSEBank should be able to transfer BBSE tokens from the borrower to its own account
    // Thus, borrower should first call approve on BBSEToken contract and set the allowance
    await bbseToken.approve(
      bbseBank.address,
      web3.utils.toWei("0.05", "ether"), // ERC20 tokens are also represented with 18 decimals
      {
        from: accounts[1],
      }
    );

    // Since BBSEBank needs to have some Ether in it to lend out,
    // let's just transfer some from an unused account
    await web3.eth.sendTransaction({
      from: accounts[9],
      to: bbseBank.address,
      value: web3.utils.toWei("10", "ether"),
    });

    // Update the ETHBBSEPriceFeedOracle rate (normally done by the oracle server)
    // Since we are using AAVE (instead of BBSE as ETH/BBSE doesn't exists),
    // let's use an approximate rate for ETH/AAVE as our rate
    await oracle.updateRate(33, { from: accounts[0] });
  };

  // Success scenarios
  describe("success", () => {
    /* A new instance of BBSEToken, ETHBBSEPriceFeedOracle, and BBSEBank contracts are set before each test case.
     * The minter role is initially passed to BBSEBank such that it can mint tokens
     * when paying out the interests.
     */
    beforeEach(async () => {
      bbseToken = await BBSEToken.new();
      oracle = await ETHBBSEPriceFeedOracle.new();
      bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address); // Sets the yearly return rate to 10
      await bbseToken.passMinterRole(bbseBank.address, { from: accounts[0] });
    });

    it("should set the yearly return rate correctly", async () => {
      assert.equal(await bbseBank.yearlyReturnRate(), 10);
    });

    it("should update the yearly return rate correctly", async () => {
      await bbseBank.updateYearlyReturnRate(15, {
        from: accounts[0],
      });
      assert.equal(await bbseBank.yearlyReturnRate(), 15);
    });

    it("should deposit correctly", async () => {
      await bbseBank.deposit({ value: 10 ** 18, from: accounts[1] }); // Decimal is set to 18 by default in ERC20 OpenZeppelin (Unit = Wei)
      const investor = await bbseBank.investors(accounts[1]);
      assert.equal(investor.hasActiveDeposit, true);
      assert.equal(Number(investor.amount), 10 ** 18); // Since the amount is a big number (BN), it is better be cast to a Number for convenience
      expect(Number(investor.startTime)).to.be.above(0);
      expect(Number(await web3.eth.getBalance(bbseBank.address))).to.be.above(
        0
      ); // Use web3 to find the Ether balance of any account
      expect(Number(await bbseBank.totalDepositAmount())).to.be.above(0);
    });

    it("should withdraw correctly", async () => {
      await bbseBank.deposit({ value: 10 ** 18, from: accounts[1] });
      await bbseBank.deposit({ value: 10 ** 18, from: accounts[2] });

      const oldEthBalance = Number(await web3.eth.getBalance(accounts[1]));
      await bbseBank.withdraw({
        from: accounts[1],
      });
      const newEthBalance = Number(await web3.eth.getBalance(accounts[1]));
      expect(Number(newEthBalance)).to.be.above(oldEthBalance);

      const tokenBalance = Number(await bbseToken.balanceOf(accounts[1]));
      expect(tokenBalance).to.be.above(0);

      const investor = await bbseBank.investors(accounts[1]);
      assert.equal(investor.hasActiveDeposit, false);
      assert.equal(investor.amount, 0);

      // Only the deposited amount by accounts[2] should be left in the contract balance
      assert.equal(
        Number(await web3.eth.getBalance(bbseBank.address)),
        10 ** 18
      );
      assert.equal(Number(await bbseBank.totalDepositAmount()), 10 ** 18);
    });

    it("should borrow correctly", async () => {
      await setTheScene();

      const borrowerOldTokenBalance = Number(
        await bbseToken.balanceOf(accounts[1])
      );
      const borrowerOldEthBalance = Number(
        await web3.eth.getBalance(accounts[1])
      );
      const bankOldEthBalance = Number(
        await web3.eth.getBalance(bbseBank.address)
      );
      const bankOldTokenBalance = Number(
        await bbseToken.balanceOf(bbseBank.address)
      );

      // Borrows 0.001 Ether while collateralizing (0.001 * colleteralization_ratio * rate) BBSE tokens == 0.0495 BBSE tokens
      // Remember that ERC20 tokens also have 18 decimals. Thus, 0.0495 BBSE tokens == 0.0495 * 10**18 units
      // Note: We have allowed for BBSEBank to transfer 0.05 BBSE tokens from borrower to itself,
      // while the collateral value is 0.0495 BBSE tokens. Ideally, you should only allow the required amount.
      await bbseBank.borrow(web3.utils.toWei("0.001", "ether"), {
        from: accounts[1], // Borrower = accounts[1]
      });

      const borrower = await bbseBank.borrowers(accounts[1]);
      assert.equal(borrower.hasActiveLoan, true);
      assert.equal(Number(borrower.amount), web3.utils.toWei("0.001", "ether"));
      assert.equal(
        Number(borrower.collateral),
        ((web3.utils.toWei("0.001", "ether") * 150) / 100) * 33
      );

      // Checks if borrower has more ETH than before and less BBSE tokens
      const borrowerNewTokenBalance = Number(
        await bbseToken.balanceOf(accounts[1])
      );
      const borrowerNewEthBalance = Number(
        await web3.eth.getBalance(accounts[1])
      );

      expect(borrowerNewEthBalance).to.be.above(borrowerOldEthBalance);
      expect(borrowerOldTokenBalance).to.be.above(borrowerNewTokenBalance);

      // Checks if BBSEBank has more BBSE tokens than before and less ETH
      const bankNewEthBalance = Number(
        await web3.eth.getBalance(bbseBank.address)
      );
      const bankNewTokenBalance = Number(
        await bbseToken.balanceOf(bbseBank.address)
      );

      expect(bankOldEthBalance).to.be.above(bankNewEthBalance);
      expect(bankNewTokenBalance).to.be.above(bankOldTokenBalance);
    });

    it("should pay loan correctly", async () => {
      await setTheScene();

      const bankInitialTokenBalance = Number(
        await bbseToken.balanceOf(bbseBank.address)
      );

      await bbseBank.borrow(web3.utils.toWei("0.001", "ether"), {
        from: accounts[1], // Borrower = accounts[1]
      });

      const borrowerOldTokenBalance = Number(
        await bbseToken.balanceOf(accounts[1])
      );
      const borrowerOldEthBalance = Number(
        await web3.eth.getBalance(accounts[1])
      );
      const bankOldEthBalance = Number(
        await web3.eth.getBalance(bbseBank.address)
      );
      const bankOldTokenBalance = Number(
        await bbseToken.balanceOf(bbseBank.address)
      );

      // Paying back the loan
      await bbseBank.payLoan({
        from: accounts[1],
        value: web3.utils.toWei("0.001", "ether"),
      });

      const borrower = await bbseBank.borrowers(accounts[1]);
      assert.equal(borrower.hasActiveLoan, false);
      assert.equal(Number(borrower.amount), 0);
      assert.equal(Number(borrower.collateral), 0);

      // Checks if borrower has more BBSE tokens than before and less ETH
      const borrowerNewTokenBalance = Number(
        await bbseToken.balanceOf(accounts[1])
      );
      const borrowerNewEthBalance = Number(
        await web3.eth.getBalance(accounts[1])
      );

      expect(borrowerOldEthBalance).to.be.above(borrowerNewEthBalance);
      expect(borrowerNewTokenBalance).to.be.above(borrowerOldTokenBalance);

      // Checks if BBSEBank has more ETH than before and less BBSE tokens
      const bankNewEthBalance = Number(
        await web3.eth.getBalance(bbseBank.address)
      );
      const bankNewTokenBalance = Number(
        await bbseToken.balanceOf(bbseBank.address)
      );

      expect(bankNewEthBalance).to.be.above(bankOldEthBalance);
      expect(bankOldTokenBalance).to.be.above(bankNewTokenBalance);

      // New token balance of the bank should be greater than initial balance
      // since a fee is taken from the borrower
      expect(bankNewTokenBalance).to.be.above(bankInitialTokenBalance);
    });
  });

  // Failure scenarios
  describe("failure", () => {
    it("should reject invalid yearly return rate", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 1000, oracle.address);
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Yearly return rate must be between 1 and 100"); // Use this error message in your BBSEBank constructor
    });

    it("should reject non-owner to update the yearly return rate", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseBank.updateYearlyReturnRate(15, {
          from: accounts[1],
        });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Ownable: caller is not the owner"); // Thrown by the Ownable contract
    });

    it("should reject invalid deposit amount", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseBank.deposit({ value: 10 ** 17, from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Minimum deposit amount is 1 Ether"); // Use this error message in your deposit function
    });

    it("should reject borrowing when BBSEBank don't have enough Ether", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseToken.passMinterRole(bbseBank.address, { from: accounts[0] });

        await bbseBank.borrow(web3.utils.toWei("1", "ether"), {
          from: accounts[1],
        });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "The bank can't lend this amount right now"); // Use this error message in your borrow function
    });

    it("should reject paying the loan when amount paid is not matching the loan amount", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseToken.passMinterRole(bbseBank.address, { from: accounts[0] });

        // Setting up the scene
        await setTheScene();

        await bbseBank.borrow(web3.utils.toWei("0.001", "ether"), {
          from: accounts[1],
        });
        await bbseBank.payLoan({
          from: accounts[1],
          value: web3.utils.toWei("0.0001", "ether"),
        });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(
        err.reason,
        "The paid amount must match the borrowed amount"
      ); // Use this error message in your payLoan function
    });

    it("should reject account having multiple active deposit", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseBank.deposit({ value: 10 ** 18, from: accounts[1] });
        await bbseBank.deposit({ value: 10 ** 18, from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Account can't have multiple active deposits"); // Use this error message in your deposit function
    });

    it("should reject withdraw with no active deposit", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseBank.withdraw({ from: accounts[1] });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(
        err.reason,
        "Account must have an active deposit to withdraw" // Use this error message in your withdraw function
      );
    });

    it("should reject account having multiple active loans", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseToken.passMinterRole(bbseBank.address, { from: accounts[0] });

        // Setting up the scene
        await setTheScene();

        await bbseBank.borrow(web3.utils.toWei("0.001", "ether"), {
          from: accounts[1],
        });
        await bbseBank.borrow(web3.utils.toWei("0.001", "ether"), {
          from: accounts[1],
        });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Account can't have multiple active loans"); // Use this error message in your borrow function
    });

    it("should reject pay loan with no active loan", async () => {
      let err;
      try {
        bbseToken = await BBSEToken.new();
        oracle = await ETHBBSEPriceFeedOracle.new();
        bbseBank = await BBSEBank.new(bbseToken.address, 10, oracle.address);
        await bbseToken.passMinterRole(bbseBank.address, { from: accounts[0] });

        await bbseBank.payLoan({
          from: accounts[1],
        });
      } catch (e) {
        err = e;
      }
      assert.notEqual(err, undefined, "Error must be thrown");
      assert.equal(err.reason, "Account must have an active loan to pay back"); // Use this error message in your payLoan function
    });
  });
});
