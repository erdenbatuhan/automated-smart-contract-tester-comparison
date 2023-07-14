-include .env

all : clean setup compile runTests

# Clean
clean :; rm -rf build

# Compile
compile :; time truffle compile

# Test
runTests :; time truffle test
