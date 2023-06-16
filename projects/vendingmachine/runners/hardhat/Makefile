-include .env

all : clean setup compile runTests

# Clean
clean :; npm i && npx hardhat clean && rm -rf node_modules cache contracts

# Setup
setup :; npm i && ln -s ../../contracts contracts

# Compile
compile :; gtime npx hardhat compile

# Test
runTests :; gtime npx hardhat test
