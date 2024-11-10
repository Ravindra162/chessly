# Create the namespaces
sudo ip netns add one
sudo ip netns add two
sudo ip netns add three

# Create veth pairs
sudo ip link add veth-one-two type veth peer name veth-two-one
sudo ip link add veth-two-three type veth peer name veth-three-two

# Move interfaces to respective namespaces
sudo ip link set veth-one-two netns one
sudo ip link set veth-two-one netns two
sudo ip link set veth-two-three netns two
sudo ip link set veth-three-two netns three

# Configure IP addresses and bring up interfaces in namespace 'one'
sudo ip netns exec one ip addr add 10.0.0.1/24 dev veth-one-two
sudo ip netns exec one ip link set veth-one-two up
sudo ip netns exec one ip link set lo up

# Configure IP addresses and bring up interfaces in namespace 'two' (router)
# Assign unique IPs to avoid conflicts
sudo ip netns exec two ip addr add 10.0.0.2/24 dev veth-two-one
sudo ip netns exec two ip link set veth-two-one up
sudo ip netns exec two ip addr add 10.0.0.4/24 dev veth-two-three
sudo ip netns exec two ip link set veth-two-three up
sudo ip netns exec two ip link set lo up

# Configure IP addresses and bring up interfaces in namespace 'three'
sudo ip netns exec three ip addr add 10.0.0.3/24 dev veth-three-two
sudo ip netns exec three ip link set veth-three-two up
sudo ip netns exec three ip link set lo up

# Enable IP forwarding in namespace 'two' (the router)
sudo ip netns exec two sysctl -w net.ipv4.ip_forward=1

# Configure routing in namespace 'one' to reach namespace 'three' through 'two'
sudo ip netns exec one ip route del default 2>/dev/null
sudo ip netns exec one ip route add default via 10.0.0.2 dev veth-one-two

# Configure routing in namespace 'three' to reach namespace 'one' through 'two'
sudo ip netns exec three ip route del default 2>/dev/null
sudo ip netns exec three ip route add default via 10.0.0.4 dev veth-three-two

# Verify the configuration
echo "Routes in namespace 'one':"
sudo ip netns exec one ip route
echo -e "\nRoutes in namespace 'two':"
sudo ip netns exec two ip route
echo -e "\nRoutes in namespace 'three':"
sudo ip netns exec three ip route

# Test connectivity
echo -e "\nPinging from 'one' to 'three':"
sudo ip netns exec one ping -c 3 10.0.0.3
echo -e "\nPinging from 'three' to 'one':"
sudo ip netns exec three ping -c 3 10.0.0.1
