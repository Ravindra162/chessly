#!/usr/bin/python

from mininet.net import Mininet
from mininet.node import Host
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def setupNetwork():
    net = Mininet(cleanup=True)
    
    # Add PCs that will act as routers
    info('*** Adding PC routers\n')
    pc1 = net.addHost('pc1')  # First PC acting as router
    pc2 = net.addHost('pc2')  # Second PC acting as router
    
    # Add hosts
    info('*** Adding regular hosts\n')
    h1 = net.addHost('h1', ip='10.0.1.100/24', defaultRoute='via 10.0.1.1')
    h2 = net.addHost('h2', ip='10.0.2.100/24', defaultRoute='via 10.0.2.1')
    h3 = net.addHost('h3', ip='10.0.3.100/24', defaultRoute='via 10.0.3.1')
    
    # Add links
    info('*** Creating links\n')
    # Connect hosts to PC1
    net.addLink(h1, pc1)
    net.addLink(h2, pc1)
    # Connect h3 to PC2
    net.addLink(h3, pc2)
    # Connect PC routers together
    net.addLink(pc1, pc2)
    
    net.start()
    
    # Configure PC1's interfaces
    pc1.cmd('ifconfig pc1-eth0 10.0.1.1/24')
    pc1.cmd('ifconfig pc1-eth1 10.0.2.1/24')
    pc1.cmd('ifconfig pc1-eth2 10.0.4.1/24')
    
    # Configure PC2's interfaces
    pc2.cmd('ifconfig pc2-eth0 10.0.3.1/24')
    pc2.cmd('ifconfig pc2-eth1 10.0.4.2/24')
    
    # Enable IP forwarding on PC routers
    pc1.cmd('sysctl net.ipv4.ip_forward=1')
    pc2.cmd('sysctl net.ipv4.ip_forward=1')
    
    # Add routing for reaching networks that aren't directly connected
    pc1.cmd('ip route add 10.0.3.0/24 via 10.0.4.2')
    pc2.cmd('ip route add 10.0.1.0/24 via 10.0.4.1')
    pc2.cmd('ip route add 10.0.2.0/24 via 10.0.4.1')
    
    # For cleaning up when done
    def stopNetwork():
        pc1.cmd('sysctl net.ipv4.ip_forward=0')
        pc2.cmd('sysctl net.ipv4.ip_forward=0')
        net.stop()
    
    info('*** Running CLI\n')
    CLI(net)
    stopNetwork()

if __name__ == '__main__':
    setLogLevel('info')
    setupNetwork()