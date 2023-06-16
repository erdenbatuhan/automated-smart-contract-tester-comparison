-include .env

all : clean setup compile runTests

# Clean
clean :; rm -rf build

# Compile
compile :; gtime truffle compile

# Test
runTests :; gtime truffle test
