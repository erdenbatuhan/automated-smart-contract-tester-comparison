const VendingMachine = artifacts.require("VendingMachine")

module.exports = (deployer) => {
  deployer.deploy(VendingMachine)
}
