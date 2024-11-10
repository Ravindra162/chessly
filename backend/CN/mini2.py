from mininet.topo import Topo
from mininet.util import dumpNodeConnections
from mininet.log import setLogLevel
from mininet.cli import CLI
from mininet.node import Controller
from mininet.node import OVSKernelSwitch
from mininet.link import TCLink
from mininet.net import Mininet


class Custom_topology (Topo):
    def build(self):
        
        h1 = self.addHost("h1",ip="10.0.0.1/24")
        h2 = self.addHost("h2",ip="10.0.0.2/24")
        h3 = self.addHost("h3",ip="10.0.0.3/24")
        
        s1 = self.addSwitch("s1")
        s2 = self.addSwitch("s2")
        s3 = self.addSwitch("s3")
        
        self.addLink("s1","h1",cls=TCLink,bw=10)
        self.addLink("s2","h2",cls=TCLink,bw=10)
        self.addLink("s3","h3",cls=TCLink,bw=10)
        
        
        
        self.addLink("s1","s2", cls=TCLink, bw=10)
        self.addLink("s2","s3",cls=TCLink,bw=10)
        
        
def start():
    topo = Custom_topology()
    net = Mininet(topo=topo, switch=OVSKernelSwitch, link=TCLink)
    
    net.start()
    
    CLI(net)
    
    net.stop()

if __name__ == "__main__":
    setLogLevel("info")
    start()