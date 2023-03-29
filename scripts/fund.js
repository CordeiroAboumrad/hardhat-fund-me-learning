const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

async function main() {
    const deployer = (await getNamedAccounts()).deployer;
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding contract...");
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.03"),
    });
    await transactionResponse.wait(1);
    console.log("Contract funded!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
