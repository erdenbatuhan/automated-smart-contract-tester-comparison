const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const isSolidityFile = (filename) => filename.endsWith(".sol");

const deployContract = async (filename) => {
  // Get the contract name from the file name
  const contractName = filename.replace(".sol", "");

  // Compile the contract
  const compiledContract = await hre.artifacts.readArtifact(contractName);

  // Deploy the contract
  console.log(`Deploying ${contractName}...`);
  const contract = await hre.ethers.getContractFactory(compiledContract.abi, compiledContract.bytecode)
    .then(ContractFactory => ContractFactory.deploy());

  // Print the contract address
  console.log(`${contractName} deployed to:`, contract.target);
  return contract.target;
}

const deployAllContracts = async () => {
  // Read all contract files in the directory
  const contractsDirectory = path.join(__dirname, "..", "contracts");
  const contractFiles = fs.readdirSync(contractsDirectory);

  await Promise.all(contractFiles.filter(isSolidityFile).map(deployContract));
}

const main = async () => {
  // Run the deployment
  await deployAllContracts();
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
