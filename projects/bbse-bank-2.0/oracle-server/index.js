import fetch from "node-fetch";
import Web3 from "web3";
import ETHBBSEPriceFeedOracle from "../build/contracts/ETHBBSEPriceFeedOracle.json";
import dotenv from "dotenv";
dotenv.config();

// Use the local Ganache node to connect to the blockchain
const web3 = new Web3("ws://localhost:7545");
const netId = await web3.eth.net.getId();
const accounts = await web3.eth.getAccounts();
const deployer = accounts[0];
// Initialize the contract object
const oracleContract = new web3.eth.Contract(
  ETHBBSEPriceFeedOracle.abi, // Contract ABI
  ETHBBSEPriceFeedOracle.networks[netId].address // Contract address
);

// Fetches the latest rate from http://rest.coinapi.io for BASE and QUOTE
const getLatestPrice = async () => {
  let ref = `${process.env.API_HOST}/v1/exchangerate/${process.env.BASE}/${process.env.QUOTE}`;
  let res = await fetch(ref, {
    method: "GET", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "X-CoinAPI-Key": process.env.API_KEY,
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });

  const data = await res.json();

  return data;
};

// Listens to the GetNewRate events starting from block 0
oracleContract?.events
  ?.GetNewRate({ fromBlock: 0 }, (err, event) => {
    if (err) {
      console.log(err);
    }
  })
  .on("data", async () => {
    const res = await getLatestPrice();
    console.log(res);
    // Calls updateRate method on the oracle contract
    await oracleContract.methods
      .updateRate(
        Math.round(res.rate) // Round float to an int (for simplicity, let's neglect decimal points)
      )
      .send({ from: deployer }); // The updateRate method can only be called by the deployed of the oracle contract (which is accounts[0] with Ganache)
  })
  .on("error", (log) => {
    console.log("err " + log);
  });
