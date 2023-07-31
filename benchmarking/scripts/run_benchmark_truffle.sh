# 0) Clean & Prepare
rm -rf build
mv contracts contracts_org

# 1) Force the pre-installation of the compiler and the pre-creation of "just" the dependencies
cp -R contracts_empty contracts
npx truffle compile
rm -rf contracts

# 2) Copy the contracts to the working directory
mv contracts_org contracts

# 3) Run the tests and measure the time
/usr/bin/time npx truffle test
