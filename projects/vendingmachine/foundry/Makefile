-include .env

all: clean remove install update build

# Clean the repo
clean :; forge clean

# Remove the modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "remove modules"

# Install the modules
install :; 
	forge install foundry-rs/forge-std
	forge install dapphub/ds-test

# Update the dependencies
update :; forge update

# Build
build :; forgge clean && forge build --optimize --optimize-runs 1000000

# Test
test :; forge test -vv
