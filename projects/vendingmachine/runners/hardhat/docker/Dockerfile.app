# Use the base image
FROM vendingmachine/hardhat/base

# Change the working directory
WORKDIR /app

# Copy the contracts to the working directory
COPY contracts contracts

# Run the tests by executing the shell script
CMD ["npx", "hardhat", "test"]
