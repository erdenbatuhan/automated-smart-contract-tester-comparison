-include .env

all : clean setup install update build runTests

# Clean the repo
clean :; forge clean && rm -rf lib src

# Setup
setup :; cp -R ../../contracts/. src && touch src/.DO_NOT_EDIT_HERE

# Install the modules
install :;
	forge install foundry-rs/forge-std --no-commit

# Update the dependencies
update :; forge update

# Build
build : setup ; forge clean && gtime forge build --optimize --optimizer-runs 1000000

# Test
runTests : setup ; gtime forge test -vv
