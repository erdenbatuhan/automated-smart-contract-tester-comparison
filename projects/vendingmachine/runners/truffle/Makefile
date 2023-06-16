-include .env

all : clean setup compile runTests

# Clean
clean :; rm -rf build contracts

# Setup
setup :; ln -s ../../contracts contracts

# Compile
compile :; gtime truffle compile

# Test
runTests :; gtime truffle test
