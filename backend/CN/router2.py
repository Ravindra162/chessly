rom mininet.net import Mininet
from mininet.topo import Topo
from mininet.cli import CLI
from mininet.link import TCLink

class CustomTopo(Topo):
    def build(self):
        h1 = self.addHost('h1')
        h2 = self.addHost('h2')
        r1 = self.addHost('r1')

        self.addLink(h1, r1, cls=TCLink, bw=10)
        self.addLink(h2, r1, cls=TCLink, bw=10)

if _name_ == '_main_':
    net = Mininet(topo=CustomTopo())

    net.start()

    h1, h2, r1 = net.get('h1', 'h2', 'r1')

    h1.setIP('10.0.0.1', 24,intf='h1-eth0')
    r1.setIP('10.0.0.2', 24,intf='r1-eth0')
    r1.setIP('10.0.1.1', 24,intf='r1-eth1')
    h2.setIP('10.0.1.2', 24,intf='h2-eth0')

    r1.cmd('sysctl -w net.ipv4.ip_forward=1')
    h1.cmd('ip route add default via 10.0.0.2 dev h1-eth0')
    h2.cmd('ip route add default via 10.0.1.1 dev h2-eth0')

    net.interact()
    net.stop()
