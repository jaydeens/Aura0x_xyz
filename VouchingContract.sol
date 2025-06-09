// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VouchingContract {
    address public owner;
    uint256 public platformFeePercentage = 40; // 40% to platform, 60% to vouched user
    
    struct Vouch {
        address voucher;
        address vouchedUser;
        uint256 amount;
        uint256 timestamp;
        uint256 auraPoints;
    }
    
    mapping(uint256 => Vouch) public vouches;
    mapping(address => uint256) public totalVouched;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public claimableAmount;
    
    uint256 public nextVouchId = 1;
    uint256 public totalVouchVolume;
    
    event VouchCreated(
        uint256 indexed vouchId,
        address indexed voucher,
        address indexed vouchedUser,
        uint256 amount,
        uint256 auraPoints
    );
    
    event EthClaimed(
        address indexed user,
        uint256 amount
    );
    
    event PlatformFeesWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function vouchForUser(address _vouchedUser, uint256 _auraPoints) external payable {
        require(msg.value > 0, "Must send ETH to vouch");
        require(_vouchedUser != address(0), "Invalid vouched user address");
        require(_vouchedUser != msg.sender, "Cannot vouch for yourself");
        
        uint256 platformFee = (msg.value * platformFeePercentage) / 100;
        uint256 userAmount = msg.value - platformFee;
        
        // Create vouch record
        vouches[nextVouchId] = Vouch({
            voucher: msg.sender,
            vouchedUser: _vouchedUser,
            amount: msg.value,
            timestamp: block.timestamp,
            auraPoints: _auraPoints
        });
        
        // Update tracking
        totalVouched[msg.sender] += msg.value;
        totalReceived[_vouchedUser] += msg.value;
        claimableAmount[_vouchedUser] += userAmount;
        totalVouchVolume += msg.value;
        
        emit VouchCreated(nextVouchId, msg.sender, _vouchedUser, msg.value, _auraPoints);
        nextVouchId++;
    }
    
    function claimEth() external {
        uint256 amount = claimableAmount[msg.sender];
        require(amount > 0, "No ETH to claim");
        
        claimableAmount[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit EthClaimed(msg.sender, amount);
    }
    
    function getClaimableAmount(address _user) external view returns (uint256) {
        return claimableAmount[_user];
    }
    
    function getUserVouchStats(address _user) external view returns (
        uint256 totalVouchedAmount,
        uint256 totalReceivedAmount,
        uint256 claimable
    ) {
        return (
            totalVouched[_user],
            totalReceived[_user],
            claimableAmount[_user]
        );
    }
    
    function getVouch(uint256 _vouchId) external view returns (Vouch memory) {
        return vouches[_vouchId];
    }
    
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "ETH transfer failed");
        
        emit PlatformFeesWithdrawn(owner, balance);
    }
    
    function setPlatformFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 50, "Platform fee cannot exceed 50%");
        platformFeePercentage = _percentage;
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }
    
    // Get contract stats
    function getContractStats() external view returns (
        uint256 totalVouches,
        uint256 totalVolume,
        uint256 platformBalance
    ) {
        return (
            nextVouchId - 1,
            totalVouchVolume,
            address(this).balance
        );
    }
}