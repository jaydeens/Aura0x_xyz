// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VouchingContract {
    address public owner;
    address public constant PLATFORM_WALLET = 0x1c11262B204EE2d0146315A05b4cf42CA61D33e4;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 30; // 30% to platform, 70% to vouched user
    uint256 public constant REQUIRED_ETH_AMOUNT = 0.0001 ether; // Fixed amount for vouching
    
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
    
    uint256 public nextVouchId = 1;
    uint256 public totalVouchVolume;
    
    event VouchCreated(
        uint256 indexed vouchId,
        address indexed voucher,
        address indexed vouchedUser,
        uint256 amount,
        uint256 auraPoints
    );
    
    event PlatformFeePaid(uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function vouchForUser(address _vouchedUser, uint256 _auraPoints) external payable {
        require(msg.value == REQUIRED_ETH_AMOUNT, "Must send exactly 0.0001 ETH to vouch");
        require(_vouchedUser != address(0), "Invalid vouched user address");
        require(_vouchedUser != msg.sender, "Cannot vouch for yourself");
        
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 userAmount = msg.value - platformFee;
        
        // Send 70% directly to vouched user
        (bool userSuccess, ) = payable(_vouchedUser).call{value: userAmount}("");
        require(userSuccess, "Transfer to vouched user failed");
        
        // Send 30% directly to platform wallet
        (bool platformSuccess, ) = payable(PLATFORM_WALLET).call{value: platformFee}("");
        require(platformSuccess, "Transfer to platform failed");
        
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
        totalReceived[_vouchedUser] += userAmount;
        totalVouchVolume += msg.value;
        
        emit VouchCreated(nextVouchId, msg.sender, _vouchedUser, msg.value, _auraPoints);
        emit PlatformFeePaid(platformFee);
        nextVouchId++;
    }
    
    function getUserVouchStats(address _user) external view returns (
        uint256 totalVouchedAmount,
        uint256 totalReceivedAmount
    ) {
        return (
            totalVouched[_user],
            totalReceived[_user]
        );
    }
    
    function getVouch(uint256 _vouchId) external view returns (Vouch memory) {
        return vouches[_vouchId];
    }
    
    function getRequiredAmount() external pure returns (uint256) {
        return REQUIRED_ETH_AMOUNT;
    }
    
    function getPlatformWallet() external pure returns (address) {
        return PLATFORM_WALLET;
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