// function deployFunct(hre) {
//     console.log("Hi from deployFunct");
//    const { getNamedAccounts } = hre.getNamedAccounts;
//    const { deploy } = hre.deployments;
// }

const { network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
// The above line is the same as the following ones:
// const helperConfig = require("../helper-hardhat-config").networkConfig;
// const networkConfig = helperConfig.networkConfig;

// module.exports.default = deployFunct;

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // If the contract doesn't exist, we deploy a minimal version of it for local testing

    // when going for localhost or hardhat, we want to use a mock
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put priceFeed address here
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_SEPOLIA_API_KEY
    ) {
        await verify(fundMe.address, args);
    }

    log("---------------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
