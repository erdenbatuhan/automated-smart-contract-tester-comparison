const fs = require("fs");
const path = require("path");

const deployContract = async (filename) => {
  // Get the contract name from the file name
  const contractName = filename.replace(".sol", "");

  // Compile the contract
  const compiledContract = await hre.artifacts.readArtifact(contractName);

  // Deploy the contract
  console.log(`Deploying ${contractName}...`);
  const contract = await ethers.getContractFactory(compiledContract.abi, compiledContract.bytecode)
    .connect(deployer)
    .deploy();

  // Wait for the contract to be deployed
  await contract.deployed();

  // Print the contract address
  console.log(`${contractName} deployed to:`, contract.address);
  return contract.address;
}

const deployAllContracts = async () => {
  // Get the ContractFactory and Signers from the Hardhat Runtime
  const [deployer] = await ethers.getSigners();

  // Read all contract files in the directory
  const contractsDirectory = path.join(__dirname, "..", "contracts");
  const contractFiles = fs.readdirSync(contractsDirectory);

  await Promise.all([
    contractFiles
      .filter(filename => filename.endsWith(".sol"))
      .forEach(filename => deployContract(deployer, filename))
  ]);
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
