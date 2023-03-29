// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./PriceConverter.sol";
import "hardhat/console.sol";

// constant and immutable keywords can help lowering transaction costs

error FundMe__NotOwner();

/**
 * @title FundMe
 * @author Jean Aboumrad
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type declarations
    using PriceConverter for uint256;

    // State variables
    // i_ : immutable
    // s_ : storage
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not the owner!");
        console.log("Checking whether the user is the contract owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // The _; resumes the functions that call this modifier
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    /**
     * @notice This function funds this contract
     * @dev This function is payable, so it can receive ETH
     */
    function fund() public payable {
        // Want to be able to set a minimum fund amouont in USD
        // 1. How do we send ETH with this contract?

        // The require is a checker, to check whether the minimum value was achieved
        // msg.value e msg.sender are always available global keywords

        // Parameters for the getConvertionRate function:
        // 1st parameter: msg.value
        // 2nd parameter: priceFeed
        require(
            msg.value.getConvertionRate(s_priceFeed) >= MINIMUM_USD,
            "Did not send enough!"
        ); // 1e18 == 1 * 10 ** 18 (value of wei, quivalent to 1 ETH)
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funderAddress = s_funders[funderIndex];
            s_addressToAmountFunded[funderAddress] = 0;
        }
        // reset the array
        s_funders = new address[](0);
        // actually withdraw from the funds

        // msg.sender is of type address, whereas payable(msg.sender) is of type payable address
        // 3 different ways to withdraw:
        // transfer - automatically reverts transactions, when they fail
        // payable(msg.sender).transfer(address(this).balance);

        // send - needs to be attached to a require, in order to revert, in case the tx fails
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        // Observation: Mappings can't be in memory, only in storage
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funderAddress = funders[funderIndex];
            s_addressToAmountFunded[funderAddress] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    // View / Pure functions
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }
}
