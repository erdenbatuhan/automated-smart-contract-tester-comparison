-include .env

all : clean setup install update build runTests

# Clean the repo
clean :; forge clean && rm -rf lib src

# Install the modules
install :;
	forge install foundry-rs/forge-std --no-commit

# Update the dependencies
update :; forge update

# Build
build : setup ; forge clean && time forge build --optimize --optimizer-runs 1000000

# Test
runTests : setup ; time forge test -vv
