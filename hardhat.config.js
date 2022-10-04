

require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

//const Private_Key = "ee91f26be937822b73a2cab041e1bf65d986b6639319ddb297a9a0cb61360c03"
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat:{
      forking: {
        //url: process.env.GOERII_URL_AlCHEMY,
        url: "https://bsc-dataseed1.binance.org/",
        allowUnlimitedContractSize: true,
        // timeout:90000,
        // //blockNumber:12325509
        // blockNumber:7022764,
        chainId:56,
        // gas:9000000000000000
      }
      
    },
     binanceTest: {
       url: "https://bsc-dataseed3.ninicoin.io/",
       accounts:['1ca414de8efab902e9fe43e5e0660a0e58d21fa3891fe9132b32f2c85367f2ad'],
       allowUnlimitedContractSize: true,
       
     },
    
    
    // goerli: {
    // url: process.env.GOERII_URL_AlCHEMY,
    // accounts:{
    //   mnemonic: process.env.MNEMONIC,
    //   path: "m/44'/60'/0'/0",
    //   initialIndex: 0,
    //   count: 10,
    //   passphrase: "",
    // }
    // },
    // kovan: {
    //   url: process.env.KOVAN,
    //   accounts:{
    //     mnemonic: process.env.MNEMONIC,
    //     path: "m/44'/60'/0'/0",
    //     initialIndex: 0,
    //     count: 10,
    //     passphrase: "",
    //   }
    // },
    // mumbai:{
    //   url: process.env.POLYGON_MUMBAI_ALCHEMY,
    //   accounts:{
    //     mnemonic: process.env.MNEMONIC,
    //     path: "m/44'/60'/0'/0",
    //     initialIndex: 0,
    //     count: 10,
    //     passphrase: "",
    //   }
    // }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: "MMTH9PCYDD18ZYA6TKHA51TUKEJ536C33P",
    
  },
  
    solidity: {
      compilers: [
        {
          version: "0.8.0",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },
        {
          version: "0.8.7",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },
        {
          version: "0.8.11",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },

        {
          version: "0.5.16",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },

      ],
    
  },
  // mocha: {
  //   reporter: 'xunit',
  //   reporterOptions: {
  //     output: 'GIVERS_TEST-results.xml'
  //   }
  // }
};
