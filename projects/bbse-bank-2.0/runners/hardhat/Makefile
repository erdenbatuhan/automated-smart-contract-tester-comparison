-include .env

all : clean setup compile runTests

# Clean
clean :; npm i && npx hardhat clean && rm -rf node_modules cache

# Setup
setup :; npm i

# Compile
compile :; gtime npx hardhat compile

# Test
runTests :; gtime npx hardhat test
