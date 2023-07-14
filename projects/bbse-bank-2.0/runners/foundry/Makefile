-include .env

all : clean install update build runTests

# Clean the repo
clean :; forge clean && rm -rf lib

# Install the modules
install :;
	forge install Openzeppelin/openzeppelin-contracts --no-commit

# Update the dependencies
update :; forge update

# Build
build :; forge clean && time forge build --optimize --optimizer-runs 1000000

# Test
runTests :; time forge test -vv
