#!/usr/bin/python

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import OVSKernelSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink

class CustomTopo(Topo):
    "Custom topology with 3 hosts and 3 switches in linear connection"
    
    def build(self):
        # Add switches
        info('*** Adding switches\n')
        s1 = self.addSwitch('s1')
        s2 = self.addSwitch('s2')
        s3 = self.addSwitch('s3')
        
        # Add hosts
        info('*** Adding hosts\n')
        h1 = self.addHost('h1', ip='10.0.0.1/24')
        h2 = self.addHost('h2', ip='10.0.0.2/24')
        h3 = self.addHost('h3', ip='10.0.0.3/24')
        
        # Add links between switches (s1 -- s2 -- s3)
        info('*** Adding switch links\n')
        self.addLink(s1, s2, cls=TCLink, bw=10)
        self.addLink(s2, s3, cls=TCLink, bw=10)
        
        # Connect each host to its respective switch
        info('*** Adding host links\n')
        self.addLink(h1, s1, cls=TCLink, bw=10)
        self.addLink(h2, s2, cls=TCLink, bw=10)
        self.addLink(h3, s3, cls=TCLink, bw=10)

def test_network():
    "Create and test network"
    topo = CustomTopo()
    net = Mininet(topo=topo, switch=OVSKernelSwitch, link=TCLink)
    net.start()
    
    info('*** Network topology:\n')
    info('h1 --- s1 --- s2 --- s3 --- h3\n')
    info('              |\n')
    info('              h2\n\n')

    # Get hosts
    h1, h2, h3 = net.get('h1', 'h2', 'h3')
    
    info('*** Testing connectivity with detailed ping logs:\n')
    
    # Test h1 -> h2
    info('\nTesting h1 -> h2:\n')
    h1.cmd('ping -c 3 10.0.0.2')
    
    # Test h2 -> h3
    info('\nTesting h2 -> h3:\n')
    h2.cmd('ping -c 3 10.0.0.3')
    
    # Test h1 -> h3
    info('\nTesting h1 -> h3:\n')
    h1.cmd('ping -c 3 10.0.0.3')
    
    info('\n*** Starting CLI:\n')
    CLI(net)
    
    info('\n*** Stopping network\n')
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    test_network()