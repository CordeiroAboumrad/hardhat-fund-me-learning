const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1"); // 1 ETH
          let deployer;
          beforeEach(async function () {
              // deployer = (await getNamedAccounts()).deployer;
              deployer = (await getNamedAccounts()).deployer;

              // ethers.getSigners is gonna return whatever accounts we have in our chosen network (hardhat.config.js)
              await deployments.fixture(["all"]);
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];

              // deploy our FundMe contract using hardhat deploy
              // Gets the most recent deployment of the contract
              fundMe = await ethers.getContract("FundMe", deployer);

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async function () {
              it("Sets the aggregator addresses correctly", async function () {
                  // Test will run locally
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async function () {
              it("Should fail if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Did not send enough!"
                  );
              });

              it("Should update the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );

                  assert.equal(sendValue.toString(), response.toString());
              });

              it("Should populate funders array", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getFunder(0);
                  assert.equal(response, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("Should be able to withdraw ETH from a single founder", async function () {
                  // Arrange, Act, Assert
                  // Arrange

                  // Gets the balance of any contract, of the object provider
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;

                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  assert.equal(finalFundMeBalance, 0);
                  // We want to make sure that we add the gas cost to the equation
                  assert.equal(
                      initialDeployerBalance
                          .add(initialFundMeBalance)
                          .toString(),
                      finalDeployerBalance.add(gasCost).toString()
                  );
              });

              it("Allows us to fund with multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );

                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      });
                  }

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;

                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("Should only allow the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted;
              });

              it("Cheaper withdraw testing for single funder...", async function () {
                  // Arrange, Act, Assert
                  // Arrange

                  // Gets the balance of any contract, of the object provider
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;

                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  assert.equal(finalFundMeBalance, 0);
                  // We want to make sure that we add the gas cost to the equation
                  assert.equal(
                      initialDeployerBalance
                          .add(initialFundMeBalance)
                          .toString(),
                      finalDeployerBalance.add(gasCost).toString()
                  );
              });

              it("Cheaper withdraw testing for multiple funders...", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );

                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      });
                  }

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;

                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const finalFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });
