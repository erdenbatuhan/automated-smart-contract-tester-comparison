-include .env

all : clean setup compile runTests

# Clean
clean :; rm -rf node_modules

# Setup
setup :; npm i

# Compile
compile :; time truffle compile

# Test
runTests :; time truffle test
