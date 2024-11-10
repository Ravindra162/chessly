    from mininet.topo import Topo
    from mininet.net import Mininet
    from mininet.log import setLogLevel
    from mininet.link import TCLink
    from mininet.util import dumpNodeConnections
    from mininet.node import OVSKernelSwitch
    from mininet.node import Controller
    from mininet.cli import CLI


    class CustomTopo(Topo):
        def build(self):
            
            s1 = self.addSwitch('s1')
            s2 = self.addSwitch('s2')
            
            h1 = self.addHost('h1', ip='10.0.0.1/24')
            h2 = self.addHost('h2', ip='10.0.0.2/24')
            
            self.addLink(s1,h1,cls=TCLink,bw=10)
            self.addLink(s2,h2,cls=TCLink,bw=10)
            
    def test_network():
        topo = CustomTopo()
        
        net = Mininet(topo=topo, controller=Controller, link=TCLink)
        net.start()
        
        dumpNodeConnections(net.hosts)
        CLI(net)
        net.stop()
        

    test_network()